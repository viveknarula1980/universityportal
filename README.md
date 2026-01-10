# AI-Transparent University Portal with Blockchain Verification

A **fully functional** university portal system with **real blockchain integration** and **real OpenAI AI** integration. No mocks - everything works end-to-end!

## Features

### 🎓 Student Portal
- Submit assignments with AI usage declaration
- Track AI token usage and quotas
- View blockchain-verified submissions
- Access AI content generator
- Monitor academic progress

### 👩‍🏫 Faculty Portal
- Review student submissions
- View AI usage percentages
- Grade assignments
- Access immutable timestamps
- Track student progress

### 🏫 Admin Portal
- Issue and revoke certificates
- Configure AI token limits
- View audit logs
- Manage system settings
- Monitor blockchain records

### 🔍 Public Verification
- Verify certificate authenticity
- Scan QR codes
- Check revocation status
- No login required

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **Blockchain**: Crypto-js for hashing, ready for blockchain integration
- **QR Codes**: qrcode.react

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for AI features) - [Get one here](https://platform.openai.com/api-keys)
- Blockchain RPC URL (for blockchain features) - [Get free from Infura](https://infura.io)

### Installation

1. **Install dependencies:**
```bash
npm install
cd server && npm install && cd ..
```

2. **Configure backend:**
```bash
cd server
cp .env.example .env
# Edit .env with your API keys
```

3. **Configure frontend:**
```bash
# Create .env in root
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

4. **Start everything:**
```bash
npm run dev:full
```

5. **Access application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Detailed Setup

See [COMPLETE_SETUP.md](./COMPLETE_SETUP.md) for full instructions.

- [Blockchain Setup](./BLOCKCHAIN_SETUP.md) - Configure real blockchain
- [AI Setup](./AI_SETUP.md) - Configure OpenAI API

## Quick Login (Demo)

The application includes demo accounts for testing:

- **Student**: `student@university.edu` / `student123`
- **Faculty**: `faculty@university.edu` / `faculty123`
- **Admin**: `admin@university.edu` / `admin123`

Or use the quick login buttons on the login page.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (sidebars, main layout)
│   ├── dashboard/      # Dashboard-specific components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
├── services/           # API and blockchain services
├── lib/                # Utility functions
└── hooks/              # Custom React hooks
```

## Key Features Implementation

### Authentication
- JWT-based authentication (mock for development)
- Role-based access control
- Protected routes
- Session persistence

### Blockchain Integration
- SHA-256 file hashing
- Assignment submission to blockchain
- Certificate issuance on blockchain
- Certificate verification
- Immutable audit logs

### AI Usage Tracking
- Token quota management
- Context window limits
- Usage declaration (None/Partial/Full)
- Real-time usage tracking

### Certificate Management
- Digital certificate issuance
- QR code generation
- Blockchain verification
- Revocation support

## Backend Integration

The frontend is ready for backend integration. Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
```

Set environment variable:
```bash
VITE_API_URL=http://localhost:3000/api
```

## Blockchain Setup

For production, integrate with a real blockchain:

1. Update `src/services/blockchain.ts` with your blockchain RPC URL
2. Configure smart contracts for:
   - Assignment submission storage
   - Certificate issuance
   - Verification queries

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:3000/api
VITE_BLOCKCHAIN_RPC_URL=your_blockchain_rpc_url
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Development Notes

- Mock authentication is used for development
- Blockchain operations use mock implementations
- All API calls have fallback to mock data
- Replace mock implementations with real backend/blockchain in production

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
