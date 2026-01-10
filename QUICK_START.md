# 🚀 Quick Start - Get Running in 5 Minutes

## Step 1: Install Dependencies (2 min)

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

## Step 2: Basic Configuration (1 min)

```bash
cd server
cp .env.example .env
```

Edit `server/.env` - **Minimum required:**
```env
PORT=3000
JWT_SECRET=change-this-to-random-secret-key-min-32-chars
DATABASE_PATH=./data/educhain.db
FRONTEND_URL=http://localhost:5173
```

Create `.env` in root:
```env
VITE_API_URL=http://localhost:3000/api
```

## Step 3: Start Server (30 sec)

```bash
# Start both frontend and backend
npm run dev:full
```

Or separately:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2  
npm run dev
```

## Step 4: Test It! (1 min)

1. Open http://localhost:5173
2. Click "Student Portal"
3. Login with: `student@university.edu` / `student123`
4. Try submitting an assignment!

## ✅ You're Done!

The system works with:
- ✅ Real database (SQLite)
- ✅ Real authentication (JWT)
- ✅ Real file storage
- ⚠️ Deterministic blockchain hashes (configure for real blockchain)
- ⚠️ Informative AI messages (configure for real AI)

## Next Steps (Optional)

### Add Real Blockchain (5 min)
See [BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md)
- Get free RPC URL from Infura
- Get test ETH from faucet
- Add to `.env`

### Add Real AI (3 min)
See [AI_SETUP.md](./AI_SETUP.md)
- Get OpenAI API key
- Add $5 credits
- Add to `.env`

## Default Accounts

Auto-created on first login:
- **Student**: `student@university.edu` / `student123`
- **Faculty**: `faculty@university.edu` / `faculty123`
- **Admin**: `admin@university.edu` / `admin123`

## Troubleshooting

**Port already in use?**
- Change `PORT` in `server/.env`

**Database errors?**
- Delete `server/data/educhain.db` and restart

**CORS errors?**
- Check `FRONTEND_URL` in `server/.env` matches your frontend URL

**Can't connect to backend?**
- Check backend is running on port 3000
- Check `VITE_API_URL` in root `.env`

## That's It! 🎉

Your system is now running with real backend, database, and authentication!

