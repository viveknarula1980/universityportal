# Blockchain Setup Guide

## Quick Start - Using Sepolia Testnet (Free)

### Step 1: Get Free RPC URL

1. Go to [Infura](https://infura.io) or [Alchemy](https://alchemy.com)
2. Create a free account
3. Create a new project
4. Select "Sepolia" network
5. Copy your RPC URL

**Infura format:**
```
https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

**Alchemy format:**
```
https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### Step 2: Get Test ETH

1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request test ETH (you'll need ~0.1 ETH for testing)

### Step 3: Get Private Key

**Option A: Create New Wallet (Recommended for Testing)**
```bash
# Install ethers.js CLI or use online tool
npx ethers-cli wallet create
```

**Option B: Export from MetaMask**
1. Open MetaMask
2. Account Details → Export Private Key
3. Copy the private key (starts with 0x)

### Step 4: Deploy Contract (Optional but Recommended)

**Using Remix IDE (Easiest):**
1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create new file: `EduChain.sol`
3. Copy contract code from `server/contracts/EduChain.sol`
4. Compile (Solidity 0.8.19+)
5. Deploy to Sepolia
6. Copy contract address

**Using Hardhat:**
```bash
cd server
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Configure hardhat.config.js with your RPC URL and private key
npx hardhat run scripts/deploy.js --network sepolia
```

### Step 5: Configure .env

```env
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

## Mainnet Setup (Production)

For production, use Ethereum Mainnet or Polygon:

1. Get mainnet RPC URL from Infura/Alchemy
2. Use real ETH (costs real money!)
3. Deploy contract to mainnet
4. Update `.env` with mainnet values

## Contract Deployment

The contract is simple and gas-efficient. Estimated deployment cost:
- Sepolia: ~0.001 ETH (free testnet)
- Mainnet: ~0.05-0.1 ETH (real money)

## Verification

After setup, check logs when starting server:
```
🔗 Connected to blockchain: sepolia (Chain ID: 11155111)
📝 Wallet address: 0x...
💰 Wallet balance: 0.1 ETH
✅ Contract loaded: 0x...
✅ Blockchain service initialized successfully
```

## Troubleshooting

**"Insufficient funds"**
- Add more test ETH to your wallet

**"Contract not deployed"**
- Deploy the contract first or remove CONTRACT_ADDRESS

**"Network error"**
- Check your RPC URL is correct
- Try a different RPC provider

**"Invalid private key"**
- Ensure key starts with `0x`
- Check for extra spaces

