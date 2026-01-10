import express from 'express';
import multer from 'multer';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import { blockchainService } from '../services/blockchain.js';
import { generateAssignmentId } from '../utils/helpers.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// Submit assignment
router.post('/submit', authenticateToken, requireRole('student'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { assignmentId, aiUsageType, aiTokenCount, assignmentTitle, course } = req.body;

    if (!assignmentId || !aiUsageType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if assignment exists, create if not
    const existingAssignment = await db.getAsync('SELECT id FROM assignments WHERE id = ?', [assignmentId]);
    if (!existingAssignment) {
      // Auto-create assignment if it doesn't exist
      const assignmentData = {
        id: assignmentId,
        title: assignmentTitle || `Assignment ${assignmentId}`,
        course: course || 'General',
        due_date: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        created_at: Date.now()
      };
      
      await db.runAsync(`
        INSERT INTO assignments (id, title, course, due_date, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        assignmentData.id,
        assignmentData.title,
        assignmentData.course,
        assignmentData.due_date,
        assignmentData.created_at
      ]);
      
      console.log(`✅ Auto-created assignment: ${assignmentId}`);
    }

    // Calculate file hash
    const fileBuffer = readFileSync(req.file.path);
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // Prepare submission data
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const studentIdHash = createHash('sha256').update(req.user.id).digest('hex');

    // Submit to blockchain
    let blockchainResult;
    try {
      console.log('🔗 Submitting to blockchain...');
      console.log('   Blockchain initialized:', blockchainService.initialized);
      console.log('   Contract available:', !!blockchainService.contract);
      console.log('   Network:', blockchainService.network);
      
      blockchainResult = await blockchainService.submitRecord(
        'submission',
        submissionId,
        fileHash
      );
      
      if (!blockchainResult || !blockchainResult.hash) {
        throw new Error('Blockchain submission returned invalid result');
      }
      
      console.log(`✅ Blockchain submission successful: ${blockchainResult.hash}`);
    } catch (blockchainError) {
      console.error('❌ Blockchain submission error:', blockchainError);
      console.error('   Error message:', blockchainError.message);
      console.error('   Error code:', blockchainError.code);
      console.error('   Error reason:', blockchainError.reason);
      
      // Return detailed error to frontend
      const errorMessage = blockchainError.message || 'Unknown blockchain error';
      return res.status(500).json({ 
        success: false, 
        error: 'Blockchain submission failed',
        details: errorMessage,
        suggestion: errorMessage.includes('insufficient') 
          ? 'Get testnet MATIC from https://faucet.polygon.technology/'
          : 'Check server logs for more details'
      });
    }

    // Save to database
    await db.runAsync(`
      INSERT INTO submissions (
        id, assignment_id, student_id, file_path, file_hash,
        ai_usage_type, ai_token_count, blockchain_hash, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      submissionId,
      assignmentId,
      req.user.id,
      req.file.path,
      fileHash,
      aiUsageType,
      parseInt(aiTokenCount) || 0,
      blockchainResult.hash,
      timestamp,
      Date.now()
    ]);

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, blockchain_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'assignment_submitted',
      'submission',
      submissionId,
      blockchainResult.hash,
      Date.now()
    ]);

    res.json({
      success: true,
      data: {
        submissionId,
        fileHash,
        blockchainHash: blockchainResult.hash,
        timestamp
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
});

// Get assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const assignments = await db.allAsync('SELECT * FROM assignments ORDER BY due_date DESC');
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// Get user submissions
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await db.allAsync(`
      SELECT s.*, a.title as assignment_title, a.course
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

export default router;

