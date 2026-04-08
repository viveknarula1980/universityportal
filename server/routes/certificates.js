import express from 'express';
import { createHash } from 'crypto';
import QRCode from 'qrcode';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import { blockchainService } from '../services/blockchain.js';
import { generateCertificateId } from '../utils/helpers.js';
import { aiService } from '../services/ai.js';
import { upload } from '../services/storage.js';
const router = express.Router();

// Issue certificate
router.post('/issue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { studentId, studentName, degreeName, degreeType, issueDate } = req.body;

    console.log('📝 Certificate issuance request:', {
      studentId,
      studentName,
      degreeName,
      degreeType,
      issueDate,
      hasAllFields: !!(studentId && studentName && degreeName && degreeType)
    });

    if (!studentId || !studentName || !degreeName || !degreeType) {
      const missingFields = [];
      if (!studentId) missingFields.push('studentId');
      if (!studentName) missingFields.push('studentName');
      if (!degreeName) missingFields.push('degreeName');
      if (!degreeType) missingFields.push('degreeType');
      
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const certificateId = generateCertificateId();
    const timestamp = Date.now();
    const studentIdHash = createHash('sha256').update(studentId).digest('hex');

    // Create certificate data
    // Parse issue date safely - fallback to current time if invalid
    const parsedIssueDate = issueDate ? new Date(issueDate).getTime() : Date.now();
    const safeIssueDate = isNaN(parsedIssueDate) ? Date.now() : parsedIssueDate;

    const certificateData = {
      certificateId,
      degreeName: `${degreeType} in ${degreeName}`,
      universitySignature: process.env.UNIVERSITY_SIGNATURE_KEY || 'university-signature',
      issueDate: safeIssueDate,
      revocationStatus: false,
      studentId: studentIdHash
    };

    // Submit to blockchain
    const dataHash = createHash('sha256')
      .update(JSON.stringify(certificateData))
      .digest('hex');

    const blockchainResult = await blockchainService.submitRecord(
      'certificate',
      certificateId,
      dataHash
    );

    // Store both the transaction hash and the data hash for verification
    // The contract stores records by dataHash, but we also need the transaction hash for explorer links
    const storedHash = blockchainResult.hash; // Transaction hash
    const verificationHash = dataHash; // Data hash used in contract

    // Generate QR code
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // Find user by student ID to get the actual user ID
    // The foreign key constraint requires student_id to reference users(id), not users(student_id)
    // So we need to find the user by their student_id field, then use their id field
    const user = await db.getAsync('SELECT id FROM users WHERE student_id = ? OR id = ?', [studentId, studentId]);
    
    if (!user) {
      // User doesn't exist - return error with helpful message
      return res.status(400).json({ 
        success: false, 
        error: `Student with ID "${studentId}" not found. Please ensure the student exists in the system.` 
      });
    }

    const actualStudentId = user.id;
    console.log(`✅ Found user: ${actualStudentId} for student ID: ${studentId}`);

    // Save to database
    await db.runAsync(`
      INSERT INTO certificates (
        id, student_id, student_name, degree_name, degree_type,
        issue_date, blockchain_hash, university_signature, qr_code_url, university_id, revocation_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      certificateId,
      actualStudentId,
      studentName,
      certificateData.degreeName,
      degreeType,
      certificateData.issueDate,
      blockchainResult.hash,
      certificateData.universitySignature,
      verificationUrl,
      req.user.university_id || 'default',
      0,
      Date.now()
    ]);

    // Store dataHash in blockchain_records for verification
    // The contract stores records by dataHash, not transaction hash
    await db.runAsync(`
      INSERT INTO blockchain_records (
        id, record_type, record_id, blockchain_hash, transaction_data, block_number, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `, [
      `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      'certificate',
      certificateId,
      dataHash, // Data hash used in contract verification
      JSON.stringify({ 
        transactionHash: blockchainResult.hash, 
        certificateData,
        blockNumber: blockchainResult.blockNumber 
      }),
      blockchainResult.blockNumber || null,
      Date.now(),
      Date.now()
    ]);

    console.log(`✅ Certificate saved to database: ${certificateId}`);
    console.log(`   Student: ${studentName} (ID: ${actualStudentId}, Student ID: ${studentId})`);
    console.log(`   Degree: ${certificateData.degreeName}`);
    console.log(`   Issue Date: ${new Date(certificateData.issueDate).toLocaleDateString()}`);
    console.log(`   Transaction Hash: ${blockchainResult.hash}`);
    console.log(`   Data Hash (for verification): ${dataHash}`);

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, blockchain_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'certificate_issued',
      'certificate',
      certificateId,
      blockchainResult.hash,
      Date.now()
    ]);

    res.json({
      success: true,
      data: {
        certificateId,
        blockchainHash: blockchainResult.hash,
        qrCodeUrl: verificationUrl,
        qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Certificate issuance error:', error);
    res.status(500).json({ success: false, error: 'Failed to issue certificate' });
  }
});

// Verify certificate
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await db.getAsync('SELECT * FROM certificates WHERE id = ?', [certificateId]);

    if (!certificate) {
      return res.json({
        success: true,
        data: {
          certificateId,
          status: 'not_found'
        }
      });
    }

    // Verify on blockchain
    // The contract stores records by dataHash, not transaction hash
    // Get the dataHash from blockchain_records
    const blockchainRecord = await db.getAsync(
      'SELECT blockchain_hash FROM blockchain_records WHERE record_id = ? AND record_type = ? ORDER BY created_at DESC LIMIT 1',
      [certificateId, 'certificate']
    );
    
    let isVerified = false;
    if (blockchainRecord) {
      // Verify using the data hash (what's stored in the contract)
      console.log(`🔍 Verifying certificate with dataHash: ${blockchainRecord.blockchain_hash}`);
      isVerified = await blockchainService.verifyRecord(blockchainRecord.blockchain_hash);
      console.log(`   Verification result: ${isVerified}`);
    } else {
      // Fallback: try verifying with transaction hash (for older records or direct transactions)
      console.log(`⚠️  No blockchain record found, trying transaction hash: ${certificate.blockchain_hash}`);
      isVerified = await blockchainService.verifyRecord(certificate.blockchain_hash);
      console.log(`   Verification result (fallback): ${isVerified}`);
    }

    // Determine status: revoked > invalid > valid
    let status = 'valid';
    if (Number(certificate.revocation_status) === 1) {
      status = 'revoked';
    } else if (!isVerified) {
      status = 'invalid';
    }

    console.log(`✅ Certificate verification complete: ${certificateId}, status=${status}`);

    res.json({
      success: true,
      data: {
        id: certificate.id,
        certificateId: certificate.id,
        degreeName: certificate.degree_name,
        degree_name: certificate.degree_name,
        universityName: process.env.UNIVERSITY_NAME || 'AI-Transparent University',
        issueDate: certificate.issue_date,
        issue_date: certificate.issue_date,
        status: status,
        revocation_status: certificate.revocation_status,
        blockchainHash: certificate.blockchain_hash,
        blockchain_hash: certificate.blockchain_hash,
        studentName: certificate.student_name,
        student_name: certificate.student_name
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Get certificates (all for admin/faculty, own for student)
router.get('/', authenticateToken, requireRole('admin', 'student', 'faculty'), async (req, res) => {
  try {
    let certificates;
    if (req.user.role === 'admin' || req.user.role === 'faculty') {
      // Admins and faculty can see certificates scoped to their university
      certificates = await db.allAsync('SELECT * FROM certificates WHERE university_id = ? ORDER BY created_at DESC', [req.user.university_id || 'default']);
    } else {
      // Students can only see their own certificates
      // Note: student_id in certificates table points to users.id
      certificates = await db.allAsync(
        'SELECT * FROM certificates WHERE student_id = ? AND university_id = ? ORDER BY created_at DESC',
        [req.user.id, req.user.university_id || 'default']
      );
    }
    
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

// Get certificate blockchain records for admin
router.get('/blockchain-records', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const certificates = await db.allAsync(`
      SELECT 
        c.*,
        u.student_id,
        br.blockchain_hash as data_hash,
        br.block_number,
        br.timestamp as blockchain_timestamp
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN blockchain_records br ON br.record_id = c.id AND br.record_type = 'certificate'
      WHERE c.blockchain_hash IS NOT NULL AND c.university_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.university_id || 'default']);
    
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificate blockchain records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificate blockchain records' });
  }
});

// Revoke certificate
router.post('/:certificateId/revoke', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { certificateId } = req.params;

    await db.runAsync('UPDATE certificates SET revocation_status = 1 WHERE id = ?', [certificateId]);

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'certificate_revoked',
      'certificate',
      certificateId,
      Date.now()
    ]);

    res.json({ success: true, message: 'Certificate revoked' });
  } catch (error) {
    console.error('Revocation error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke certificate' });
  }
});

/**
 * AI Extract degree info from image
 * POST /api/certificates/extract
 */
router.post('/extract', authenticateToken, requireRole('admin'), upload.single('degreeImage'), async (req, res) => {
  try {
    let base64Data;
    let mimeType;

    if (req.file) {
      // Handle file upload
      base64Data = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
    } else if (req.body.image) {
      // Handle base64 string
      const matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, error: 'Invalid base64 image data' });
      }
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    console.log(`🤖 AI Extraction requested for ${mimeType} (${(base64Data.length * 0.75 / 1024).toFixed(2)} KB)`);
    
    const extractedData = await aiService.extractDegreeInfo(base64Data, mimeType);
    
    console.log('✅ AI Extracted Data:', extractedData);
    
    res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('AI Extraction error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to extract degree information' });
  }
});

/**
 * Bulk issue certificates
 * POST /api/certificates/bulk-issue
 */
router.post('/bulk-issue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { certificates } = req.body; // Array of certificate data

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ success: false, error: 'No certificates provided' });
    }

    console.log(`📝 Bulk issuance request for ${certificates.length} certificates`);

    const results = [];
    const errors = [];

    for (const cert of certificates) {
      try {
        const { studentId, studentName, degreeName, degreeType, issueDate } = cert;

        // Basic validation
        if (!studentId || !studentName || !degreeName || !degreeType) {
          throw new Error('Missing required fields for student: ' + (studentName || studentId || 'Unknown'));
        }

        const certificateId = generateCertificateId();
        const studentIdHash = createHash('sha256').update(studentId).digest('hex');

        // Create certificate data
        // Parse issue date safely - fallback to current time if invalid
        const parsedIssueDate = issueDate ? new Date(issueDate).getTime() : Date.now();
        const safeIssueDate = isNaN(parsedIssueDate) ? Date.now() : parsedIssueDate;

        const certificateData = {
          certificateId,
          degreeName: `${degreeType} in ${degreeName}`,
          universitySignature: process.env.UNIVERSITY_SIGNATURE_KEY || 'university-signature',
          issueDate: safeIssueDate,
          revocationStatus: false,
          studentId: studentIdHash
        };

        // Submit to blockchain
        const dataHash = createHash('sha256')
          .update(JSON.stringify(certificateData))
          .digest('hex');

        const blockchainResult = await blockchainService.submitRecord(
          'certificate',
          certificateId,
          dataHash
        );

        // Find user by student ID
        const user = await db.getAsync('SELECT id FROM users WHERE student_id = ? OR id = ?', [studentId, studentId]);
        
        if (!user) {
          throw new Error(`Student with ID "${studentId}" not found`);
        }

        const actualStudentId = user.id;

        // Save to database
        await db.runAsync(`
          INSERT INTO certificates (
            id, student_id, student_name, degree_name, degree_type,
            issue_date, blockchain_hash, university_signature, qr_code_url, university_id, revocation_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          certificateId,
          actualStudentId,
          studentName,
          certificateData.degreeName,
          degreeType,
          certificateData.issueDate,
          blockchainResult.hash,
          certificateData.universitySignature,
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificateId}`,
          req.user.university_id || 'default',
          0,
          Date.now()
        ]);

        // Store dataHash in blockchain_records
        await db.runAsync(`
          INSERT INTO blockchain_records (
            id, record_type, record_id, blockchain_hash, transaction_data, block_number, timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT DO NOTHING
        `, [
          `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          'certificate',
          certificateId,
          dataHash,
          JSON.stringify({ 
            transactionHash: blockchainResult.hash, 
            certificateData,
            blockNumber: blockchainResult.blockNumber 
          }),
          blockchainResult.blockNumber || null,
          Date.now(),
          Date.now()
        ]);

        results.push({
          studentId,
          studentName,
          certificateId,
          blockchainHash: blockchainResult.hash
        });
      } catch (err) {
        console.error(`❌ Error issuing certificate for student: ${cert.studentName}`, err.message);
        errors.push({
          studentId: cert.studentId,
          studentName: cert.studentName,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      issued: results.length,
      failed: errors.length,
      data: results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk issuance error:', error);
    res.status(500).json({ success: false, error: 'Bulk issuance failed' });
  }
});

export default router;

