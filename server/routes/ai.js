import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { aiService } from '../services/ai.js';
import { body, validationResult } from 'express-validator';
import db from '../database/db.js';
import multer from 'multer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// Configure multer for PDF uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Get AI Career Recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch user's background (certificates / department)
    const user = await db.getAsync('SELECT name, department, role FROM users WHERE id = ?', [req.user.id]);
    
    // Fetch certificates
    const certificates = await db.allAsync(`
      SELECT degree_name as degreeName, degree_type as degreeType 
      FROM certificates 
      WHERE student_id = ? AND (revocation_status = 0 OR revocation_status IS NULL)
    `, [req.user.id]);

    // 2. Build Context String
    let contextStr = `Student Name: ${user.name}\nDepartment: ${user.department || 'Not specified'}\n`;
    if (certificates && certificates.length > 0) {
      contextStr += `Degrees/Certificates:\n`;
      certificates.forEach(cert => {
        contextStr += `- ${cert.degreeType} in ${cert.degreeName}\n`;
      });
    } else {
      contextStr += `No advanced degrees issued yet. Currently pursuing studies.\n`;
    }

    // 3. Formulate AI Prompt
    const systemPrompt = `You are an expert academic and career advisor. Given a student's academic background, recommend 3 relevant internships and 3 courses to help advance their career.
Return ONLY a valid JSON object matching the EXACT structure below. Do not include any explanations or markdown outside the JSON.
{
  "internships": [ { "title": "...", "company": "...", "description": "...", "matchReason": "...", "link": "https://..." } ],
  "courses": [ { "title": "...", "platform": "...", "description": "...", "matchReason": "...", "link": "https://..." } ]
}`;

    const prompt = `Please provide exactly 3 internship and 3 course recommendations for the following student profile:\n\n${contextStr}`;

    // 4. Generate AI Content
    const result = await aiService.generateContent(prompt, {
      maxTokens: 1500,
      temperature: 0.7,
      systemPrompt: systemPrompt
    });

    let suggestionsData = { internships: [], courses: [] };
    
    // 5. Parse JSON safely
    try {
      let content = result.content;
      // Extract everything between the first '{' and last '}'
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      suggestionsData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI recommendations JSON. Raw content:', result.content);
      // Fallback data if AI parsing fails
      suggestionsData = {
        internships: [
          { title: 'Software Engineering Intern', company: 'Google', description: 'Work on cutting-edge web applications.', matchReason: 'Strong foundation in engineering.', link: 'https://careers.google.com/students/' },
          { title: 'Data Analytics Intern', company: 'Microsoft', description: 'Analyze large datasets for business insights.', matchReason: 'Relevant analytical skills.', link: 'https://careers.microsoft.com/students/' },
          { title: 'Product Management Intern', company: 'Atlassian', description: 'Help define product strategy and roadmap.', matchReason: 'Good mix of technical and soft skills.', link: 'https://www.atlassian.com/company/careers/students' }
        ],
        courses: [
          { title: 'Advanced React and Next.js', platform: 'Udemy', description: 'Master modern web development using React.', matchReason: 'Highly requested skill in the current market.', link: 'https://www.udemy.com' },
          { title: 'Machine Learning A-Z', platform: 'Coursera', description: 'Learn to create Machine Learning algorithms.', matchReason: 'Great for expanding technical breadth.', link: 'https://www.coursera.org/learn/machine-learning' },
          { title: 'Agile Project Management', platform: 'edX', description: 'Learn agile methodologies for project delivery.', matchReason: 'Essential for modern software teams.', link: 'https://www.edx.org' }
        ]
      };
    }

    res.json({ success: true, data: suggestionsData });

  } catch (error) {
    console.error('AI Recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

// --- AI CV Builder Endpoint ---
router.post('/analyze-cv', authenticateToken, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CV PDF file uploaded' });
    }

    // 1. Parse PDF using pdf-parse v2 object-oriented API
    const parser = new PDFParse({ data: req.file.buffer });
    const data = await parser.getText();
    const cvText = data.text;
    await parser.destroy();

    if (!cvText || cvText.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Could not extract text from the PDF. It might be scanned or empty.' });
    }

    // 2. Build Prompt
    const systemPrompt = `You are an expert tech recruiter and ATS (Applicant Tracking System) optimizer. 
Evaluate the provided CV text. Provide an original ATS score (0-100), actionable feedback, a completely rewritten and professionally formatted version using strong action verbs, and an improved ATS score.
CRITICAL INSTRUCTION: The "improvedCV" MUST be formatted in strict Markdown. Use heading tags (e.g. ## Experience, ### Projects) and bulleted lists (- ) for readability.
Return ONLY a valid JSON object matching this EXACT structure:
{
  "originalScore": 65,
  "feedback": ["...", "..."],
  "improvedScore": 95,
  "improvedCV": "# John Doe\n\n## Experience\n\n- Improved application performance..."
}`;

    const prompt = `Please analyze, rewrite, and properly Markdown-format the following CV:\n\n${cvText}`;

    const result = await aiService.generateContent(prompt, {
      maxTokens: 16000,
      temperature: 0.7,
      systemPrompt: systemPrompt
    });

    let suggestionsData;
    try {
      let content = result.content;
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      suggestionsData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse CV JSON:', parseError);
      return res.status(500).json({ success: false, error: 'AI failed to return valid optimization data.' });
    }

    res.json({ success: true, data: suggestionsData });

  } catch (error) {
    console.error('CV Analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to process CV' });
  }
});

// --- LinkedIn Analyzer Endpoint ---
router.post('/analyze-linkedin', authenticateToken, [
  body('url').isURL().withMessage('Valid LinkedIn URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { url } = req.body;
    
    // Validate if it's linkedin
    if (!url.includes('linkedin.com/')) {
       return res.status(400).json({ success: false, error: 'Must be a valid LinkedIn profile URL (linkedin.com/in/...)' });
    }

    // Attempt to fetch public snippet
    let profileText = "";
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 8000
      });
      const $ = cheerio.load(response.data);
      $('script, style, link, meta').remove();
      profileText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000); 
    } catch (fetchError) {
      console.error('LinkedIn fetch bounded:', fetchError.message);
    }

    const systemPrompt = `You are an expert career coach. Analyze a user's LinkedIn profile presence. 
Normally you'd read the profile, but due to privacy protections you may only have partial data.
Provide a Profile Score (0-100) and 3 to 5 actionable improvement tips.
Return ONLY a valid JSON object matching this EXACT structure:
{
  "score": 75,
  "tips": ["Add a professional headshot", "Use a banner image", "Write a strong summary"]
}`;
    
    const prompt = profileText.length > 200 
      ? `Here is the extracted public text from their LinkedIn profile (${url}):\n\n${profileText}\n\nAnalyze it.` 
      : `I am linking my profile: ${url}. Due to privacy blocks, public text extraction failed. Please provide standard best practices for optimizing a LinkedIn profile url specifically for a student looking for tech jobs.`;

    const result = await aiService.generateContent(prompt, {
      maxTokens: 8000,
      temperature: 0.7,
      systemPrompt: systemPrompt
    });

    let data;
    try {
      let content = result.content;
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      data = JSON.parse(content);
    } catch (parseError) {
      console.error('LinkedIn JSON parsing failed', parseError);
      return res.status(500).json({ success: false, error: 'AI failed to return valid analysis.' });
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('LinkedIn analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze LinkedIn profile' });
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

// --- Faculty: Generate Assignment ---
router.post('/faculty/generate-assignment', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { topic, difficulty, learningGoals } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }
    
    const systemPrompt = `You are an expert curriculum designer. Generate a structured, comprehensive assignment.
The output MUST be a valid JSON object matching this EXACT structure:
{
  "title": "...",
  "description": "...",
  "instructions": ["...", "..."],
  "gradingCriteria": ["...", "..."],
  "estimatedTimeHours": 4
}`;

    const prompt = `Create an assignment on the topic "${topic}". 
Difficulty level: ${difficulty || 'Intermediate'}. 
Learning goals: ${learningGoals || 'General understanding and application'}.`;

    const result = await aiService.generateContent(prompt, {
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: systemPrompt
    });

    let assignmentData;
    try {
      let content = result.content;
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      assignmentData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI assignment JSON:', parseError);
      return res.status(500).json({ success: false, error: 'AI failed to return valid assignment data.' });
    }

    res.json({ success: true, data: assignmentData });
  } catch (error) {
    console.error('generate-assignment error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate assignment' });
  }
});

// --- Faculty: Student Risk Analytics ---
router.get('/faculty/student-risk-analytics', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    // 1. Fetch all students in faculty's department and their grades
    let studentsQuery = `
      SELECT u.id, u.name, u.student_id, u.department
      FROM users u
      WHERE u.role = 'student'
    `;
    const params = [];
    if (req.user.department) {
      studentsQuery += ` AND u.department = ?`;
      params.push(req.user.department);
    }
    
    const students = await db.allAsync(studentsQuery, params);
    
    if (students.length === 0) {
      return res.json({ success: true, data: { atRiskStudents: [] } });
    }

    // Prepare data summary
    const studentPromises = students.map(async (student) => {
      const submissions = await db.allAsync(`
        SELECT a.title, s.grade, s.status, s.created_at
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = ?
      `, [student.id]);
      
      const grades = submissions.map(s => s.grade || 'Ungraded');
      
      return {
        id: student.id,
        name: student.name,
        studentId: student.student_id,
        submissionCount: submissions.length,
        grades: grades
      };
    });
    
    const studentData = await Promise.all(studentPromises);
    
    // 2. Formulate Prompt
    const systemPrompt = `You are an educational data analyst. Review the provided student data (submissions & grades) to identify students who are "At-Risk" of failing or falling behind.
Return ONLY a valid JSON object matching this EXACT structure:
{
  "atRiskStudents": [
    {
      "studentId": "...",
      "name": "...",
      "riskLevel": "High|Medium|Low",
      "reasoning": "...",
      "recommendedIntervention": "..."
    }
  ],
  "insights": "General observation about the class performance"
}`;

    const prompt = `Here is the anonymous data for my class:\n${JSON.stringify(studentData, null, 2)}\n\nAnalyze this data and identify at-risk students.`;

    const result = await aiService.generateContent(prompt, {
      maxTokens: 3000,
      temperature: 0.5,
      systemPrompt: systemPrompt
    });

    let riskData;
    try {
      let content = result.content;
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      riskData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse risk analytics:', parseError, result.content);
      return res.status(500).json({ success: false, error: 'AI failed to process analytics.' });
    }

    res.json({ success: true, data: riskData });
  } catch (error) {
    console.error('student-risk-analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate risk analytics' });
  }
});

// --- Student: AI Research Lab ---
router.post('/student/research-lab', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Research query is required' });
    }
    
    const systemPrompt = `You are a strict academic research assistant. You provide thorough answers.
Crucially, you MUST "fake" generating sources for your claims to demonstrate a transparency feature. Ensure your response is highly academic and includes inline citations [1], [2].
Return ONLY a valid JSON object matching this EXACT structure:
{
  "summary": "...",
  "detailedExplanation": "...",
  "sources": [
    { "id": 1, "title": "...", "author": "...", "year": "..." }
  ]
}`;

    const prompt = `Research Query: "${query}". Please provide an academic summary and detailed explanation.`;

    const result = await aiService.generateContent(prompt, {
      maxTokens: 2500,
      temperature: 0.6,
      systemPrompt: systemPrompt
    });

    let researchData;
    try {
      let content = result.content;
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
      }
      researchData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse research data:', parseError);
      return res.status(500).json({ success: false, error: 'AI failed to process research query.' });
    }

    res.json({ success: true, data: researchData });
  } catch (error) {
    console.error('research-lab error:', error);
    res.status(500).json({ success: false, error: 'Failed to process research query' });
  }
});

export default router;

