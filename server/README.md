# EduChain Backend Server

Real backend implementation with blockchain and AI integration.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure `.env`:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=./data/educhain.db

# Blockchain (Ethereum/Polygon)
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BLOCKCHAIN_PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

4. Start server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Assignments
- `POST /api/assignments/submit` - Submit assignment (multipart/form-data)
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/submissions` - Get user submissions

### Certificates
- `POST /api/certificates/issue` - Issue certificate (admin only)
- `GET /api/certificates/verify/:id` - Verify certificate (public)
- `GET /api/certificates` - Get all certificates (admin only)
- `POST /api/certificates/:id/revoke` - Revoke certificate (admin only)

## Default Users

After first run, default admin user is created:
- Email: `admin@university.edu`
- Password: `admin123`

## Blockchain Integration

The server uses Ethereum/Polygon for blockchain operations. Configure your RPC URL and private key in `.env`.

For development without blockchain, the server will use mock hashes (still stored in database).

## AI Integration

Configure OpenAI API key in `.env` to enable real AI content generation. Without it, mock responses are returned.

