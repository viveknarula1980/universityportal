import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../database/db.js';
import { aiService } from '../services/ai.js';

const router = express.Router();

// Get all projects for student dashboard (with AI matching)
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const universityId = req.user.university_id || 'default';
    
    const projects = await db.allAsync(`
      SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.university_id = ?
      ORDER BY p.created_at DESC
    `, [universityId]);

    // Simple AI Matching logic: Tag match
    const studentStream = req.user.department || '';
    const projectsWithMatch = projects.map(p => {
      const tags = p.stream_tags ? p.stream_tags.split(',') : [];
      const isMatch = tags.some(tag => studentStream.toLowerCase().includes(tag.trim().toLowerCase()));
      return { ...p, isMatch };
    });

    res.json({ success: true, data: projectsWithMatch });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { title, description, streamTags } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    await db.runAsync(`
      INSERT INTO projects (id, title, description, stream_tags, creator_id, university_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, streamTags, req.user.id, req.user.university_id || 'default', now]);

    // Auto-join as creator
    await db.runAsync(`
      INSERT INTO project_members (project_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?)
    `, [id, req.user.id, 'Founder', now]);

    res.json({ success: true, message: 'Project created successfully', data: { id } });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// Join project
router.post('/projects/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    // Check if already a member
    const existing = await db.getAsync('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already a member of this project' });
    }

    await db.runAsync(`
      INSERT INTO project_members (project_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?)
    `, [id, req.user.id, 'Contributor', now]);

    res.json({ success: true, message: 'Joined project successfully' });
  } catch (error) {
    console.error('Error joining project:', error);
    res.status(500).json({ success: false, error: 'Failed to join project' });
  }
});

export default router;
