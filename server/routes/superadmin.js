import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all admins (University Demo Accounts)
router.get('/admins', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const admins = await db.allAsync(`
      SELECT id, email, name, role, department as stream, is_verified, created_at 
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

// Create a new university admin (Demo Account)
router.post('/admins', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { email, password, name, stream } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await db.runAsync(`
      INSERT INTO users (id, email, password_hash, name, role, department, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, passwordHash, name, 'admin', stream || null, 1, now, now]);

    // Log audit
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      'admin_created',
      'user',
      userId,
      `SuperAdmin created Admin: ${email} for stream: ${stream || 'All'}`,
      now
    ]);

    res.json({ 
      success: true, 
      message: `Admin account created successfully.`,
      user: { id: userId, email, name, role: 'admin', stream: stream || null } 
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

export default router;
