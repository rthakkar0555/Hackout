@echo off
echo Starting Hydrogen Credit System...
echo.

echo Starting MongoDB...
start cmd /k "mongod --dbpath C:\data\db"

echo Waiting for MongoDB to start...
timeout 5

echo Starting Blockchain Node...
start cmd /k "cd blockchain && npx hardhat node"

echo Waiting for Blockchain to start...
timeout 10

echo Deploying Smart Contracts...
cd blockchain
call npm run deploy
cd ..

echo Starting Backend Server...
start cmd /k "cd backend && set MONGODB_URI=mongodb://localhost:27017/hydrogen-credits && set JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production && set BLOCKCHAIN_RPC_URL=http://localhost:8545 && set CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 && npm start"

echo Waiting for Backend to start...
timeout 5

echo Starting Frontend...
start cmd /k "cd frontend && set REACT_APP_API_URL=http://localhost:5000 && set REACT_APP_BLOCKCHAIN_NETWORK=localhost && set REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 && npm start"

echo.
echo All services are starting...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo Blockchain: http://localhost:8545
echo.
echo Please wait a few minutes for all services to fully start.
pause
