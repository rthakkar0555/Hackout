const { spawn } = require('child_process');
const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Starting blockchain system...');
    
    // Start Hardhat node
    console.log('📡 Starting Hardhat node...');
    const hardhatNode = spawn('npx', ['hardhat', 'node', '--hostname', '0.0.0.0'], {
        stdio: 'pipe',
        shell: true
    });

    // Wait for node to start
    console.log('⏳ Waiting for blockchain node to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        console.log('🔧 Deploying smart contracts...');
        
        // Get the contract factory
        const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
        
        // Deploy the contract
        const hydrogenCredit = await HydrogenCredit.deploy();
        
        // Wait for deployment to finish
        await hydrogenCredit.waitForDeployment();
        
        const address = await hydrogenCredit.getAddress();
        console.log("✅ HydrogenCredit deployed to:", address);

        // Get signers for role assignment
        const [deployer] = await ethers.getSigners();
        
        // Grant roles to deployer for testing
        console.log("🔐 Setting up initial roles...");
        
        const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
        const CERTIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CERTIFIER_ROLE"));
        const CONSUMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CONSUMER_ROLE"));
        const REGULATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGULATOR_ROLE"));

        // Grant roles to deployer
        await hydrogenCredit.grantRole(PRODUCER_ROLE, deployer.address);
        await hydrogenCredit.grantRole(CERTIFIER_ROLE, deployer.address);
        await hydrogenCredit.grantRole(CONSUMER_ROLE, deployer.address);
        
        console.log("✅ Roles granted to deployer:", deployer.address);
        console.log("📋 Contract Address:", address);
        console.log("🔑 Deployer Address:", deployer.address);
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress: address,
            deployerAddress: deployer.address,
            network: 'localhost',
            timestamp: new Date().toISOString()
        };
        
        console.log("📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
        
        // Update backend .env file with contract address
        const fs = require('fs');
        const path = require('path');
        
        const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
        let envContent = '';
        
        if (fs.existsSync(backendEnvPath)) {
            envContent = fs.readFileSync(backendEnvPath, 'utf8');
        }
        
        // Update or add CONTRACT_ADDRESS
        const contractAddressLine = `CONTRACT_ADDRESS=${address}`;
        if (envContent.includes('CONTRACT_ADDRESS=')) {
            envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, contractAddressLine);
        } else {
            envContent += `\n${contractAddressLine}`;
        }
        
        fs.writeFileSync(backendEnvPath, envContent);
        console.log('✅ Updated backend .env file with contract address');
        
        console.log('\n🎉 Blockchain system is ready!');
        console.log('📊 Contract deployed at:', address);
        console.log('🔗 Node running on: http://localhost:8545');
        console.log('💡 You can now start the backend and frontend');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down blockchain node...');
            hardhatNode.kill();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        hardhatNode.kill();
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});
