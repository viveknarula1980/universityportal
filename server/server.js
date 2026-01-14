import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import db, { initDatabase } from './database/db.js';
import { blockchainService } from './services/blockchain.js';
import { aiService } from './services/ai.js';
import authRoutes from './routes/auth.js';
import assignmentRoutes from './routes/assignments.js';
import certificateRoutes from './routes/certificates.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://ai-assignment-gateway.onrender.com',
      // Add your frontend deployment URL here when deployed
    ];
    
    // In production, you might want to restrict this
    // For now, allow all origins for flexibility
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Initialize services
async function initializeServices() {
  console.log('🔧 Initializing services...\n');
  
  await initDatabase();
  console.log('');
  
  await blockchainService.initialize();
  console.log('');
  
  // AI service initializes in constructor
  if (aiService.isConfigured()) {
    console.log('🔍 Validating OpenAI API key...');
    try {
      const validation = await aiService.validateApiKey();
      if (validation.valid) {
        console.log('✅ AI service ready - API key validated');
      } else {
        console.log('⚠️  AI service configured but API key validation failed:');
        console.log(`   ${validation.error || 'Unknown error'}`);
        if (validation.error && validation.error.includes('permissions')) {
          console.log('   💡 Fix: Create a new API key with full permissions at https://platform.openai.com/api-keys');
          console.log('   ⚠️  NOTE: "model.read" is NOT enough - you need "model.request" scope');
          console.log('   💡 "Read" only lets you view models, "Request" lets you actually use them');
          console.log('   💡 Or ensure your restricted key has the "model.request" scope enabled (not just "model.read")');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not validate API key:', error.message);
      console.log('   AI service may still work, but errors may occur during generation');
    }
  } else {
    console.log('⚠️  AI service not configured (set OPENAI_API_KEY in .env)');
  }
  
  console.log('\n✅ All services initialized\n');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 EduChain Backend Server');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_PATH || './data/educhain.db'}`);
    console.log(`🔗 Blockchain: ${blockchainService.initialized ? '✅ Connected' : '⚠️  Mock Mode (configure BLOCKCHAIN_RPC_URL)'}`);
    console.log(`🤖 AI Service: ${aiService.isConfigured() ? '✅ Ready' : '⚠️  Not Configured (set OPENAI_API_KEY)'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📖 Setup Guides:');
    if (!blockchainService.initialized) {
      console.log('   - Blockchain: See BLOCKCHAIN_SETUP.md');
    }
    if (!aiService.isConfigured()) {
      console.log('   - AI: See AI_SETUP.md');
    }
    console.log('   - Complete: See COMPLETE_SETUP.md\n');
  });
}).catch(error => {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
});

export default app;

