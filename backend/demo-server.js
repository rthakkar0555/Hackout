const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

// Demo data
const demoUsers = [
  {
    id: 1,
    email: 'producer@demo.com',
    password: 'password123',
    role: 'producer',
    name: 'Demo Producer',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  },
  {
    id: 2,
    email: 'certifier@demo.com',
    password: 'password123',
    role: 'certifier',
    name: 'Demo Certifier',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  },
  {
    id: 3,
    email: 'consumer@demo.com',
    password: 'password123',
    role: 'consumer',
    name: 'Demo Consumer',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  },
  {
    id: 4,
    email: 'regulator@demo.com',
    password: 'password123',
    role: 'regulator',
    name: 'Demo Regulator',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  }
];

const demoCredits = [
  {
    id: 1,
    creditId: 'HC001',
    producer: 'producer@demo.com',
    renewableSourceType: 'Solar',
    productionDate: '2024-01-15',
    hydrogenAmount: 1000,
    metadataHash: 'QmDemoHash1',
    isRetired: false,
    amount: 100
  },
  {
    id: 2,
    creditId: 'HC002',
    producer: 'producer@demo.com',
    renewableSourceType: 'Wind',
    productionDate: '2024-01-20',
    hydrogenAmount: 1500,
    metadataHash: 'QmDemoHash2',
    isRetired: false,
    amount: 150
  }
];

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    token: user.email // Simple token for demo
  });
});

// Get user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Get credits
app.get('/api/credits', authenticateToken, (req, res) => {
  res.json({
    credits: demoCredits,
    total: demoCredits.length
  });
});

// Issue credit (only certifier)
app.post('/api/credits/issue', authenticateToken, (req, res) => {
  if (req.user.role !== 'certifier') {
    return res.status(403).json({ error: 'Only certifiers can issue credits' });
  }

  const { producer, renewableSourceType, hydrogenAmount, metadataHash, amount } = req.body;
  
  const newCredit = {
    id: demoCredits.length + 1,
    creditId: `HC${String(demoCredits.length + 1).padStart(3, '0')}`,
    producer,
    renewableSourceType,
    productionDate: new Date().toISOString().split('T')[0],
    hydrogenAmount,
    metadataHash,
    isRetired: false,
    amount
  };

  demoCredits.push(newCredit);

  res.json({
    message: 'Credit issued successfully',
    credit: newCredit
  });
});

// Transfer credit
app.post('/api/credits/transfer', authenticateToken, (req, res) => {
  const { creditId, to, amount } = req.body;
  
  const credit = demoCredits.find(c => c.creditId === creditId);
  if (!credit) {
    return res.status(404).json({ error: 'Credit not found' });
  }

  if (credit.isRetired) {
    return res.status(400).json({ error: 'Credit is already retired' });
  }

  res.json({
    message: 'Credit transferred successfully',
    creditId,
    from: req.user.email,
    to,
    amount
  });
});

// Retire credit (only consumer)
app.post('/api/credits/retire', authenticateToken, (req, res) => {
  if (req.user.role !== 'consumer') {
    return res.status(403).json({ error: 'Only consumers can retire credits' });
  }

  const { creditId, amount } = req.body;
  
  const credit = demoCredits.find(c => c.creditId === creditId);
  if (!credit) {
    return res.status(404).json({ error: 'Credit not found' });
  }

  if (credit.isRetired) {
    return res.status(400).json({ error: 'Credit is already retired' });
  }

  credit.isRetired = true;
  credit.retirementDate = new Date().toISOString();
  credit.retiredBy = req.user.email;

  res.json({
    message: 'Credit retired successfully',
    credit
  });
});

// Blockchain info
app.get('/api/blockchain/network', (req, res) => {
  res.json({
    network: 'Demo Network',
    chainId: 1337,
    blockNumber: 12345,
    gasPrice: '20000000000'
  });
});

// Statistics
app.get('/api/credits/statistics', (req, res) => {
  const totalCredits = demoCredits.length;
  const retiredCredits = demoCredits.filter(c => c.isRetired).length;
  const activeCredits = totalCredits - retiredCredits;

  res.json({
    totalCredits,
    retiredCredits,
    activeCredits,
    totalHydrogen: demoCredits.reduce((sum, c) => sum + c.hydrogenAmount, 0)
  });
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

app.listen(PORT, () => {
  console.log(`🚀 Demo Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Demo users available for login`);
});
