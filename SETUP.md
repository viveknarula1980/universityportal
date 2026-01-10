# Complete Setup Guide - Real Implementation

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (for AI features)
- Ethereum/Polygon account (for blockchain - optional for development)

## Step 1: Install Frontend Dependencies

```bash
npm install
```

## Step 2: Setup Backend Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3000
JWT_SECRET=change-this-to-random-secret-key
DATABASE_PATH=./data/educhain.db

# Optional: For real blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BLOCKCHAIN_PRIVATE_KEY=your_private_key

# Optional: For real AI
OPENAI_API_KEY=sk-your-openai-api-key

FRONTEND_URL=http://localhost:5173
```

## Step 3: Start Backend Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3000`

## Step 4: Configure Frontend

Create `.env` in root directory:
```env
VITE_API_URL=http://localhost:3000/api
```

## Step 5: Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 6: Access Application

1. Open `http://localhost:5173`
2. Click on any portal (Student/Faculty/Admin)
3. You'll be redirected to login
4. Use default admin: `admin@university.edu` / `admin123`
5. Or register a new account

## Features

### Real Backend
- ✅ SQLite database for data persistence
- ✅ JWT authentication
- ✅ File upload and storage
- ✅ Real API endpoints

### Blockchain (Optional)
- Configure blockchain credentials for real blockchain
- Without config, uses deterministic hashes (still stored in DB)
- All records are tracked in database

### AI (Optional)
- Configure OpenAI API key for real AI generation
- Without config, returns informative mock responses
- Token usage is tracked

## Production Deployment

1. Set strong `JWT_SECRET`
2. Use PostgreSQL instead of SQLite
3. Configure real blockchain network
4. Set up OpenAI API key
5. Configure proper file storage (S3, etc.)
6. Set up HTTPS
7. Configure CORS properly

## Troubleshooting

- **Database errors**: Delete `server/data/educhain.db` and restart
- **CORS errors**: Check `FRONTEND_URL` in backend `.env`
- **API errors**: Ensure backend is running on port 3000
- **Blockchain errors**: Server will use mock mode if not configured

