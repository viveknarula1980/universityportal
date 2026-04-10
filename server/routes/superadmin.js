import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../database/db.js';
import bcrypt from 'bcryptjs';
import { upload } from '../services/storage.js';

const router = express.Router();

// ═══════════════════════════════════════════════
// ANALYTICS - Platform-wide aggregated stats
// ═══════════════════════════════════════════════
router.get('/analytics', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const totalUniversities = await db.getAsync(`SELECT COUNT(*) as count FROM university_settings WHERE id != 'default'`);
    const activeUniversities = await db.getAsync(`SELECT COUNT(*) as count FROM university_settings WHERE id != 'default' AND (is_active = true OR is_active IS NULL)`);
    const totalUsers = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'`);
    const totalStudents = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
    const totalFaculty = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role = 'faculty'`);
    const totalAdmins = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
    const totalCertificates = await db.getAsync(`SELECT COUNT(*) as count FROM certificates`);
    const totalSubmissions = await db.getAsync(`SELECT COUNT(*) as count FROM submissions`);
    const totalAITokens = await db.getAsync(`SELECT COALESCE(SUM(tokens_used), 0) as total FROM ai_usage`);
    const totalBlockchainRecords = await db.getAsync(`SELECT COUNT(*) as count FROM blockchain_records`);

    // Per-university breakdown
    const universityBreakdown = await db.allAsync(`
      SELECT 
        s.id, s.university_name, s.slug, s.is_active, s.ai_token_limit,
        COALESCE(u.user_count, 0) as user_count,
        COALESCE(c.cert_count, 0) as cert_count,
        COALESCE(sub.sub_count, 0) as sub_count,
        COALESCE(ai.tokens_used, 0) as ai_tokens_used
      FROM university_settings s
      LEFT JOIN (SELECT university_id, COUNT(*) as user_count FROM users WHERE role != 'super_admin' GROUP BY university_id) u ON u.university_id = s.id
      LEFT JOIN (SELECT university_id, COUNT(*) as cert_count FROM certificates GROUP BY university_id) c ON c.university_id = s.id
      LEFT JOIN (SELECT university_id, COUNT(*) as sub_count FROM submissions GROUP BY university_id) sub ON sub.university_id = s.id
      LEFT JOIN (
        SELECT u2.university_id, SUM(a.tokens_used) as tokens_used 
        FROM ai_usage a 
        JOIN users u2 ON a.user_id = u2.id 
        GROUP BY u2.university_id
      ) ai ON ai.university_id = s.id
      WHERE s.id != 'default'
      ORDER BY u.user_count DESC NULLS LAST
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalUniversities: totalUniversities?.count || 0,
          activeUniversities: activeUniversities?.count || 0,
          totalUsers: totalUsers?.count || 0,
          totalStudents: totalStudents?.count || 0,
          totalFaculty: totalFaculty?.count || 0,
          totalAdmins: totalAdmins?.count || 0,
          totalCertificates: totalCertificates?.count || 0,
          totalSubmissions: totalSubmissions?.count || 0,
          totalAITokens: totalAITokens?.total || 0,
          totalBlockchainRecords: totalBlockchainRecords?.count || 0,
        },
        universityBreakdown: universityBreakdown || []
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// ═══════════════════════════════════════════════
// INSTANCES - Get all university instances (enhanced)
// ═══════════════════════════════════════════════
router.get('/instances', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const instances = await db.allAsync(`
      SELECT 
        s.*,
        u.email as admin_email, 
        u.name as admin_name,
        COALESCE(uc.user_count, 0) as user_count,
        COALESCE(cc.cert_count, 0) as cert_count,
        COALESCE(sc.sub_count, 0) as sub_count,
        COALESCE(ac.tokens_used, 0) as ai_tokens_used
      FROM university_settings s
      LEFT JOIN users u ON u.university_id = s.id AND u.role = 'admin'
      LEFT JOIN (SELECT university_id, COUNT(*) as user_count FROM users WHERE role != 'super_admin' GROUP BY university_id) uc ON uc.university_id = s.id
      LEFT JOIN (SELECT university_id, COUNT(*) as cert_count FROM certificates GROUP BY university_id) cc ON cc.university_id = s.id
      LEFT JOIN (SELECT university_id, COUNT(*) as sub_count FROM submissions GROUP BY university_id) sc ON sc.university_id = s.id
      LEFT JOIN (
        SELECT u2.university_id, SUM(a.tokens_used) as tokens_used 
        FROM ai_usage a 
        JOIN users u2 ON a.user_id = u2.id 
        GROUP BY u2.university_id
      ) ac ON ac.university_id = s.id
      ORDER BY s.updated_at DESC
    `);
    res.json({ success: true, data: instances });
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});

// ═══════════════════════════════════════════════
// CREATE INSTANCE
// ═══════════════════════════════════════════════
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
      INSERT INTO university_settings (id, slug, university_name, primary_color, logo_url, is_active, ai_token_limit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [universityId, slug, universityName, primaryColor || '#06b6d4', logoUrl || '', true, 100000, now]);

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const userId = `admin-${now}`;
    await db.runAsync(`
      INSERT INTO users (id, email, password_hash, name, role, is_verified, university_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, adminEmail, passwordHash, adminName || universityName + ' Admin', 'admin', true, universityId, now, now]);

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

// ═══════════════════════════════════════════════
// TOGGLE UNIVERSITY STATUS (Active/Inactive)
// ═══════════════════════════════════════════════
router.patch('/instances/:id/status', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }

    await db.runAsync(
      `UPDATE university_settings SET is_active = ?, updated_at = ? WHERE id = ?`,
      [isActive, Date.now(), id]
    );

    // Log the action
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `audit-${Date.now()}`,
      req.user.id,
      isActive ? 'activate_university' : 'deactivate_university',
      'university',
      id,
      `University ${isActive ? 'activated' : 'deactivated'} by Super Admin`,
      Date.now()
    ]);

    res.json({ success: true, message: `University ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// ═══════════════════════════════════════════════
// SET AI TOKEN LIMIT PER UNIVERSITY
// ═══════════════════════════════════════════════
router.patch('/instances/:id/ai-limit', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { aiTokenLimit } = req.body;

    if (!aiTokenLimit || aiTokenLimit < 0) {
      return res.status(400).json({ success: false, error: 'aiTokenLimit must be a positive number' });
    }

    await db.runAsync(
      `UPDATE university_settings SET ai_token_limit = ?, updated_at = ? WHERE id = ?`,
      [aiTokenLimit, Date.now(), id]
    );

    res.json({ success: true, message: `AI token limit updated to ${aiTokenLimit.toLocaleString()}` });
  } catch (error) {
    console.error('Error updating AI limit:', error);
    res.status(500).json({ success: false, error: 'Failed to update AI limit' });
  }
});

// ═══════════════════════════════════════════════
// DELETE UNIVERSITY INSTANCE
// ═══════════════════════════════════════════════
router.delete('/instances/:id', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'default') {
      return res.status(400).json({ success: false, error: 'Cannot delete the default instance' });
    }

    // Delete related data in order
    await db.runAsync(`DELETE FROM ai_usage WHERE user_id IN (SELECT id FROM users WHERE university_id = ?)`, [id]);
    await db.runAsync(`DELETE FROM ai_limits WHERE user_id IN (SELECT id FROM users WHERE university_id = ?)`, [id]);
    await db.runAsync(`DELETE FROM submissions WHERE university_id = ?`, [id]);
    await db.runAsync(`DELETE FROM assignments WHERE university_id = ?`, [id]);
    await db.runAsync(`DELETE FROM certificates WHERE university_id = ?`, [id]);
    await db.runAsync(`DELETE FROM departments WHERE university_id = ?`, [id]);
    await db.runAsync(`DELETE FROM users WHERE university_id = ?`, [id]);
    await db.runAsync(`DELETE FROM university_settings WHERE id = ?`, [id]);

    res.json({ success: true, message: 'University instance deleted' });
  } catch (error) {
    console.error('Error deleting instance:', error);
    res.status(500).json({ success: false, error: 'Failed to delete instance' });
  }
});

// ═══════════════════════════════════════════════
// BRANDING - Public (unchanged)
// ═══════════════════════════════════════════════
router.get('/branding', async (req, res) => {
  try {
    const { slug } = req.query;
    let settings;

    if (slug) {
      settings = await db.getAsync(
        "SELECT university_name, primary_color, logo_url, slug, is_active FROM university_settings WHERE slug = ?",
        [slug]
      );

      // If university is inactive, return suspended status
      if (settings && settings.is_active === false) {
        return res.json({
          success: true,
          data: { ...settings, suspended: true }
        });
      }
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
    if (req.file.path && !req.file.path.startsWith('http')) {
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
