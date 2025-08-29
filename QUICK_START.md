# 🚀 Quick Start Guide

This guide will help you set up the **Green Hydrogen Credit System** in 5 minutes.

## 📋 Prerequisites

- **Docker** and **Docker Compose** must be installed
- **Node.js** (v16 or higher) - optional (for setup without Docker)

## 🐳 Quick Setup with Docker (Recommended)

### 1. Clone the Project
```bash
git clone <repository-url>
cd green-hydrogen-credit-system
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Deploy Contracts
```bash
docker-compose logs deployer
```

### 4. Load Seed Data
```bash
docker-compose exec backend npm run seed
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Blockchain Node**: http://localhost:8545

## 💻 Manual Setup (Without Docker)

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Setup MongoDB
```bash
# Install and start MongoDB
mongod --dbpath ./data
```

### 3. Setup Blockchain
```bash
cd blockchain
npm run compile
npm run node  # in new terminal
npm run deploy  # in another terminal
```

### 4. Setup Backend
```bash
cd backend
cp .env.example .env
# Set CONTRACT_ADDRESS in .env file
npm run dev
```

### 5. Setup Frontend
```bash
cd frontend
cp .env.example .env
npm start
```

### 6. Load Seed Data
```bash
cd backend
npm run seed
```

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Producer | producer@demo.com | password123 |
| Certifier | certifier@demo.com | password123 |
| Consumer | consumer@demo.com | password123 |
| Regulator | regulator@demo.com | password123 |

## 🧪 Test the System

### 1. Login
- Go to http://localhost:3000
- Login with any demo account

### 2. Issue Credit (Certifier)
- Login with Certifier account
- Click "Issue Credit"
- Fill the form and submit

### 3. Transfer Credit
- Login with Producer account
- Click "Transfer Credit"
- Transfer credit to Consumer

### 4. Retire Credit (Consumer)
- Login with Consumer account
- Click "Retire Credit"
- Retire the credit

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check ports
lsof -i :3000
lsof -i :5000
lsof -i :8545

# Kill process
kill -9 <PID>
```

#### 2. MongoDB Connection Error
```bash
# Check MongoDB service
docker-compose ps mongodb
docker-compose logs mongodb
```

#### 3. Blockchain Node Error
```bash
# Check blockchain logs
docker-compose logs blockchain
```

#### 4. Contract Deployment Failed
```bash
# Redeploy contracts
cd blockchain
npm run deploy
```

### View Logs

```bash
# All services logs
docker-compose logs

# Specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs blockchain
```

### Reset System

```bash
# Remove all containers and data
docker-compose down -v
docker system prune -f

# Start again
docker-compose up -d
```

## 📞 Support

If you encounter any issues:

1. Report bugs in the **Issues** section
2. Check the **Documentation**
3. Check the **Logs**

## 🎯 Next Steps

After setting up the system:

1. Read the **API Documentation**
2. Understand the **Smart Contracts**
3. Explore the **Frontend Components**
4. Run the **Test Cases**

---

**Note**: This is a demo system. Optimize security and performance before production use.
