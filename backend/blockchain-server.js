const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Blockchain setup
let provider = null;
let contract = null;
let wallet = null;

// Demo users with wallet addresses
const demoUsers = [
  {
    id: 1,
    email: 'producer@demo.com',
    password: 'password123',
    role: 'producer',
    name: 'Demo Producer',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  },
  {
    id: 2,
    email: 'certifier@demo.com',
    password: 'password123',
    role: 'certifier',
    name: 'Demo Certifier',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
  },
  {
    id: 3,
    email: 'consumer@demo.com',
    password: 'password123',
    role: 'consumer',
    name: 'Demo Consumer',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118e8d7e59b9b332539fcd5c0e6b8a0c1c732b10ba7e9f8c7c8b9c0d1e2'
  },
  {
    id: 4,
    email: 'regulator@demo.com',
    password: 'password123',
    role: 'regulator',
    name: 'Demo Regulator',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'
  }
];

// Initialize blockchain connection
const initializeBlockchain = async () => {
  try {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      throw new Error('Contract address not found in environment variables');
    }

    // Create provider
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create wallet with certifier's private key (for issuing credits)
    const certifier = demoUsers.find(u => u.role === 'certifier');
    wallet = new ethers.Wallet(certifier.privateKey, provider);

    // Load contract ABI
    const abiPath = path.join(__dirname, '../blockchain/artifacts/contracts/HydrogenCredit.sol/HydrogenCredit.json');
    const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const abi = contractArtifact.abi;

    // Create contract instance
    contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`✅ Connected to blockchain network`);
    console.log(`📋 Contract address: ${contractAddress}`);
    console.log(`🔑 Wallet address: ${wallet.address}`);
    
    return { provider, contract, wallet };
  } catch (error) {
    console.error('❌ Failed to initialize blockchain:', error);
    throw error;
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Simple token validation (in real app, use JWT)
  const user = demoUsers.find(u => u.email === token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    blockchain: {
      connected: !!provider,
      contractAddress: process.env.CONTRACT_ADDRESS,
      walletAddress: wallet?.address
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, privateKey: __, ...userWithoutSensitive } = user;
  
  res.json({
    message: 'Login successful',
    user: userWithoutSensitive,
    token: user.email // Simple token for demo
  });
});

// Get user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password: _, privateKey: __, ...userWithoutSensitive } = req.user;
  res.json({ user: userWithoutSensitive });
});

// Get blockchain network info
app.get('/api/blockchain/network', async (req, res) => {
  try {
    if (!provider) {
      await initializeBlockchain();
    }

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();

    res.json({
      network: network.name,
      chainId: network.chainId,
      blockNumber,
      gasPrice: gasPrice.gasPrice?.toString(),
      contractAddress: process.env.CONTRACT_ADDRESS,
      walletAddress: wallet?.address
    });
  } catch (error) {
    console.error('Network info error:', error);
    res.status(500).json({ error: 'Failed to get network info' });
  }
});

// Issue credit (only certifier)
app.post('/api/credits/issue', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'certifier') {
      return res.status(403).json({ error: 'Only certifiers can issue credits' });
    }

    if (!contract) {
      await initializeBlockchain();
    }

    const { producer, renewableSourceType, hydrogenAmount, metadataHash, amount } = req.body;
    
    // Find producer user
    const producerUser = demoUsers.find(u => u.email === producer);
    if (!producerUser) {
      return res.status(404).json({ error: 'Producer not found' });
    }

    console.log('🔧 Issuing credit on blockchain...');
    console.log('Producer:', producerUser.walletAddress);
    console.log('Source:', renewableSourceType);
    console.log('Amount:', amount);

    // Issue credit on blockchain
    const tx = await contract.issueCredit(
      producerUser.walletAddress,
      renewableSourceType,
      hydrogenAmount,
      metadataHash || 'QmDemoHash',
      amount
    );

    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();

    // Get credit ID from event
    const creditIssuedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CreditIssued';
      } catch {
        return false;
      }
    });

    let creditId = '0';
    if (creditIssuedEvent) {
      const parsedEvent = contract.interface.parseLog(creditIssuedEvent);
      creditId = parsedEvent.args[0].toString();
    }

    console.log('✅ Credit issued successfully!');
    console.log('Transaction hash:', tx.hash);
    console.log('Credit ID:', creditId);

    res.json({
      message: 'Credit issued successfully',
      creditId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      credit: {
        creditId,
        producer: producerUser.walletAddress,
        renewableSourceType,
        hydrogenAmount,
        amount,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Issue credit error:', error);
    res.status(500).json({ 
      error: 'Failed to issue credit',
      details: error.message 
    });
  }
});

// Transfer credit
app.post('/api/credits/transfer', authenticateToken, async (req, res) => {
  try {
    const { creditId, to, amount } = req.body;
    
    // Find recipient user
    const recipientUser = demoUsers.find(u => u.email === to);
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (!contract) {
      await initializeBlockchain();
    }

    console.log('🔄 Transferring credit on blockchain...');
    console.log('From:', req.user.walletAddress);
    console.log('To:', recipientUser.walletAddress);
    console.log('Credit ID:', creditId);
    console.log('Amount:', amount);

    // Create wallet for sender
    const senderWallet = new ethers.Wallet(req.user.privateKey, provider);
    const senderContract = contract.connect(senderWallet);

    // Transfer credit on blockchain
    const tx = await senderContract.transferCredit(
      recipientUser.walletAddress,
      creditId,
      amount
    );

    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Credit transferred successfully!');
    console.log('Transaction hash:', tx.hash);

    res.json({
      message: 'Credit transferred successfully',
      creditId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      transfer: {
        from: req.user.walletAddress,
        to: recipientUser.walletAddress,
        amount,
        creditId
      }
    });

  } catch (error) {
    console.error('Transfer credit error:', error);
    res.status(500).json({ 
      error: 'Failed to transfer credit',
      details: error.message 
    });
  }
});

// Retire credit (only consumer)
app.post('/api/credits/retire', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'consumer') {
      return res.status(403).json({ error: 'Only consumers can retire credits' });
    }

    const { creditId, amount } = req.body;
    
    if (!contract) {
      await initializeBlockchain();
    }

    console.log('♻️ Retiring credit on blockchain...');
    console.log('Consumer:', req.user.walletAddress);
    console.log('Credit ID:', creditId);
    console.log('Amount:', amount);

    // Create wallet for consumer
    const consumerWallet = new ethers.Wallet(req.user.privateKey, provider);
    const consumerContract = contract.connect(consumerWallet);

    // Retire credit on blockchain
    const tx = await consumerContract.retireCredit(creditId, amount);

    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Credit retired successfully!');
    console.log('Transaction hash:', tx.hash);

    res.json({
      message: 'Credit retired successfully',
      creditId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      retirement: {
        creditId,
        amount,
        retiredBy: req.user.walletAddress
      }
    });

  } catch (error) {
    console.error('Retire credit error:', error);
    res.status(500).json({ 
      error: 'Failed to retire credit',
      details: error.message 
    });
  }
});

// Get credit metadata from blockchain
app.get('/api/blockchain/credit/:creditId', async (req, res) => {
  try {
    const { creditId } = req.params;
    
    if (!contract) {
      await initializeBlockchain();
    }

    const metadata = await contract.getCreditMetadata(creditId);
    
    res.json({
      creditId,
      metadata: {
        creditId: metadata.creditId.toString(),
        producer: metadata.producer,
        renewableSourceType: metadata.renewableSourceType,
        productionDate: new Date(metadata.productionDate * 1000),
        hydrogenAmount: metadata.hydrogenAmount.toString(),
        metadataHash: metadata.metadataHash,
        isRetired: metadata.isRetired,
        retirementDate: metadata.retirementDate ? new Date(metadata.retirementDate * 1000) : null,
        retiredBy: metadata.retiredBy
      }
    });

  } catch (error) {
    console.error('Get credit metadata error:', error);
    res.status(500).json({ 
      error: 'Failed to get credit metadata',
      details: error.message 
    });
  }
});

// Get total credits issued
app.get('/api/blockchain/total-credits', async (req, res) => {
  try {
    if (!contract) {
      await initializeBlockchain();
    }

    const total = await contract.getTotalCreditsIssued();
    
    res.json({
      totalCredits: total.toString()
    });

  } catch (error) {
    console.error('Get total credits error:', error);
    res.status(500).json({ 
      error: 'Failed to get total credits',
      details: error.message 
    });
  }
});

// Get transaction status
app.get('/api/blockchain/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    if (!provider) {
      await initializeBlockchain();
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.json({
        status: 'pending',
        message: 'Transaction is pending'
      });
    }

    res.json({
      status: receipt.status === 1 ? 'success' : 'failed',
      message: receipt.status === 1 ? 'Transaction successful' : 'Transaction failed',
      receipt: {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status
      }
    });

  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({ 
      error: 'Failed to get transaction status',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Initialize blockchain and start server
const startServer = async () => {
  try {
    await initializeBlockchain();
    
    app.listen(PORT, () => {
      console.log(`🚀 Blockchain Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Contract: ${process.env.CONTRACT_ADDRESS}`);
      console.log(`🔑 Wallet: ${wallet?.address}`);
      console.log(`👥 Demo users available for login`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

