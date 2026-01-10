# Complete Setup Guide - Full Working System

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git (optional)

## Step 1: Install All Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 2: Configure Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials:

### Minimum Required (Works without blockchain/AI):
```env
PORT=3000
JWT_SECRET=change-this-to-random-32-character-secret-key
DATABASE_PATH=./data/educhain.db
FRONTEND_URL=http://localhost:5173
```

### For Real Blockchain (See BLOCKCHAIN_SETUP.md):
```env
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

### For Real AI (See AI_SETUP.md):
```env
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-3.5-turbo
```

## Step 3: Configure Frontend

Create `.env` in root directory:
```env
VITE_API_URL=http://localhost:3000/api
```

## Step 4: Start Everything

### Option A: Start Both Together
```bash
npm run dev:full
```

### Option B: Start Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Step 5: Verify Setup

### Check Backend Logs:
```
✅ Database initialized successfully
🔗 Connected to blockchain: sepolia (Chain ID: 11155111)
📝 Wallet address: 0x...
💰 Wallet balance: 0.1 ETH
✅ Contract loaded: 0x...
✅ Blockchain service initialized successfully
✅ OpenAI service initialized
🤖 Using model: gpt-3.5-turbo
🚀 Server running on http://localhost:3000
```

### Check Frontend:
1. Open http://localhost:5173
2. You should see the landing page
3. Click on any portal
4. Login page should appear

## Step 6: Create First User

### Option A: Use Default Accounts
The system auto-creates these on first login:
- `admin@university.edu` / `admin123`
- `student@university.edu` / `student123`
- `faculty@university.edu` / `faculty123`

### Option B: Register New User
1. Go to login page
2. Click "Register" (if available)
3. Fill in details
4. Login with new credentials

## Testing Features

### Test Blockchain:
1. Login as student
2. Submit an assignment
3. Check backend logs for blockchain transaction
4. View assignment on blockchain page

### Test AI:
1. Login as student
2. Go to AI Generator
3. Enter a prompt
4. Click "Generate Content"
5. Should see real AI-generated content (if configured)

### Test Certificates:
1. Login as admin
2. Go to Certificate Issuance
3. Fill in certificate details
4. Issue certificate
5. Copy QR code URL
6. Open in verification page (public)

## Troubleshooting

### Backend won't start:
- Check Node.js version: `node --version` (need 18+)
- Check port 3000 is not in use
- Check database directory exists: `mkdir -p server/data`

### Frontend won't connect:
- Check backend is running
- Check `VITE_API_URL` in `.env`
- Check CORS settings in backend

### Blockchain errors:
- Check RPC URL is correct
- Check wallet has ETH (for gas)
- Check private key format (starts with 0x)
- See BLOCKCHAIN_SETUP.md for details

### AI errors:
- Check API key is correct
- Check you have credits in OpenAI account
- Check rate limits
- See AI_SETUP.md for details

### Database errors:
- Delete `server/data/educhain.db` and restart
- Check file permissions
- Check disk space

## Production Deployment

1. **Security:**
   - Change `JWT_SECRET` to strong random string
   - Use environment variables (never commit secrets)
   - Enable HTTPS
   - Configure CORS properly

2. **Database:**
   - Use PostgreSQL instead of SQLite
   - Set up backups
   - Configure connection pooling

3. **Blockchain:**
   - Use mainnet (not testnet)
   - Deploy contract to mainnet
   - Use secure key management

4. **AI:**
   - Monitor usage and costs
   - Set up usage alerts
   - Consider caching

5. **File Storage:**
   - Use cloud storage (S3, etc.)
   - Configure CDN
   - Set up backups

## Support

- Check logs in terminal
- Check browser console for errors
- Verify all environment variables
- See individual setup guides:
  - BLOCKCHAIN_SETUP.md
  - AI_SETUP.md

## Quick Commands

```bash
# Install everything
npm install && cd server && npm install && cd ..

# Start both
npm run dev:full

# Start backend only
npm run server

# Reset database
rm server/data/educhain.db && npm run server

# Check blockchain status
# Look for blockchain logs when starting server

# Check AI status
# Look for OpenAI logs when starting server
```

