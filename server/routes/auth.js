import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../database/db.js';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['student', 'faculty', 'admin']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password, name, role, studentId } = req.body;

    // Check if user exists
    const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Create default users on first registration if they don't exist
    const defaultUsers = [
      { email: 'admin@university.edu', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'student@university.edu', password: 'student123', name: 'Anupam', role: 'student', studentId: 'CS2024-0892' },
      { email: 'faculty@university.edu', password: 'faculty123', name: 'Dr. Smith', role: 'faculty' },
    ];

    const defaultUser = defaultUsers.find(u => u.email === email);
    if (defaultUser && defaultUser.password === password) {
      // Auto-register default user
      const passwordHash = await bcrypt.hash(defaultUser.password, 10);
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      await db.runAsync(`
        INSERT INTO users (id, email, password_hash, name, role, student_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        defaultUser.email,
        passwordHash,
        defaultUser.name,
        defaultUser.role,
        defaultUser.studentId || null,
        now,
        now
      ]);

      const token = jwt.sign(
        { userId, email: defaultUser.email, role: defaultUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        user: {
          id: userId,
          email: defaultUser.email,
          name: defaultUser.name,
          role: defaultUser.role,
          studentId: defaultUser.studentId
        },
        token
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // Insert user
    await db.runAsync(`
      INSERT INTO users (id, email, password_hash, name, role, student_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, passwordHash, name, role, studentId || null, now, now]);

    // Generate token
    const token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const user = await db.getAsync('SELECT id, email, name, role, student_id as studentId FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.student_id,
        department: user.department
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

export default router;

