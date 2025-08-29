# 🌱 Green Hydrogen Credit System

A blockchain-based green hydrogen credit management system that tracks and manages carbon credits using ERC-1155 tokens.

## 🚀 Features

### Blockchain / DLT Setup
- **Ethereum-compatible** blockchain (Hardhat/Foundry)
- **Solidity Smart Contracts** (ERC-1155 tokens)
- **HydrogenCredit Contract** - for issuing, transferring, and retiring credits
- **Role-based Access Control** (Producer, Certifier, Consumer, Regulator)
- **Double-counting prevention** and events for all operations

### Backend API
- **Node.js + Express** RESTful API
- **MongoDB** database (for off-chain metadata)
- **JWT-based authentication**
- **Role-based authorization**
- **Blockchain integration** (via ethers.js)

### Frontend Dashboard
- **React + Tailwind CSS** modern UI
- **Role-specific portals** (Producer, Consumer, Auditor)
- **Real-time blockchain transaction history**
- **Responsive design**

### Security and Identity
- **JWT-based login** for API users
- **Wallet addresses** linked to roles
- **Sensitive metadata encryption** for off-chain storage

## 📁 Project Structure

```
green-hydrogen-credit-system/
├── blockchain/                 # Smart contracts
│   ├── contracts/
│   │   └── HydrogenCredit.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── HydrogenCredit.test.js
│   ├── hardhat.config.js
│   └── package.json
├── backend/                    # Node.js API
│   ├── models/
│   │   ├── User.js
│   │   └── Credit.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── credits.js
│   │   ├── blockchain.js
│   │   └── audit.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── utils/
│   │   └── blockchain.js
│   ├── server.js
│   └── package.json
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Navbar.js
│   │   │       └── Sidebar.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   └── Dashboard.js
│   │   ├── App.js
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
├── package.json               # Root package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Project

```bash
git clone <repository-url>
cd green-hydrogen-credit-system
```

### 2. Install All Dependencies

```bash
npm run install-all
```

### 3. Setup Environment Variables

#### Backend (Create .env file)

```bash
cd backend
cp .env.example .env
```

Set the following variables in the `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/hydrogen-credits

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Blockchain Configuration
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
CONTRACT_ADDRESS=your-deployed-contract-address

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend (Create .env file)

```bash
cd frontend
cp .env.example .env
```

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BLOCKCHAIN_NETWORK=localhost
```

### 4. Blockchain Setup

```bash
cd blockchain

# Compile contracts
npm run compile

# Start local blockchain node (in new terminal)
npm run node

# Deploy contract (in another terminal)
npm run deploy
```

After deployment, copy the contract address and set it in the backend `.env` file as `CONTRACT_ADDRESS`.

### 5. Start Backend Server

```bash
cd backend
npm run dev
```

### 6. Start Frontend Application

```bash
cd frontend
npm start
```

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain
npm run test
```

### Backend API Tests

```bash
cd backend
npm run test
```

## 👥 Demo Accounts

Pre-configured demo accounts in the system:

| Role | Email | Password | Wallet Address |
|------|-------|----------|----------------|
| Producer | producer@demo.com | password123 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 |
| Certifier | certifier@demo.com | password123 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC |
| Consumer | consumer@demo.com | password123 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 |
| Regulator | regulator@demo.com | password123 | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 |

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user profile
- `PUT /api/auth/profile` - Update profile

### Credits
- `POST /api/credits/issue` - Issue new credits (Certifier)
- `POST /api/credits/transfer` - Transfer credits
- `POST /api/credits/retire` - Retire credits (Consumer)
- `GET /api/credits/:id` - Get credit details
- `GET /api/credits/my-credits` - User's credits
- `GET /api/credits/statistics` - Credit statistics

### Blockchain
- `GET /api/blockchain/network` - Network information
- `GET /api/blockchain/transaction/:txHash` - Transaction status
- `GET /api/blockchain/credit/:creditId` - Credit metadata
- `POST /api/blockchain/verify` - Credit verification

### Audit
- `GET /api/audit/credits` - Credit audit trail
- `GET /api/audit/credits/:id` - Detailed credit audit
- `POST /api/audit/verify/:id` - Verify credit
- `GET /api/audit/statistics` - Audit statistics

## 🔐 Security Features

- **JWT Token Authentication**
- **Role-based Access Control**
- **Password Hashing** (bcryptjs)
- **Input Validation** (Joi)
- **Rate Limiting**
- **CORS Protection**
- **Helmet Security Headers**
- **Metadata Encryption** (for off-chain data)

## 🌐 Deployment

### Production Setup

1. Setup **MongoDB Atlas** or **AWS DocumentDB**
2. Deploy contract on **Ethereum Mainnet** or **Polygon**
3. Deploy backend and frontend on **Heroku**, **Vercel**, or **AWS**
4. Set **environment variables** with production values

### Docker Setup

```bash
# Start all services with Docker Compose
docker-compose up -d
```

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Ethereum)    │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - REST API      │    │ - Smart         │
│ - User Portal   │    │ - Authentication│    │   Contracts     │
│ - Role-based    │    │ - Business      │    │ - ERC-1155      │
│   Access        │    │   Logic         │    │   Tokens        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (MongoDB)     │
                       │                 │
                       │ - User Profiles │
                       │ - Credit        │
                       │   Metadata      │
                       │ - Audit Trail   │
                       └─────────────────┘
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Report bugs in the **Issues** section
2. Ask questions in **Discussions**
3. Check the **Documentation**

## 🔮 Future Plans

- [ ] **IPFS Integration** - for metadata storage
- [ ] **Mobile App** - React Native
- [ ] **Advanced Analytics** - dashboards and reports
- [ ] **Multi-chain Support** - Polygon, BSC, etc.
- [ ] **AI-powered Verification** - automatic credit verification
- [ ] **Carbon Footprint Calculator** - integrated calculator

---

**Note**: This is a demo project and will require additional security and testing before production use.
