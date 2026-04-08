import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all AI limits
router.get('/ai-limits', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const whereClause = req.user.role === 'super_admin' ? '' : 'WHERE u.university_id = ?';
    const params = req.user.role === 'super_admin' ? [] : [req.user.university_id || 'default'];

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
      ${whereClause}
      GROUP BY al.id, u.student_id, u.name, u.email
      ORDER BY al.updated_at DESC
    `, params);

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

    const whereClause = req.user.role === 'super_admin' ? '' : 'WHERE u.university_id = ?';
    const countWhereClause = req.user.role === 'super_admin' ? '' : 'WHERE user_id IN (SELECT id FROM users WHERE university_id = ?)';
    const params = req.user.role === 'super_admin' ? [parseInt(limit), parseInt(offset)] : [req.user.university_id || 'default', parseInt(limit), parseInt(offset)];
    const countParams = req.user.role === 'super_admin' ? [] : [req.user.university_id || 'default'];

    const logs = await db.allAsync(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT ? OFFSET ?
    `, params);

    const totalCount = await db.getAsync(`SELECT COUNT(*) as count FROM audit_logs ${countWhereClause}`, countParams);

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
    const univWhere = req.user.role === 'super_admin' ? '' : 'WHERE university_id = ?';
    const univParams = req.user.role === 'super_admin' ? [] : [req.user.university_id || 'default'];
    
    // Certificate stats
    const totalCertificates = await db.getAsync(`SELECT COUNT(*) as count FROM certificates ${univWhere}`, univParams);
    const activeCertificates = await db.getAsync(
      `SELECT COUNT(*) as count FROM certificates WHERE revocation_status = 0 ${req.user.role === 'super_admin' ? '' : 'AND university_id = ?'}`,
      univParams
    );

    // AI access stats
    const studentsWithAI = await db.getAsync(`
      SELECT COUNT(DISTINCT al.user_id) as count 
      FROM ai_limits al
      JOIN users u ON al.user_id = u.id
      ${req.user.role === 'super_admin' ? '' : 'WHERE u.university_id = ?'}
    `, univParams);

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

// Get all users (Admin only)
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const univWhere = req.user.role === 'super_admin' ? '' : 'AND university_id = ?';
    const univParams = req.user.role === 'super_admin' ? [] : [req.user.university_id || 'default'];

    const users = await db.allAsync(`
      SELECT id, email, name, role, student_id, department, is_verified, created_at, university_id 
      FROM users 
      WHERE role != 'admin' ${univWhere}
      ORDER BY created_at DESC
    `, univParams);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create new user (Admin only)
router.post('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, role, studentId, department } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, error: 'Email, password, name, and role are required' });
    }

    // Check if user already exists
    const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await db.runAsync(`
      INSERT INTO users (id, email, password_hash, name, role, student_id, department, is_verified, created_at, updated_at, university_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, passwordHash, name, role, studentId || null, department || null, 1, now, now, req.user.university_id || 'default']);

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'user_created',
      'user',
      userId,
      `Created ${role}: ${email}`,
      now
    ]);

    res.json({ 
      success: true, 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      user: { id: userId, email, name, role } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Bulk create users (Admin only)
router.post('/users/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ success: false, error: 'User list is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const now = Date.now();
    
    // Use a transaction for performance with large batches
    await db.runAsync('BEGIN TRANSACTION');

    try {
      for (const userData of users) {
        const { email, password, name, role, studentId, department } = userData;

        if (!email || !password || !name || !role) {
          results.failed++;
          results.errors.push(`Missing data for ${email || 'unknown user'}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
          results.failed++;
          results.errors.push(`User ${email} already exists`);
          continue;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db.runAsync(`
          INSERT INTO users (id, email, password_hash, name, role, student_id, department, is_verified, created_at, updated_at, university_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, email, passwordHash, name, role, studentId || null, department || null, 1, now, now, req.user.university_id || 'default']);

        results.success++;
      }

      await db.runAsync('COMMIT');
    } catch (transactionError) {
      await db.runAsync('ROLLBACK');
      throw transactionError;
    }

    // Log audit for bulk creation
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'bulk_user_created',
      'system',
      'multiple',
      `Bulk created ${results.success} users (${results.failed} failed)`,
      now
    ]);

    res.json({ 
      success: true, 
      message: `Bulk creation complete: ${results.success} succeeded, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk user creation:', error);
    res.status(500).json({ success: false, error: 'Failed to process bulk user creation' });
  }
});

export default router;

