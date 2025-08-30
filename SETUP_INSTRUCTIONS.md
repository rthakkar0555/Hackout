# Hydrogen Credit System - Setup Instructions

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **MongoDB** (installed globally via npm)

## Quick Start

### Option 1: Using Batch File (Recommended)
1. Double-click `start-project.bat` file
2. Wait for all services to start (about 2-3 minutes)
3. Open your browser and go to: http://localhost:3000

### Option 2: Manual Setup

#### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install
```

#### Step 2: Start MongoDB
```bash
# Create data directory (if not exists)
mkdir C:\data\db

# Start MongoDB
mongod --dbpath C:\data\db
```

#### Step 3: Start Blockchain Node
```bash
cd blockchain
npx hardhat node
```

#### Step 4: Deploy Smart Contracts
```bash
# In a new terminal
cd blockchain
npm run deploy
```

#### Step 5: Start Backend Server
```bash
# In a new terminal
cd backend
set MONGODB_URI=mongodb://localhost:27017/hydrogen-credits
set JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
set BLOCKCHAIN_RPC_URL=http://localhost:8545
set CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
npm start
```

#### Step 6: Start Frontend
```bash
# In a new terminal
cd frontend
set REACT_APP_API_URL=http://localhost:5000
set REACT_APP_BLOCKCHAIN_NETWORK=localhost
set REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
npm start
```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Blockchain Node**: http://localhost:8545
- **MongoDB**: mongodb://localhost:27017

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hydrogen-credits
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BLOCKCHAIN_NETWORK=localhost
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Troubleshooting

### MongoDB Issues
- Make sure MongoDB is installed: `npm install -g mongodb`
- Create data directory: `mkdir C:\data\db`
- Check if port 27017 is available

### Blockchain Issues
- Make sure Hardhat is installed: `npm install -g hardhat`
- Check if port 8545 is available
- Verify contracts are compiled: `npm run compile`

### Backend Issues
- Check MongoDB connection
- Verify environment variables are set
- Check if port 5000 is available

### Frontend Issues
- Check if backend is running
- Verify environment variables are set
- Check if port 3000 is available

## Features

- **User Authentication**: Register/Login with JWT
- **Credit Management**: Create, transfer, and track hydrogen credits
- **Blockchain Integration**: Smart contracts for credit verification
- **Audit Trail**: Complete transaction history
- **Dashboard**: Real-time credit monitoring

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/credits` - Get user credits
- `POST /api/credits` - Create new credits
- `POST /api/credits/transfer` - Transfer credits
- `GET /api/audit` - Get audit trail
- `GET /api/health` - Health check
