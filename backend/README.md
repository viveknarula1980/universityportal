# Backend API Documentation

## Setup

The backend API should be implemented to handle all blockchain and data operations. For development, the frontend uses mock implementations that can be replaced with real API calls.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Assignments
- `POST /api/assignments/submit` - Submit assignment with file
- `GET /api/assignments` - Get all assignments for user
- `GET /api/assignments/:id` - Get assignment by ID

### Certificates
- `POST /api/certificates/issue` - Issue new certificate
- `GET /api/certificates` - Get all certificates
- `POST /api/certificates/:id/revoke` - Revoke certificate
- `GET /api/certificates/verify/:id` - Verify certificate

### Faculty
- `GET /api/faculty/submissions` - Get all student submissions
- `POST /api/faculty/submissions/:id/grade` - Grade a submission

### Admin
- `POST /api/admin/ai-limits` - Update AI token limits
- `GET /api/admin/ai-limits` - Get current AI limits
- `GET /api/admin/audit-logs` - Get audit logs

### Blockchain
- `GET /api/blockchain/records` - Get all blockchain records
- `GET /api/blockchain/records/:hash` - Get record by hash

## Blockchain Integration

The backend should integrate with a blockchain service (Ethereum, Polygon, or custom blockchain) to:
1. Store assignment submission hashes
2. Store certificate metadata
3. Verify certificate authenticity
4. Maintain immutable audit logs

## Environment Variables

```
VITE_API_URL=http://localhost:3000/api
BLOCKCHAIN_RPC_URL=your_blockchain_rpc_url
BLOCKCHAIN_PRIVATE_KEY=your_private_key
DATABASE_URL=your_database_url
```

