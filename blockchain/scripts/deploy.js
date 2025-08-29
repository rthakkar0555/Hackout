const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying HydrogenCredit contract...");

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
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  console.log("📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
