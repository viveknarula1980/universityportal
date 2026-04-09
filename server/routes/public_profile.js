import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../database/db.js';

const router = express.Router();

// Public Profile Fetch - NO AUTH REQUIRED for public profiles
router.get('/profile/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const profile = await db.getAsync(`
      SELECT pp.*, u.name, u.role, u.department, u.university_id,
        us.university_name, us.logo_url as university_logo
      FROM public_profiles pp
      JOIN users u ON pp.user_id = u.id
      JOIN university_settings us ON u.university_id = us.id
      WHERE pp.slug = ? AND pp.is_public = 1
    `, [slug]);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found or private' });
    }

    // Fetch verified certificates
    const certificates = await db.allAsync(`
      SELECT degree_name, degree_type, issue_date, blockchain_hash
      FROM certificates
      WHERE student_id = ? AND (revocation_status = 0 OR revocation_status IS NULL)
    `, [profile.user_id]);

    // Fetch selected assignments
    let selectedAssignments = [];
    if (profile.portfolio_data) {
      try {
        const settings = JSON.parse(profile.portfolio_data);
        const selectedIds = settings.selectedAssignmentIds || [];
        
        if (selectedIds.length > 0) {
           const placeholders = selectedIds.map(() => '?').join(',');
           selectedAssignments = await db.allAsync(`
             SELECT a.title, a.course, s.grade, s.blockchain_hash, s.timestamp
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE s.student_id = ? AND s.assignment_id IN (${placeholders}) AND s.status = 'graded'
           `, [profile.user_id, ...selectedIds]);
        }
      } catch (e) {
        console.error('Error parsing portfolio data:', e);
      }
    }

    res.json({
      success: true,
      data: {
        profile,
        certificates,
        assignments: selectedAssignments
      }
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// Get own profile settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    let profile = await db.getAsync('SELECT * FROM public_profiles WHERE user_id = ?', [req.user.id]);
    
    if (!profile) {
      // Create initial profile if doesn't exist
      const slug = `${req.user.name.toLowerCase().replace(/\s+/g, '-')}-${req.user.id.substring(0, 5)}`;
      await db.runAsync(`
        INSERT INTO public_profiles (user_id, slug, bio, is_public, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [req.user.id, slug, '', 0, Date.now()]);
      profile = await db.getAsync('SELECT * FROM public_profiles WHERE user_id = ?', [req.user.id]);
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Update profile settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { slug, bio, isPublic, portfolioData } = req.body;
    
    // Check slug uniqueness
    const existing = await db.getAsync('SELECT user_id FROM public_profiles WHERE slug = ? AND user_id != ?', [slug, req.user.id]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Profile URL slug already taken' });
    }

    await db.runAsync(`
      UPDATE public_profiles
      SET slug = ?, bio = ?, is_public = ?, portfolio_data = ?, updated_at = ?
      WHERE user_id = ?
    `, [slug, bio, isPublic ? 1 : 0, JSON.stringify(portfolioData), Date.now(), req.user.id]);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;
