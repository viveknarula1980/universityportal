import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';

const router = express.Router();

// Get all AI limits
router.get('/ai-limits', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const limits = await db.allAsync(`
      SELECT 
        al.*,
        u.student_id,
        u.name as student_name,
        u.email as student_email,
        COALESCE(SUM(au.tokens_used), 0) as used_tokens
      FROM ai_limits al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN ai_usage au ON al.user_id = au.user_id AND al.semester = au.semester
      GROUP BY al.id
      ORDER BY al.updated_at DESC
    `);

    res.json({ success: true, data: limits });
  } catch (error) {
    console.error('Error fetching AI limits:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch AI limits' });
  }
});

// Update AI limits for all students
router.post('/ai-limits', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { tokensPerSemester, contextWindow } = req.body;

    if (!tokensPerSemester || !contextWindow) {
      return res.status(400).json({ 
        success: false, 
        error: 'tokensPerSemester and contextWindow are required' 
      });
    }

    const semester = new Date().getFullYear() + (new Date().getMonth() < 6 ? '-Spring' : '-Fall');
    const timestamp = Date.now();

    // Get all student users
    const students = await db.allAsync('SELECT id FROM users WHERE role = ?', ['student']);

    // Update or create limits for all students
    for (const student of students) {
      const existingLimit = await db.getAsync(
        'SELECT id FROM ai_limits WHERE user_id = ? AND semester = ?',
        [student.id, semester]
      );

      if (existingLimit) {
        await db.runAsync(`
          UPDATE ai_limits 
          SET tokens_per_semester = ?, context_window = ?, updated_at = ?
          WHERE id = ?
        `, [tokensPerSemester, contextWindow, timestamp, existingLimit.id]);
      } else {
        const limitId = `limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(`
          INSERT INTO ai_limits (id, user_id, tokens_per_semester, context_window, semester, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [limitId, student.id, tokensPerSemester, contextWindow, semester, timestamp, timestamp]);
      }
    }

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'ai_limits_updated',
      'system',
      'all_students',
      `Tokens: ${tokensPerSemester}, Context: ${contextWindow}`,
      timestamp
    ]);

    res.json({ 
      success: true, 
      message: `AI limits updated for ${students.length} students`,
      data: { tokensPerSemester, contextWindow, studentsUpdated: students.length }
    });
  } catch (error) {
    console.error('Error updating AI limits:', error);
    res.status(500).json({ success: false, error: 'Failed to update AI limits' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const logs = await db.allAsync(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const totalCount = await db.getAsync('SELECT COUNT(*) as count FROM audit_logs');

    res.json({ 
      success: true, 
      data: logs,
      total: totalCount?.count || 0
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Certificate stats
    const totalCertificates = await db.getAsync('SELECT COUNT(*) as count FROM certificates');
    const activeCertificates = await db.getAsync(
      'SELECT COUNT(*) as count FROM certificates WHERE revocation_status = 0'
    );

    // AI access stats
    const studentsWithAI = await db.getAsync(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM ai_limits
    `);

    // Blockchain records
    const blockchainRecords = await db.getAsync('SELECT COUNT(*) as count FROM blockchain_records');

    res.json({
      success: true,
      data: {
        totalCertificates: totalCertificates?.count || 0,
        activeCertificates: activeCertificates?.count || 0,
        studentsWithAI: studentsWithAI?.count || 0,
        blockchainRecords: blockchainRecords?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;

