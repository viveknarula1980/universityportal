# Database Fix - Using sqlite3 Instead of better-sqlite3

## Problem
`better-sqlite3` requires native compilation and has compatibility issues with Node.js v23.

## Solution
Switched to `sqlite3` which is more compatible.

## What Changed

1. **Removed** `better-sqlite3` from package.json
2. **Updated** `server/database/db.js` to use `sqlite3` with async/await
3. **Updated** all database queries to use async methods

## Installation

```bash
cd server
npm install
```

The `sqlite3` package should install without compilation issues.

## If You Still Get Errors

### Option 1: Use Node.js 18 or 20 (Recommended)
```bash
# Install nvm if you don't have it
# Then:
nvm install 20
nvm use 20
cd server
npm install
```

### Option 2: Install Build Tools (Windows)
```bash
npm install --global windows-build-tools
cd server
npm install
```

### Option 3: Use Docker
```bash
docker run -it -v $(pwd):/app -w /app node:20 npm install
```

## Verify Installation

```bash
cd server
node -e "const sqlite3 = require('sqlite3'); console.log('✅ sqlite3 installed successfully');"
```

If you see the success message, you're good to go!

## Start Server

```bash
cd server
npm run dev
```

You should see:
```
✅ Database connected: ./data/educhain.db
✅ Database schema initialized
✅ Database initialization complete
```

