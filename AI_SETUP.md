# OpenAI API Setup Guide

## Quick Start

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Important:** Save it immediately - you can't view it again!

### Step 2: Add Credits

1. Go to [Billing](https://platform.openai.com/account/billing)
2. Click "Add payment method"
3. Add credits (minimum $5)
4. Credits are used as you make API calls

### Step 3: Configure .env

```env
OPENAI_API_KEY=sk-YOUR_API_KEY_HERE
OPENAI_MODEL=gpt-3.5-turbo
```

### Step 4: Test

Start your server and check logs:
```
✅ OpenAI service initialized
🤖 Using model: gpt-3.5-turbo
```

## Model Options

**gpt-3.5-turbo** (Recommended - Cheapest)
- Cost: ~$0.0015 per 1K prompt tokens, $0.002 per 1K completion tokens
- Fast and cost-effective
- Good for most academic tasks

**gpt-4** (More Capable)
- Cost: ~$0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
- Better quality but more expensive
- Use for complex tasks

**gpt-4-turbo-preview** (Latest)
- Cost: Similar to gpt-4
- Best quality, latest features

## Pricing Estimate

For a typical assignment (2000 tokens):
- GPT-3.5-turbo: ~$0.003-0.004
- GPT-4: ~$0.06-0.12

With 80,000 token limit per semester:
- GPT-3.5-turbo: ~$0.12-0.16 total
- GPT-4: ~$2.40-4.80 total

## Usage Limits

OpenAI has rate limits:
- Free tier: 3 requests/minute
- Paid tier: Higher limits based on usage

If you hit rate limits, the system will show an error message.

## Monitoring Usage

1. Go to [Usage Dashboard](https://platform.openai.com/usage)
2. Monitor your API usage
3. Set up usage alerts

## Security

⚠️ **Never commit your API key to Git!**
- Always use `.env` file
- Add `.env` to `.gitignore`
- Use environment variables in production

## Troubleshooting

**"Invalid API key"**
- Check key starts with `sk-`
- Verify key is active in OpenAI dashboard
- Regenerate if needed

**"Insufficient quota"**
- Add credits to your account
- Check billing settings

**"Rate limit exceeded"**
- Wait a minute and try again
- Upgrade your OpenAI plan for higher limits

**"Model not found"**
- Check model name is correct
- Some models may be deprecated

## Cost Optimization Tips

1. Use `gpt-3.5-turbo` for most tasks
2. Set lower `max_tokens` when possible
3. Use system prompts to guide responses
4. Cache common responses
5. Monitor usage regularly

