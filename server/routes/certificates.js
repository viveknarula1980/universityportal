import express from 'express';
import { createHash } from 'crypto';
import QRCode from 'qrcode';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import { blockchainService } from '../services/blockchain.js';
import { generateCertificateId } from '../utils/helpers.js';

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
    const certificateData = {
      certificateId,
      degreeName: `${degreeType} in ${degreeName}`,
      universitySignature: process.env.UNIVERSITY_SIGNATURE_KEY || 'university-signature',
      issueDate: new Date(issueDate).getTime(),
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
        issue_date, blockchain_hash, university_signature, qr_code_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Date.now()
    ]);

    // Store dataHash in blockchain_records for verification
    // The contract stores records by dataHash, not transaction hash
    await db.runAsync(`
      INSERT OR IGNORE INTO blockchain_records (
        id, record_type, record_id, blockchain_hash, transaction_data, block_number, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    if (certificate.revocation_status === 1) {
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

// Get all certificates
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const certificates = await db.allAsync('SELECT * FROM certificates ORDER BY created_at DESC');
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
      WHERE c.blockchain_hash IS NOT NULL
      ORDER BY c.created_at DESC
    `);
    
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

export default router;

