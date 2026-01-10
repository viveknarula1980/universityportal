import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    
    if (process.env.OPENAI_API_KEY) {
      try {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.initialized = true;
        console.log('✅ OpenAI service initialized');
        console.log(`🤖 Using model: ${this.model}`);
      } catch (error) {
        console.error('Failed to initialize OpenAI:', error.message);
        this.initialized = false;
      }
    } else {
      console.warn('⚠️  OPENAI_API_KEY not configured');
      console.warn('   Set OPENAI_API_KEY in .env for real AI generation');
      this.initialized = false;
    }
  }

  async generateContent(prompt, options = {}) {
    const {
      maxTokens = 200,
      temperature = 0.7,
      systemPrompt = "You are a helpful academic assistant. Provide clear, well-structured responses for student assignments."
    } = options;

    if (!this.initialized || !this.client) {
      // Return informative message if API not configured
      return {
        content: `⚠️ AI Service Not Configured\n\nTo enable real AI content generation:\n1. Get an OpenAI API key from https://platform.openai.com/api-keys\n2. Add OPENAI_API_KEY=sk-... to your server/.env file\n3. Restart the server\n\nYour prompt was: "${prompt.substring(0, 100)}..."\n\nFor now, please write your content manually or configure the API key.`,
        tokensUsed: 0,
        model: 'not-configured',
        error: 'OpenAI API key not configured'
      };
    }

    try {
      console.log(`🤖 Generating AI content with ${this.model}...`);
      
      const startTime = Date.now();
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      const content = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;
      const promptTokens = completion.usage.prompt_tokens;
      const completionTokens = completion.usage.completion_tokens;

      console.log(`✅ AI generation complete:`);
      console.log(`   Tokens used: ${tokensUsed} (prompt: ${promptTokens}, completion: ${completionTokens})`);
      console.log(`   Time: ${duration}s`);
      console.log(`   Cost estimate: $${((promptTokens * 0.0015 + completionTokens * 0.002) / 1000).toFixed(6)}`);

      return {
        content,
        tokensUsed,
        promptTokens,
        completionTokens,
        model: completion.model,
        duration: `${duration}s`,
        costEstimate: ((promptTokens * 0.0015 + completionTokens * 0.002) / 1000).toFixed(6)
      };
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
      
      // Handle specific errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI API server error. Please try again later.');
      } else if (error.message.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded. Please add credits to your account.');
      }
      
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async checkTokenUsage(userId, semester) {
    // This would query the database for actual token usage
    // Implementation depends on your database structure
    return {
      used: 0,
      limit: parseInt(process.env.AI_TOKENS_PER_SEMESTER) || 80000,
      remaining: parseInt(process.env.AI_TOKENS_PER_SEMESTER) || 80000
    };
  }

  async estimateCost(tokens) {
    // GPT-3.5-turbo pricing (as of 2024)
    const promptPricePer1K = 0.0015; // $0.0015 per 1K prompt tokens
    const completionPricePer1K = 0.002; // $0.002 per 1K completion tokens
    
    // Rough estimate (assuming 50/50 split)
    const estimatedCost = (tokens / 2) * (promptPricePer1K + completionPricePer1K) / 1000;
    return estimatedCost.toFixed(6);
  }

  isConfigured() {
    return this.initialized && this.client !== null;
  }
}

export const aiService = new AIService();
