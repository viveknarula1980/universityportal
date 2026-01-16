import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { aiService } from '../services/ai.js';
import { body, validationResult } from 'express-validator';
import db from '../database/db.js';

const router = express.Router();

// Generate AI content
router.post('/generate', authenticateToken, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('maxTokens').optional().isInt({ min: 1, max: 128000 }), // GPT-5-nano supports up to 128k output tokens
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { prompt, maxTokens, temperature, systemPrompt } = req.body;

    // Validate prompt word count (limit to 30 words)
    const maxWords = parseInt(process.env.AI_PROMPT_MAX_WORDS) || 30;
    const wordCount = prompt.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    if (wordCount > maxWords) {
      return res.status(400).json({
        success: false,
        error: `Prompt is too long. Maximum ${maxWords} words allowed, but you provided ${wordCount} words.`,
        wordCount: wordCount,
        maxWords: maxWords
      });
    }

    // Check AI service status
    if (!aiService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: 'Please configure OPENAI_API_KEY or GEMINI_API_KEY in server/.env file'
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
    // Default to 8000 tokens for assignments - GPT-5-nano supports up to 128k
    const result = await aiService.generateContent(prompt, {
      maxTokens: maxTokens || 8000,
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
      result.contextWindow || maxTokens || 200,
      semester,
      Date.now()
    ]);

    // Log to audit logs for activity tracking
    await db.runAsync(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      req.user.id,
      'ai_content_generated',
      'ai_usage',
      usageId,
      `Generated content using ${result.tokensUsed} tokens`,
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

    // Calculate days until semester end (resets)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Semester ends: Spring (May 31) or Fall (December 31)
    // Month is 0-indexed: 0=Jan, 4=May, 5=Jun, 11=Dec
    let semesterEnd;
    if (currentMonth < 6) {
      // Spring semester (Jan-May) - ends May 31
      semesterEnd = new Date(currentYear, 4, 31); // Month 4 = May (0-indexed)
    } else {
      // Fall semester (Jun-Dec) - ends December 31
      semesterEnd = new Date(currentYear, 11, 31); // Month 11 = December (0-indexed)
    }
    
    const daysUntilReset = Math.max(0, Math.ceil((semesterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        used: totalUsed,
        limit: tokensPerSemester,
        remaining: Math.max(0, tokensPerSemester - totalUsed),
        percentage: ((totalUsed / tokensPerSemester) * 100).toFixed(2),
        daysUntilReset: daysUntilReset
      }
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage' });
  }
});

// Check AI service status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const validation = await aiService.validateApiKey();
    
    res.json({
      success: true,
      data: {
        configured: aiService.isConfigured(),
        model: aiService.model || 'not-configured',
        valid: validation.valid,
        message: validation.valid 
          ? 'AI service is ready' 
          : validation.error || 'Configure OPENAI_API_KEY in .env to enable AI features',
        error: validation.error || null
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        configured: aiService.isConfigured(),
        model: aiService.model || 'not-configured',
        valid: false,
        message: 'Error checking API key status',
        error: error.message
      }
    });
  }
});

// Validate API key (more detailed check)
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const validation = await aiService.validateApiKey();
    
    if (validation.valid) {
      res.json({
        success: true,
        data: validation
      });
    } else {
      res.status(400).json({
        success: false,
        error: validation.error,
        data: validation
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
      message: error.message
    });
  }
});

export default router;

