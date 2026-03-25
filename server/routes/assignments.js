import express from 'express';
import multer from 'multer';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import { blockchainService } from '../services/blockchain.js';
import { generateAssignmentId } from '../utils/helpers.js';

import { upload } from '../services/storage.js';
const router = express.Router();

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
    let fileHash;
    if (req.file.buffer) {
      fileHash = createHash('sha256').update(req.file.buffer).digest('hex');
    } else if (req.file.path && !req.file.path.startsWith('http')) {
      const fileBuffer = readFileSync(req.file.path);
      fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    } else {
      fileHash = req.body.fileHash || createHash('sha256').update(req.file.path).digest('hex');
    }

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

    // Save to database (add original_filename column if it doesn't exist)
    try {
      await db.runAsync(`
        ALTER TABLE submissions ADD COLUMN original_filename TEXT
      `);
    } catch (err) {
      // Column might already exist, ignore error
    }

    await db.runAsync(`
      INSERT INTO submissions (
        id, assignment_id, student_id, file_path, file_hash, original_filename,
        ai_usage_type, ai_token_count, blockchain_hash, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      submissionId,
      assignmentId,
      req.user.id,
      req.file.path,
      fileHash,
      req.file.originalname || req.file.filename,
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

// Get user submissions (for students)
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

// Get all submissions for faculty (with student info)
router.get('/faculty/submissions', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { course, status, search } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.assignment_id,
        s.file_path,
        s.file_hash,
        s.original_filename,
        s.ai_usage_type,
        s.ai_token_count,
        s.blockchain_hash,
        s.timestamp,
        s.status,
        s.grade,
        s.created_at,
        a.title as assignment_title,
        a.course,
        u.name as student_name,
        u.student_id,
        u.email as student_email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON s.student_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (course && course !== 'all') {
      query += ' AND a.course = ?';
      params.push(course);
    }
    
    if (status && status !== 'all') {
      query += ' AND s.status = ?';
      params.push(status);
    }
    
    if (search) {
      query += ' AND (u.name LIKE ? OR u.student_id LIKE ? OR a.title LIKE ? OR a.course LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const submissions = await db.allAsync(query, params);
    
    // Calculate stats
    const totalSubmissions = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const aiAssisted = submissions.filter(s => s.ai_usage_type && s.ai_usage_type !== 'none').length;
    
    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade);
    let averageGrade = 'N/A';
    if (gradedSubmissions.length > 0) {
      const gradeValues = {
        'A+': 4.3, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
      };
      
      const totalPoints = gradedSubmissions.reduce((sum, s) => {
        const grade = s.grade?.trim().toUpperCase() || '';
        return sum + (gradeValues[grade] || 0);
      }, 0);
      
      const avgPoints = totalPoints / gradedSubmissions.length;
      
      // Convert back to letter grade
      if (avgPoints >= 4.0) averageGrade = 'A';
      else if (avgPoints >= 3.7) averageGrade = 'A-';
      else if (avgPoints >= 3.3) averageGrade = 'B+';
      else if (avgPoints >= 3.0) averageGrade = 'B';
      else if (avgPoints >= 2.7) averageGrade = 'B-';
      else if (avgPoints >= 2.3) averageGrade = 'C+';
      else if (avgPoints >= 2.0) averageGrade = 'C';
      else if (avgPoints >= 1.7) averageGrade = 'C-';
      else if (avgPoints >= 1.3) averageGrade = 'D+';
      else if (avgPoints >= 1.0) averageGrade = 'D';
      else averageGrade = 'F';
    }
    
    res.json({
      success: true,
      data: {
        submissions: submissions,
        stats: {
          totalSubmissions,
          pending,
          aiAssisted,
          averageGrade
        }
      }
    });
  } catch (error) {
    console.error('Error fetching faculty submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Get submission details (for viewing file)
router.get('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await db.getAsync(`
      SELECT 
        s.*,
        a.title as assignment_title,
        a.course,
        u.name as student_name,
        u.student_id,
        u.email as student_email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [submissionId]);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    // Check if user has permission (student can only see their own, faculty can see all)
    if (req.user.role === 'student' && submission.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submission details' });
  }
});

// Grade submission
router.post('/submissions/:submissionId/grade', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade } = req.body;
    
    if (!grade) {
      return res.status(400).json({ success: false, error: 'Grade is required' });
    }
    
    await db.runAsync(`
      UPDATE submissions
      SET status = 'graded', grade = ?
      WHERE id = ?
    `, [grade, submissionId]);
    
    // Log to audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'assignment_graded',
      'submission',
      submissionId,
      `Grade: ${grade}`,
      Date.now()
    ]);
    
    res.json({ success: true, message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ success: false, error: 'Failed to grade submission' });
  }
});

// Download submission file
router.get('/submissions/:submissionId/download', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await db.getAsync(`
      SELECT s.*, u.id as student_user_id
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [submissionId]);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    // Check if user has permission
    if (req.user.role === 'student' && submission.student_user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const { readFileSync, existsSync } = await import('fs');
    const path = await import('path');
    
    if (!existsSync(submission.file_path)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const fileBuffer = readFileSync(submission.file_path);
    
    // Use original filename if available, otherwise extract from file_path
    let fileName = submission.original_filename || submission.file_path.split('/').pop() || 'submission';
    
    // Ensure filename has proper extension
    if (!path.extname(fileName)) {
      const ext = path.extname(submission.file_path);
      if (ext) {
        fileName = fileName + ext;
      }
    }
    
    // Determine Content-Type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.pages': 'application/vnd.apple.pages',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Set headers with proper Content-Type and filename
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, error: 'Failed to download file' });
  }
});

// Get dashboard stats and data
router.get('/dashboard', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();
    const oneWeekFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    // Get all assignments
    const allAssignments = await db.allAsync(`
      SELECT a.*, 
        s.id as submission_id,
        s.status as submission_status,
        s.grade,
        s.ai_usage_type,
        s.blockchain_hash,
        s.created_at as submitted_at
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      ORDER BY a.due_date DESC
    `, [userId]);

    // Calculate stats
    const total = allAssignments.length;
    const completed = allAssignments.filter(a => a.submission_id && a.submission_status === 'graded').length;
    const pending = allAssignments.filter(a => !a.submission_id && a.due_date > now && a.due_date <= oneWeekFromNow).length;
    const aiAssisted = allAssignments.filter(a => a.submission_id && a.ai_usage_type && a.ai_usage_type !== 'none').length;

    // Get recent assignments (last 5)
    const recentAssignments = allAssignments.slice(0, 5).map(a => ({
      id: a.id,
      title: a.title,
      course: a.course,
      dueDate: new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: a.submission_id 
        ? (a.submission_status === 'graded' ? 'graded' : 'submitted')
        : (a.due_date < now ? 'late' : 'pending'),
      aiUsed: a.ai_usage_type && a.ai_usage_type !== 'none',
      blockchainVerified: !!a.blockchain_hash,
      grade: a.grade || null
    }));

    // Get recent activity from audit logs
    const auditLogs = await db.allAsync(`
      SELECT al.*, 
        s.assignment_id,
        a.title as assignment_title,
        a.course
      FROM audit_logs al
      LEFT JOIN submissions s ON al.target_id = s.id AND al.target_type = 'submission'
      LEFT JOIN assignments a ON s.assignment_id = a.id
      WHERE al.user_id = ?
      ORDER BY al.timestamp DESC
      LIMIT 10
    `, [userId]);

    // Format audit logs as activities
    const formattedActivity = auditLogs.map(activity => {
      const timeAgo = getTimeAgo(activity.timestamp);
      let icon = 'submission';
      let title = '';
      let description = '';

      if (activity.action === 'assignment_submitted') {
        icon = 'submission';
        title = 'Assignment submitted';
        description = activity.assignment_title || 'Assignment';
      } else if (activity.action === 'ai_content_generated') {
        icon = 'ai';
        title = 'AI content generated';
        description = activity.details || 'Used tokens for content generation';
      } else if (activity.action.includes('blockchain') || activity.blockchain_hash) {
        icon = 'blockchain';
        title = 'Blockchain verified';
        const hash = activity.blockchain_hash || '';
        description = hash ? `Hash: ${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : 'Blockchain record';
      } else if (activity.action === 'assignment_graded' || activity.action.includes('grade')) {
        icon = 'grade';
        title = 'Assignment graded';
        description = `${activity.assignment_title || 'Assignment'}${activity.details ? ' - ' + activity.details : ''}`;
      } else {
        icon = 'submission';
        title = activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        description = activity.details || activity.assignment_title || '';
      }

      return {
        icon,
        title,
        description,
        time: timeAgo,
        type: icon
      };
    });

    res.json({
      success: true,
      data: {
        stats: {
          total,
          completed,
          pending,
          aiAssisted
        },
        recentAssignments,
        recentActivity: formattedActivity
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default router;

