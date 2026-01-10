import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { aiService } from '../services/ai.js';
import { body, validationResult } from 'express-validator';
import db from '../database/db.js';

const router = express.Router();

// Generate AI content
router.post('/generate', authenticateToken, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('maxTokens').optional().isInt({ min: 1, max: 400 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { prompt, maxTokens, temperature, systemPrompt } = req.body;

    // Check AI service status
    if (!aiService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: 'Please configure OPENAI_API_KEY in server/.env file'
      });
    }

    // Check user's token quota
    const semester = new Date().getFullYear() + (new Date().getMonth() < 6 ? '-Spring' : '-Fall');
    const usage = await aiService.checkTokenUsage(req.user.id, semester);
    
    if (usage.used >= usage.limit) {
      return res.status(403).json({
        success: false,
        error: 'AI token quota exceeded',
        message: `You have used ${usage.used} of ${usage.limit} tokens this semester`
      });
    }

    // Generate content
    const result = await aiService.generateContent(prompt, {
      maxTokens: maxTokens || 200,
      temperature: temperature || 0.7,
      systemPrompt: systemPrompt
    });

    // Record usage in database
    const usageId = `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.runAsync(`
      INSERT INTO ai_usage (id, user_id, tokens_used, context_window, semester, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      usageId,
      req.user.id,
      result.tokensUsed,
      maxTokens || 200,
      semester,
      Date.now()
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI generation failed'
    });
  }
});

// Get AI usage stats
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const semester = new Date().getFullYear() + (new Date().getMonth() < 6 ? '-Spring' : '-Fall');
    
    const usage = await db.getAsync(`
      SELECT SUM(tokens_used) as total_used
      FROM ai_usage
      WHERE user_id = ? AND semester = ?
    `, [req.user.id, semester]);

    const limit = await db.getAsync(`
      SELECT tokens_per_semester
      FROM ai_limits
      WHERE user_id = ? AND semester = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `, [req.user.id, semester]);

    const totalUsed = usage?.total_used || 0;
    const tokensPerSemester = limit?.tokens_per_semester || 80000;

    res.json({
      success: true,
      data: {
        used: totalUsed,
        limit: tokensPerSemester,
        remaining: Math.max(0, tokensPerSemester - totalUsed),
        percentage: ((totalUsed / tokensPerSemester) * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage' });
  }
});

// Check AI service status
router.get('/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      configured: aiService.isConfigured(),
      model: aiService.model || 'not-configured',
      message: aiService.isConfigured() 
        ? 'AI service is ready' 
        : 'Configure OPENAI_API_KEY in .env to enable AI features'
    }
  });
});

export default router;

