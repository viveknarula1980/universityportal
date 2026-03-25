import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import db from '../database/db.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// OTP Generation Helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


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

    const user = await db.getAsync('SELECT id, email, name, role, student_id as studentId, is_verified as isVerified FROM users WHERE id = ?', [userId]);

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

    const { email: rawEmail, password } = req.body;
    const email = rawEmail ? rawEmail.toLowerCase() : '';

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

    // Verification check - trigger OTP instead of issuing token immediately
    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP in database
    await db.runAsync(`
      INSERT INTO otp_codes (id, email, code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [`login-otp-${Date.now()}`, email, otp, otpExpires, Date.now()]);

    // Send OTP email
    const mailOptions = {
        from: `"EduChain Portal" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Login Verification Code - EduChain University',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 480px; margin: auto;">
            <h2 style="color: #6366f1; text-align: center; font-size: 24px;">EduChain University</h2>
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Code</p>
              <h1 style="margin: 8px 0 0; font-size: 48px; letter-spacing: 8px; color: #1e293b;">${otp}</h1>
            </div>
            <p style="color: #475569; line-height: 1.6;">This code will expire in 5 minutes. If you did not attempt to sign in, please secure your account immediately.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">&copy; 2026 EduChain University. All rights reserved.</p>
          </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (mailError) {
        console.error('Failed to send login OTP:', mailError);
        // If SMTP fails, we can either throw an error or log it and allow dev mode to continue
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({ success: false, error: 'Failed to send verification code' });
        }
    }

    res.json({
        success: true,
        requireOTP: true,
        email: user.email,
        message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body; // credential is the JWT from Google
    
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Google credential missing' });
    }

    // Verify Google Token
    let payload;
    try {
      // In development, if GOOGLE_CLIENT_ID is not set, we might mock this or skip strict validation
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Fallback for dev: decode JWT without verification if Client ID is missing
        payload = jwt.decode(credential);
        console.warn('⚠️ VERIFYING GOOGLE TOKEN WITHOUT CLIENT ID. DO NOT DO THIS IN PRODUCTION.');
      }
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid Google token' });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: 'Invalid token payload' });
    }

    const email = payload.email ? payload.email.toLowerCase() : '';
    const name = payload.name;
    const googleId = payload.sub;

    // Check if user exists
    let user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    let userId;

    if (!user) {
      // DENY: Google login should only work if an admin has already created the account
      return res.status(401).json({ 
        success: false, 
        error: 'No account found for this email. Please contact your administrator.' 
      });
    }

    userId = user.id;
    // Link google_id if it's the first time this user logs in with Google
    if (!user.google_id) {
      await db.runAsync('UPDATE users SET google_id = ?, is_verified = 1, updated_at = ? WHERE id = ?', [googleId, Date.now(), userId]);
      user.google_id = googleId;
      user.is_verified = 1;
    }

    // Generate app token
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
        department: user.department,
        isVerified: user.is_verified === 1
      },
      token
    });

  } catch (error) {
    console.error('Google Login error:', error);
    res.status(500).json({ success: false, error: 'Google login failed' });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check user exists (optional, depends on if you want open registration or not)
    // For now, allow sending OTP to any email for registration

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const id = `otp-${Date.now()}`;

    // Store in DB
    await db.runAsync(`
      INSERT INTO otp_codes (id, email, code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, email, code, expiresAt, Date.now()]);

    // Dispatch real email using Nodemailer
    const mailOptions = {
      from: process.env.SMTP_USER || '"EduChain University" <no-reply@university.edu>',
      to: email,
      subject: 'Your University Portal OTP Verification Code',
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">EduChain University</h2>
          <p style="color: #555;">Hello,</p>
          <p style="color: #555;">You requested an OTP verification code. Here is your 6-digit code:</p>
          <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${code}</span>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP sent successfully to your email' });
    } else {
      // Fallback to console if SMTP is not configured
      console.log(`\n📧 === MOCK EMAIL SENT (SMTP Not Configured) ===\nTo: ${email}\nCode: ${code}\n===========================\n`);
      res.json({ success: true, message: 'OTP generated (Check server console, SMTP not configured)' });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code are required' });
    }

    // Find valid OTP
    const validOTP = await db.getAsync(
      'SELECT id FROM otp_codes WHERE email = ? AND code = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [email, code, Date.now()]
    );

    if (!validOTP) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Optional: Delete the OTP after successful verification
    await db.runAsync('DELETE FROM otp_codes WHERE id = ?', [validOTP.id]);

    // Find the user to return their full data and token
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mark user as verified if not already
    if (!user.is_verified) {
        await db.runAsync('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);
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
        department: user.department,
        isVerified: true
      },
      token,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

export default router;

