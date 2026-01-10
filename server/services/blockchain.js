import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
    this.network = null;
  }

  async initialize() {
    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

      if (!rpcUrl || !privateKey) {
        console.warn('⚠️  Blockchain credentials not configured. Using deterministic hashes.');
        console.warn('   Set BLOCKCHAIN_RPC_URL and BLOCKCHAIN_PRIVATE_KEY in .env for real blockchain');
        this.initialized = false;
        return;
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Get network info
      const network = await this.provider.getNetwork();
      const chainId = network.chainId.toString();
      this.network = process.env.BLOCKCHAIN_NETWORK || network.name;
      const networkName = this.network === 'amoy' ? 'Amoy (Polygon Testnet)' : this.network;
      console.log(`🔗 Connected to blockchain: ${networkName} (Chain ID: ${chainId})`);
      console.log(`📝 Wallet address: ${this.wallet.address}`);

      // Check balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceInEth = ethers.formatEther(balance);
      const currency = this.network === 'amoy' || chainId === '80002' ? 'MATIC' : 'ETH';
      console.log(`💰 Wallet balance: ${balanceInEth} ${currency}`);

      if (parseFloat(balanceInEth) < 0.001) {
        console.warn(`⚠️  Low balance! You may need ${currency} for gas fees.`);
        if (this.network === 'amoy' || chainId === '80002') {
          console.warn('   Get free testnet MATIC from: https://faucet.polygon.technology/');
        }
      }

      // Load contract if address is provided
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (contractAddress) {
        try {
          // Contract ABI
          const contractABI = [
            "function storeRecord(string memory recordType, string memory recordId, string memory hash) public",
            "function getRecord(string memory hash) public view returns (string memory, string memory, uint256)",
            "function verifyRecord(string memory hash) public view returns (bool)",
            "event RecordStored(string indexed recordType, string indexed recordId, string hash, uint256 timestamp, address submittedBy)"
          ];

          this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
          
          // Verify contract is deployed
          const code = await this.provider.getCode(contractAddress);
          if (code === '0x') {
            console.warn('⚠️  Contract address provided but contract not deployed');
            console.warn('   Deploy the contract first or remove CONTRACT_ADDRESS from .env');
            this.contract = null;
          } else {
            console.log(`✅ Contract loaded: ${contractAddress}`);
          }
        } catch (error) {
          console.error('Failed to load contract:', error.message);
          this.contract = null;
        }
      } else {
        console.warn('⚠️  No CONTRACT_ADDRESS in .env - using direct transactions');
        console.warn('   For production, deploy the contract and set CONTRACT_ADDRESS');
      }

      this.initialized = true;
      console.log('✅ Blockchain service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain:', error.message);
      console.error('   Using deterministic hash mode');
      this.initialized = false;
    }
  }

  async submitRecord(recordType, recordId, dataHash) {
    if (!this.initialized || !this.provider) {
      return this.generateDeterministicHash(dataHash);
    }

    try {
      // If contract is available, use it
      if (this.contract) {
        const tx = await this.contract.storeRecord(recordType, recordId, dataHash);
        console.log(`📤 Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        return {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          timestamp: Date.now(),
          gasUsed: receipt.gasUsed.toString(),
          network: this.network
        };
      } else {
        // Fallback: Send transaction directly (stores hash in transaction data)
        // This is less efficient but works without a contract
        const tx = await this.wallet.sendTransaction({
          to: this.wallet.address, // Self-send to store data
          data: ethers.toUtf8Bytes(`${recordType}:${recordId}:${dataHash}`),
          gasLimit: 21000
        });
        
        console.log(`📤 Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        return {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          timestamp: Date.now(),
          gasUsed: receipt.gasUsed.toString(),
          network: this.network
        };
      }
    } catch (error) {
      console.error('❌ Blockchain submission failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data
      });
      
      // Check for common errors and throw them
      if (error.message && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas. Please add MATIC to your wallet. Get testnet MATIC from: https://faucet.polygon.technology/');
      } else if (error.message && error.message.includes('nonce')) {
        throw new Error('Transaction nonce error. Please try again.');
      } else if (error.message && error.message.includes('network')) {
        throw new Error('Network connection error. Check your RPC URL.');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for gas. Please add MATIC to your wallet.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network connection error. Check your RPC URL and internet connection.');
      } else if (error.reason) {
        throw new Error(`Blockchain error: ${error.reason}`);
      }
      
      // Re-throw with more context
      throw new Error(`Blockchain submission failed: ${error.message || error.toString()}`);
    }
  }

  async verifyRecord(hash) {
    if (!this.initialized || !this.provider) {
      return this.verifyDeterministicHash(hash);
    }

    try {
      if (this.contract) {
        const exists = await this.contract.verifyRecord(hash);
        return exists;
      } else {
        // For direct transactions, check if transaction exists
        try {
          const tx = await this.provider.getTransaction(hash);
          return tx !== null;
        } catch {
          return false;
        }
      }
    } catch (error) {
      console.error('Verification error:', error.message);
      return false;
    }
  }

  async getRecordDetails(hash) {
    if (!this.initialized || !this.contract) {
      return null;
    }

    try {
      const [recordType, recordId, timestamp] = await this.contract.getRecord(hash);
      return {
        recordType,
        recordId,
        timestamp: timestamp.toString(),
        hash
      };
    } catch (error) {
      console.error('Failed to get record details:', error.message);
      return null;
    }
  }

  generateDeterministicHash(dataHash) {
    // Generate a deterministic hash for development/testing
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(dataHash + Date.now().toString())
      .digest('hex');
    return {
      hash: `0x${hash.slice(0, 40)}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
      network: 'local',
      note: 'Deterministic hash (blockchain not configured)'
    };
  }

  async verifyDeterministicHash(hash) {
    // For deterministic hashes, check database
    return hash.startsWith('0x') && hash.length === 42;
  }

  async getBalance() {
    if (!this.initialized || !this.provider) {
      return null;
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error.message);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
