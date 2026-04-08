import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import bcrypt from 'bcryptjs';
import { upload } from '../services/storage.js';

const router = express.Router();

// Get all university instances (Demo Accounts)
router.get('/instances', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const instances = await db.allAsync(`
      SELECT s.*, u.email as admin_email, u.name as admin_name
      FROM university_settings s
      LEFT JOIN users u ON u.university_id = s.id AND u.role = 'admin'
      ORDER BY s.updated_at DESC
    `);
    res.json({ success: true, data: instances });
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});

// Create a new university instance + admin demo account
router.post('/instances', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { universityName, slug, primaryColor, logoUrl, adminEmail, adminPassword, adminName } = req.body;

    if (!universityName || !slug || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Check if slug or email exists
    const existingSlug = await db.getAsync('SELECT id FROM university_settings WHERE slug = ?', [slug]);
    if (existingSlug) return res.status(400).json({ success: false, error: 'URL Slug already in use' });

    const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existingUser) return res.status(400).json({ success: false, error: 'Admin email already registered' });

    const now = Date.now();
    const universityId = `univ-${now}-${Math.random().toString(36).substr(2, 5)}`;

    // Create settings
    await db.runAsync(`
      INSERT INTO university_settings (id, slug, university_name, primary_color, logo_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [universityId, slug, universityName, primaryColor || '#06b6d4', logoUrl || '', now]);

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const userId = `admin-${now}`;
    await db.runAsync(`
      INSERT INTO users (id, email, password_hash, name, role, is_verified, university_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, adminEmail, passwordHash, adminName || universityName + ' Admin', 'admin', 1, universityId, now, now]);

    res.json({
      success: true,
      message: 'Demo instance created successfully',
      data: { universityId, slug, loginUrl: `/p/${slug}/login` }
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ success: false, error: 'Failed to create instance' });
  }
});

// Get branding settings (Publicly accessible)
router.get('/branding', async (req, res) => {
  try {
    const { slug } = req.query;
    let settings;

    if (slug) {
      settings = await db.getAsync("SELECT university_name, primary_color, logo_url, slug FROM university_settings WHERE slug = ?", [slug]);
    }

    // Fallback to default if slug not found or not provided
    if (!settings) {
      settings = await db.getAsync("SELECT university_name, primary_color, logo_url, slug FROM university_settings WHERE id = 'default'");
    }

    res.json({ success: true, data: settings || {} });
  } catch (error) {
    console.error('Error fetching branding:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch branding' });
  }
});

// Update branding settings (Global or specific)
router.put('/branding', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { id, universityName, primaryColor, logoUrl, slug } = req.body;
    const targetId = id || 'default';

    await db.runAsync(`
      UPDATE university_settings 
      SET university_name = ?, primary_color = ?, logo_url = ?, slug = ?, updated_at = ?
      WHERE id = ?
    `, [universityName, primaryColor, logoUrl, slug, Date.now(), targetId]);
    res.json({ success: true, message: 'Branding updated successfully' });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ success: false, error: 'Failed to update branding' });
  }
});

// Upload a logo
router.post('/upload-logo', authenticateToken, requireRole('super_admin'), upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Handle Cloudinary vs Local
    let fileUrl = req.file.path;
    
    // If it's local storage, we want to store the path relative to the server root
    // multer-storage-cloudinary usually gives the full secure_url in req.file.path or req.file.secure_url
    if (req.file.path && !req.file.path.startsWith('http')) {
      // It's local, ensure it starts with /uploads/
      const filename = req.file.filename;
      fileUrl = `/uploads/${filename}`;
    } else if (req.file.secure_url) {
      fileUrl = req.file.secure_url;
    }

    res.json({ 
      success: true, 
      data: { url: fileUrl } 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

export default router;
