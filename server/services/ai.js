import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.provider = null; // 'openai' or 'gemini'
    // Default model: gpt-5-nano
    // GPT-5 Nano: Fastest, most cost-efficient version of GPT-5
    // - Pricing: $0.05 per 1K input tokens, $0.4 per 1K output tokens
    // - 400,000 context window, 128,000 max output tokens
    // - Great for summarization and classification tasks
    this.model = process.env.OPENAI_MODEL || 'gpt-5-nano';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // Default to gemini-2.5-flash (latest fast model)
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Try Gemini First (Preferred AI Provider)
    if (this.geminiApiKey) {
      this.initialized = true;
      this.provider = 'gemini';
      console.log('✅ Gemini service initialized (primary)');
      console.log(`🤖 Using model: ${this.geminiModel}`);
    }
    
    // Fallback to OpenAI if Gemini not available
    if (!this.initialized && process.env.OPENAI_API_KEY) {
      try {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.initialized = true;
        this.provider = 'openai';
        console.log('✅ OpenAI service initialized (fallback)');
        console.log(`🤖 Using model: ${this.model}`);
      } catch (error) {
        console.error('Failed to initialize OpenAI:', error.message);
        this.initialized = false;
      }
    }
    
    if (!this.initialized) {
      console.warn('⚠️  No AI service configured');
      console.warn('   Set OPENAI_API_KEY or GEMINI_API_KEY in .env for real AI generation');
    }
  }

  async generateContent(prompt, options = {}) {
    const {
      maxTokens = 8000, // Increased default for assignments - GPT-5-nano supports up to 128k
      temperature = 0.7,
      systemPrompt = "You are a helpful academic assistant. Provide clear, well-structured responses for student assignments."
    } = options;

    if (!this.initialized) {
      // Return informative message if API not configured
      return {
        content: `⚠️ AI Service Not Configured\n\nTo enable real AI content generation:\n1. Get an OpenAI API key from https://platform.openai.com/api-keys\n   OR a Gemini API key from https://makersuite.google.com/app/apikey\n2. Add OPENAI_API_KEY=sk-... or GEMINI_API_KEY=... to your server/.env file\n3. Restart the server\n\nYour prompt was: "${prompt.substring(0, 100)}..."\n\nFor now, please write your content manually or configure the API key.`,
        tokensUsed: 0,
        model: 'not-configured',
        error: 'AI API key not configured'
      };
    }

    // Use OpenAI if available, otherwise fallback to Gemini
    if (this.provider === 'openai' && this.client) {
      return await this.generateWithOpenAI(prompt, options);
    } else if (this.provider === 'gemini' && this.geminiApiKey) {
      return await this.generateWithGemini(prompt, options);
    }

    return {
      content: '⚠️ No AI provider available',
      tokensUsed: 0,
      model: 'not-configured',
      error: 'No AI provider configured'
    };
  }

  async generateWithOpenAI(prompt, options = {}) {
    const {
      maxTokens = 8000,
      temperature = 0.7,
      systemPrompt = "You are a helpful academic assistant. Provide clear, well-structured responses for student assignments."
    } = options;

    try {
      console.log(`🤖 Generating AI content with OpenAI ${this.model}...`);
      console.log(`   Max tokens: ${maxTokens} (supports up to 128000)`);
      
      const startTime = Date.now();
      
      // Use /v1/responses endpoint for GPT-5 Nano via SDK
      // Input format: array with role and content structure
      // Content type: 'input_text' (required by Responses API)
      const input = [];
      
      if (systemPrompt) {
        input.push({
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }]
        });
      }
      
      input.push({
        role: "user",
        content: [{ type: "input_text", text: prompt }]
      });
      
      // Use SDK's responses.create() method (proper auth, retries, error handling)
      // Note: GPT-5-nano doesn't support temperature parameter
      let response = await this.client.responses.create({
        model: this.model,
        input: input,
        max_output_tokens: maxTokens,
      });

      // If response is incomplete, poll for completion (max 30 attempts, 2 second intervals)
      // GPT-5-nano with reasoning tokens may take longer to complete
      if (response.status === 'incomplete' && response.id) {
        console.log('⏳ Response incomplete, polling for completion...');
        let attempts = 0;
        const maxAttempts = 30; // Increased attempts for longer responses
        const pollInterval = 2000; // 2 seconds between polls
        
        while (response.status === 'incomplete' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          try {
            // Use direct API call for polling (more reliable)
            const apiUrl = this.client.baseURL || 'https://api.openai.com/v1';
            const pollResponse = await fetch(`${apiUrl}/responses/${response.id}`, {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              }
            });
            
            if (!pollResponse.ok) {
              throw new Error(`Polling failed: ${pollResponse.status}`);
            }
            
            response = await pollResponse.json();
            attempts++;
            
            // Check if we now have output_text items
            const hasOutputText = response.output && Array.isArray(response.output) && 
              response.output.some(item => item.type === 'output_text' || item.type === 'text');
            
            if (response.status === 'complete' || hasOutputText) {
              console.log(`✅ Response completed after ${attempts} attempts (${(attempts * pollInterval / 1000).toFixed(1)}s)`);
              break;
            }
            
            // Log progress every 5 attempts
            if (attempts % 5 === 0) {
              console.log(`   Still polling... (attempt ${attempts}/${maxAttempts})`);
            }
          } catch (error) {
            console.error('Error polling for response:', error.message);
            break;
          }
        }
        
        if (response.status === 'incomplete') {
          console.log(`⚠️  Response still incomplete after ${attempts} polling attempts`);
          console.log(`💡 This usually means max_output_tokens (${response.max_output_tokens || maxTokens}) is too low for the response`);
          console.log(`💡 Try increasing maxTokens (current: ${maxTokens}, max supported: 128000)`);
        }
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Responses API returns output as an array of objects
      // Extract text content from items with type "output_text"
      // Structure can be: output_text directly OR nested in message.content[]
      let content = '';
      if (response.output && Array.isArray(response.output)) {
        // First, try to find output_text items directly
        const directOutputText = response.output.filter(item => 
          item.type === 'output_text' || item.type === 'text'
        );
        
        // Then, look for message items with content arrays
        const messageItems = response.output.filter(item => 
          item.type === 'message' && Array.isArray(item.content)
        );
        
        // Extract text from direct output_text items
        if (directOutputText.length > 0) {
          content = directOutputText
            .map(item => item.text || '')
            .filter(text => text && text.trim().length > 0)
            .join('\n');
        }
        
        // Extract text from message.content arrays (nested structure)
        // Combine ALL message items to get complete content
        if (messageItems.length > 0) {
          const messageContent = messageItems
            .map(message => {
              if (!Array.isArray(message.content)) return '';
              return message.content
                .filter(c => c.type === 'output_text' || c.type === 'text')
                .map(c => c.text || '')
                .filter(text => text && text.trim().length > 0)
                .join('');
            })
            .filter(text => text && text.trim().length > 0)
            .join('\n');
          
          // Combine with direct output_text if both exist
          if (messageContent) {
            content = content ? content + '\n' + messageContent : messageContent;
          }
        }
        
        // Fallback: try to extract from any content arrays
        if (!content) {
          content = response.output
            .map(item => {
              if (item.content && Array.isArray(item.content)) {
                return item.content
                  .filter(c => c.type === 'output_text' || c.type === 'text')
                  .map(c => c.text || '')
                  .join('');
              }
              return '';
            })
            .filter(text => text && text.trim().length > 0)
            .join('\n');
        }
        
        // If no output_text found, check if we only have reasoning items
        if (!content && response.output.length > 0) {
          const outputTypes = response.output.map(item => item.type);
          console.log('⚠️  No output_text found. Output types:', outputTypes.join(', '));
          console.log('📋 Response status:', response.status);
          console.log('📋 Max output tokens:', response.max_output_tokens);
          console.log('📋 Full output structure (first 3000 chars):', JSON.stringify(response.output, null, 2).substring(0, 3000));
          
          // Check if there's any text in reasoning items (sometimes content is there)
          const reasoningItems = response.output.filter(item => item.type === 'reasoning');
          if (reasoningItems.length > 0) {
            // Check if reasoning items have any text content
            const reasoningText = reasoningItems
              .map(item => {
                if (item.text) return item.text;
                if (item.content && typeof item.content === 'string') return item.content;
                if (item.summary && Array.isArray(item.summary)) {
                  return item.summary.map(s => s.text || s.content || '').join(' ');
                }
                return '';
              })
              .filter(t => t.trim().length > 0)
              .join('\n');
            
            if (reasoningText) {
              console.log('💡 Found text in reasoning items, using that');
              content = reasoningText;
            }
          }
          
          // If we still don't have content
          if (!content) {
            if (outputTypes.every(type => type === 'reasoning')) {
              console.log('💡 Only reasoning tokens found - response may still be processing or max_output_tokens too low');
              content = `⚠️ Response incomplete. The model generated ${response.output.length} reasoning tokens but no output text yet. ` +
                       `This usually means max_output_tokens is too low. ` +
                       `Try increasing maxTokens (current: ${maxTokens}, recommended: at least 8000 for assignments, max: 128000).`;
            } else {
              content = '⚠️ Unable to extract text content from response. Please check the API response format.';
            }
          }
        }
      } else if (response.output_text) {
        content = response.output_text;
      } else if (typeof response.output === 'string') {
        content = response.output;
      }

      // Handle incomplete responses (hit max_output_tokens)
      const isIncomplete = response.status === 'incomplete';
      if (isIncomplete) {
        console.log('⚠️  Response incomplete - hit max_output_tokens limit');
        if (!content) {
          content = '⚠️ Response was truncated due to max_output_tokens limit. Please increase maxTokens or try a shorter prompt.';
        }
      }

      // Get usage information
      const tokensUsed = response.usage?.total_tokens || 0;
      const promptTokens = response.usage?.input_tokens || response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.output_tokens || response.usage?.completion_tokens || 0;
      const model = response.model || this.model;

      // Calculate cost based on model pricing
      const cost = this.calculateCost(promptTokens, completionTokens, model);

      console.log(`✅ AI generation complete:`);
      console.log(`   Status: ${response.status || 'complete'}`);
      console.log(`   Content length: ${content?.length || 0} characters`);
      if (content && typeof content === 'string') {
        console.log(`   Content preview: ${content.substring(0, 100)}...`);
      }
      console.log(`   Tokens used: ${tokensUsed} (prompt: ${promptTokens}, completion: ${completionTokens})`);
      console.log(`   Time: ${duration}s`);
      console.log(`   Cost estimate: $${cost.toFixed(6)}`);

      return {
        content,
        tokensUsed,
        promptTokens,
        completionTokens,
        model: model,
        duration: `${duration}s`,
        costEstimate: cost.toFixed(6)
      };
    } catch (error) {
      // Log full error details for debugging
      console.error('❌ OpenAI API error:', error.message);
      if (error.status) {
        console.error(`   Status: ${error.status}`);
      }
      if (error.response?.data) {
        console.error('   Details:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Handle specific errors
      if (error.status === 401) {
        // Check for permission/scope errors
        if (error.message && (error.message.includes('insufficient permissions') || 
            error.message.includes('Missing scopes') || 
            error.message.includes('model.request'))) {
          console.error('   💡 This is a permissions/scope issue, not an invalid key');
          console.error('   ⚠️  NOTE: "model.read" permissions are NOT enough - you need "model.request" scope');
          console.error('   💡 Solution: Create a new API key with full permissions or enable "model.request" scope');
          console.error('   💡 "Read" only lets you view models, "Request" lets you actually use them');
          throw new Error(
            'OpenAI API key lacks required permissions. ' +
            'Your API key has "model.read" permissions but needs "model.request" scope to make API calls. ' +
            '"Read" permissions only let you view/list models - you need "request" permissions to actually use them. ' +
            'If using a restricted API key, ensure it has the "model.request" scope enabled (not just "model.read"). ' +
            'If using an organization key, check your role (Reader, Writer, Owner) and project permissions (Member, Owner). ' +
            'You may need to create a new API key with full permissions at https://platform.openai.com/api-keys'
          );
        }
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env');
      } else if (error.status === 404 || (error.message && error.message.includes('model'))) {
        if (error.message && (error.message.includes('not found') || error.message.includes('does not exist') || error.message.includes('Invalid model'))) {
          throw new Error(
            `Model "${this.model}" not found. This model may not exist in OpenAI's API. ` +
            `Valid models include: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview, o1-preview, etc. ` +
            `Check available models at https://platform.openai.com/docs/models or set OPENAI_MODEL in .env to a valid model name.`
          );
        }
      } else if (error.status === 429) {
        // Try Gemini as fallback on rate limit
        if (this.geminiApiKey && this.provider === 'openai') {
          console.log('🔄 OpenAI rate limit hit, trying Gemini as fallback...');
          this.provider = 'gemini';
          return await this.generateWithGemini(prompt, options);
        }
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        // Try Gemini as fallback on server error
        if (this.geminiApiKey && this.provider === 'openai') {
          console.log('🔄 OpenAI server error, trying Gemini as fallback...');
          this.provider = 'gemini';
          return await this.generateWithGemini(prompt, options);
        }
        throw new Error('OpenAI API server error. Please try again later.');
      } else if (error.message && error.message.includes('insufficient_quota')) {
        // Try Gemini as fallback on quota exceeded
        if (this.geminiApiKey && this.provider === 'openai') {
          console.log('🔄 OpenAI quota exceeded, trying Gemini as fallback...');
          this.provider = 'gemini';
          return await this.generateWithGemini(prompt, options);
        }
        throw new Error('OpenAI API quota exceeded. Please add credits to your account.');
      }
      
      // Try Gemini as fallback for other errors
      if (this.geminiApiKey && this.provider === 'openai') {
        console.log('🔄 OpenAI error, trying Gemini as fallback...');
        this.provider = 'gemini';
        return await this.generateWithGemini(prompt, options);
      }
      
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async generateWithGemini(prompt, options = {}) {
    const {
      maxTokens = 8000,
      temperature = 0.7,
      systemPrompt = "You are a helpful academic assistant. Provide clear, well-structured responses for student assignments."
    } = options;

    try {
      console.log(`🤖 Generating AI content with Gemini ${this.geminiModel}...`);
      
      const startTime = Date.now();
      
      // Build the prompt with system instruction
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
        : prompt;

      // First, try to list available models to see what's actually available
      let availableModels = [];
      const apiVersions = ['v1beta', 'v1'];
      
      for (const apiVersion of apiVersions) {
        try {
          const listUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${this.geminiApiKey}`;
          const listResponse = await fetch(listUrl);
          
          if (listResponse.ok) {
            const listData = await listResponse.json();
            if (listData.models && Array.isArray(listData.models)) {
              availableModels = listData.models
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));
              console.log(`✅ Found ${availableModels.length} available Gemini models: ${availableModels.join(', ')}`);
              break;
            }
          }
        } catch (error) {
          console.log(`   Could not list models for ${apiVersion}: ${error.message}`);
          continue;
        }
      }
      
      // If we couldn't list models, use fallback list with latest models
      if (availableModels.length === 0) {
        console.log('⚠️  Could not list available models, using fallback list');
        availableModels = [
          'gemini-2.5-flash',      // Latest fast model
          'gemini-3-flash',         // Latest flash model
          'gemini-2.5-flash-lite',  // Lite version
          'gemini-pro',             // Classic model
          'gemini-1.5-pro',         // Pro model
          'gemini-1.5-flash',       // Flash model
          this.geminiModel          // User configured model
        ].filter(m => m); // Remove undefined
      }
      
      // Remove duplicates and add user's configured model
      const modelVariants = [...new Set([...availableModels, this.geminiModel].filter(m => m))];
      
      let response;
      let lastError;
      let lastErrorDetails = null;
      let workingModel = null;
      let workingApiVersion = null;
      
      // Try different model names and API versions
      for (const apiVersion of apiVersions) {
        for (const model of modelVariants) {
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${this.geminiApiKey}`;
            
            console.log(`   Trying model: ${model} (${apiVersion})...`);
            
            const testResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: fullPrompt
                  }]
                }],
                generationConfig: {
                  maxOutputTokens: maxTokens,
                  temperature: temperature,
                }
              })
            });
            
            if (testResponse.ok) {
              response = testResponse;
              workingModel = model;
              workingApiVersion = apiVersion;
              console.log(`✅ Using Gemini model: ${model} (API: ${apiVersion})`);
              break;
            } else {
              // Get error details for debugging
              const errorData = await testResponse.json().catch(() => ({}));
              lastError = new Error(errorData.error?.message || `HTTP ${testResponse.status}: ${testResponse.statusText}`);
              lastErrorDetails = {
                model,
                apiVersion,
                status: testResponse.status,
                error: errorData.error
              };
              
              if (testResponse.status === 404) {
                // Model not found, try next
                console.log(`   ❌ Model ${model} not found (404)`);
                continue;
              } else {
                // Other error - log but continue trying
                console.log(`   ❌ Error with ${model}: ${lastError.message}`);
                continue;
              }
            }
          } catch (error) {
            lastError = error;
            lastErrorDetails = { model, apiVersion, error: error.message };
            console.log(`   ❌ Exception with ${model}: ${error.message}`);
            continue;
          }
        }
        if (response) break;
      }
      
      if (!response) {
        const errorMsg = `No valid Gemini model found. `;
        const triedMsg = availableModels.length > 0 
          ? `Available models from API: ${availableModels.join(', ')}. Tried: ${modelVariants.join(', ')}. `
          : `Tried: ${modelVariants.join(', ')}. `;
        const detailsMsg = lastErrorDetails 
          ? `Last attempt: ${lastErrorDetails.model} (${lastErrorDetails.apiVersion}) - ${lastError?.message || 'Unknown error'}`
          : `Last error: ${lastError?.message || 'Unknown'}`;
        throw new Error(errorMsg + triedMsg + detailsMsg);
      }
      
      // Use the successful response
      const responseData = await response.json();
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Extract content from Gemini response
      const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usageMetadata = responseData.usageMetadata || {};
      const tokensUsed = usageMetadata.totalTokenCount || 0;
      const promptTokens = usageMetadata.promptTokenCount || 0;
      const completionTokens = usageMetadata.candidatesTokenCount || 0;

      // Calculate cost (Gemini pricing is different - approximate)
      const cost = this.calculateCost(promptTokens, completionTokens, this.geminiModel);

      console.log(`✅ AI generation complete (Gemini):`);
      console.log(`   Content length: ${content?.length || 0} characters`);
      if (content && typeof content === 'string') {
        console.log(`   Content preview: ${content.substring(0, 100)}...`);
      }
      console.log(`   Tokens used: ${tokensUsed} (prompt: ${promptTokens}, completion: ${completionTokens})`);
      console.log(`   Time: ${duration}s`);
      console.log(`   Cost estimate: $${cost.toFixed(6)}`);

      return {
        content,
        tokensUsed,
        promptTokens,
        completionTokens,
        model: this.geminiModel,
        duration: `${duration}s`,
        costEstimate: cost.toFixed(6)
      };
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      if (error.status) {
        console.error(`   Status: ${error.status}`);
      }
      if (error.response?.data) {
        console.error('   Details:', JSON.stringify(error.response.data, null, 2));
      }
      
      // If Gemini fails and we have OpenAI, try OpenAI as fallback
      if (this.provider === 'gemini' && process.env.OPENAI_API_KEY && !this.client) {
        console.log('🔄 Gemini failed, trying to initialize OpenAI as fallback...');
        try {
          this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          this.provider = 'openai';
          return await this.generateWithOpenAI(prompt, options);
        } catch (fallbackError) {
          console.error('❌ OpenAI fallback also failed:', fallbackError.message);
        }
      }
      
      throw new Error(`Gemini AI generation failed: ${error.message}`);
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

  calculateCost(promptTokens, completionTokens, model = null) {
    const modelName = model || this.model;
    
    // Model-specific pricing per 1K tokens
    let promptPricePer1K, completionPricePer1K;
    
    if (modelName && modelName.includes('gemini')) {
      // Gemini pricing (approximate - varies by model)
      // Gemini 1.5 Flash: Free tier, then $0.075/$0.30 per 1M tokens
      // Using approximate pricing for cost estimation
      promptPricePer1K = 0.000075;   // $0.075 per 1M = $0.000075 per 1K
      completionPricePer1K = 0.0003;  // $0.30 per 1M = $0.0003 per 1K
    } else if (modelName && modelName.includes('gpt-5-nano')) {
      // GPT-5 Nano pricing
      promptPricePer1K = 0.05;      // $0.05 per 1K input tokens
      completionPricePer1K = 0.4;   // $0.4 per 1K output tokens
    } else if (modelName && modelName.includes('gpt-4')) {
      // GPT-4 pricing
      promptPricePer1K = 0.03;      // $0.03 per 1K prompt tokens
      completionPricePer1K = 0.06; // $0.06 per 1K completion tokens
    } else {
      // Default: GPT-3.5-turbo pricing
      promptPricePer1K = 0.0015;    // $0.0015 per 1K prompt tokens
      completionPricePer1K = 0.002; // $0.002 per 1K completion tokens
    }
    
    const cost = (promptTokens * promptPricePer1K + completionTokens * completionPricePer1K) / 1000;
    return cost;
  }

  async estimateCost(tokens) {
    // Rough estimate (assuming 50/50 split between prompt and completion)
    const estimatedCost = this.calculateCost(tokens / 2, tokens / 2);
    return estimatedCost.toFixed(6);
  }

  async validateApiKey() {
    if (!this.initialized) {
      return {
        valid: false,
        error: 'API key not configured',
        message: 'OPENAI_API_KEY or GEMINI_API_KEY is not set in .env'
      };
    }

    try {
      if (this.provider === 'openai' && this.client) {
        // Use models.list() to validate the key - this only requires model.read scope
        // This is safer than making a test request which requires model.request scope
        await this.client.models.list();
        
        return {
          valid: true,
          message: 'OpenAI API key is valid and has required permissions',
          model: this.model,
          provider: 'openai'
        };
      } else if (this.provider === 'gemini' && this.geminiApiKey) {
        // Validate Gemini API key with a simple request
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Invalid API key');
        }
        
        return {
          valid: true,
          message: 'Gemini API key is valid',
          model: this.geminiModel,
          provider: 'gemini'
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error.status === 401) {
        if (error.message && (error.message.includes('insufficient permissions') || 
            error.message.includes('Missing scopes') || 
            error.message.includes('model.request'))) {
          errorMessage = 'API key has "model.read" but needs "model.request" scope. "Read" only lets you view models - you need "request" to use them';
        } else {
          errorMessage = 'Invalid API key';
        }
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (error.message && error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient quota/credits';
      } else {
        errorMessage = error.message || 'Validation failed';
      }

      return {
        valid: false,
        error: errorMessage,
        status: error.status,
        message: error.message
      };
    }
  }

  isConfigured() {
    // Check if either OpenAI or Gemini is configured
    return this.initialized && (this.client !== null || (this.provider === 'gemini' && this.geminiApiKey));
  }

  /**
   * Extract degree information from an image or PDF using AI
   * @param {string} base64Data - Base64 encoded image or PDF data
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<Object>} - Extracted degree information
   */
  async extractDegreeInfo(base64Data, mimeType = 'image/jpeg') {
    if (!this.initialized) {
      throw new Error('AI Service not configured');
    }

    const systemPrompt = `You are an expert at extracting information from university degree certificates and academic documents.
Extract the following fields from the provided document:
- studentName: Full name of the student
- studentId: Student ID or enrollment number (if found)
- degreeName: Name of the degree (e.g., Computer Science, Business Administration)
- degreeType: Type of degree (e.g., Bachelor of Science, Master of Arts, PhD)
- issueDate: Date of issuance in ISO format (YYYY-MM-DD), or as close as possible

Return ONLY a clean JSON object. If a field is not found, return an empty string for that field.
Format: { "studentName": "...", "studentId": "...", "degreeName": "...", "degreeType": "...", "issueDate": "..." }`;

    const userPrompt = "Please extract the degree information from this document.";

    try {
      if (this.provider === 'openai' && this.client) {
        // OpenAI Vision API (if model supports it)
        const response = await this.client.chat.completions.create({
          model: this.model.includes('gpt-4-vision') || this.model.includes('gpt-4o') || this.model.includes('gpt-5') ? this.model : 'gpt-4o',
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1000,
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
      } else if (this.provider === 'gemini' && this.geminiApiKey) {
        // Gemini Vision API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              response_mime_type: "application/json",
              maxOutputTokens: 1000,
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Gemini extraction failed');
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('OCR Extraction error:', error);
      throw new Error(`Failed to extract degree info: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
