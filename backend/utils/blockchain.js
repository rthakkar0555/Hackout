const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

let provider = null;
let contract = null;
let contractAddress = null;

/**
 * Initialize blockchain connection
 */
const initializeBlockchain = () => {
  try {
    // Get network configuration
    const network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

    // Create provider
    if (network === 'localhost' || network === 'hardhat') {
      provider = new ethers.JsonRpcProvider(rpcUrl);
    } else {
      provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Create wallet if private key is provided
    let wallet = null;
    if (privateKey) {
      wallet = new ethers.Wallet(privateKey, provider);
    }

    console.log(`✅ Connected to blockchain network: ${network}`);
    return { provider, wallet };
  } catch (error) {
    console.error('❌ Failed to initialize blockchain:', error);
    throw error;
  }
};

/**
 * Get or create blockchain contract instance
 */
const getBlockchainContract = async () => {
  try {
    if (contract) {
      return contract;
    }

    // Initialize if not already done
    if (!provider) {
      initializeBlockchain();
    }

    // Get contract address
    contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Contract address not found in environment variables');
    }

    // Load contract ABI
    const abiPath = path.join(__dirname, '../../blockchain/artifacts/contracts/HydrogenCredit.sol/HydrogenCredit.json');
    const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const abi = contractArtifact.abi;

    // Create contract instance
    contract = new ethers.Contract(contractAddress, abi, provider);

    console.log(`✅ Contract instance created at: ${contractAddress}`);
    return contract;
  } catch (error) {
    console.error('❌ Failed to get blockchain contract:', error);
    throw error;
  }
};

/**
 * Get contract with signer for transactions
 */
const getContractWithSigner = async () => {
  try {
    const { wallet } = initializeBlockchain();
    if (!wallet) {
      throw new Error('Private key not provided for signing transactions');
    }

    const contractInstance = await getBlockchainContract();
    return contractInstance.connect(wallet);
  } catch (error) {
    console.error('❌ Failed to get contract with signer:', error);
    throw error;
  }
};

/**
 * Get blockchain network info
 */
const getNetworkInfo = async () => {
  try {
    if (!provider) {
      initializeBlockchain();
    }

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();

    return {
      chainId: network.chainId,
      name: network.name,
      blockNumber,
      gasPrice: gasPrice.gasPrice?.toString()
    };
  } catch (error) {
    console.error('❌ Failed to get network info:', error);
    throw error;
  }
};

/**
 * Get transaction receipt
 */
const getTransactionReceipt = async (txHash) => {
  try {
    if (!provider) {
      initializeBlockchain();
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (error) {
    console.error('❌ Failed to get transaction receipt:', error);
    throw error;
  }
};

/**
 * Get transaction status
 */
const getTransactionStatus = async (txHash) => {
  try {
    const receipt = await getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { status: 'pending', message: 'Transaction is pending' };
    }

    if (receipt.status === 1) {
      return { status: 'success', message: 'Transaction successful', receipt };
    } else {
      return { status: 'failed', message: 'Transaction failed', receipt };
    }
  } catch (error) {
    console.error('❌ Failed to get transaction status:', error);
    throw error;
  }
};

/**
 * Get credit metadata from blockchain
 */
const getCreditMetadata = async (creditId) => {
  try {
    const contractInstance = await getBlockchainContract();
    const metadata = await contractInstance.getCreditMetadata(creditId);
    
    return {
      creditId: metadata.creditId.toString(),
      producer: metadata.producer,
      renewableSourceType: metadata.renewableSourceType,
      productionDate: new Date(metadata.productionDate * 1000),
      hydrogenAmount: metadata.hydrogenAmount.toString(),
      metadataHash: metadata.metadataHash,
      isRetired: metadata.isRetired,
      retirementDate: metadata.retirementDate ? new Date(metadata.retirementDate * 1000) : null,
      retiredBy: metadata.retiredBy
    };
  } catch (error) {
    console.error('❌ Failed to get credit metadata:', error);
    throw error;
  }
};

/**
 * Verify credit authenticity
 */
const verifyCredit = async (creditId, metadataHash) => {
  try {
    const contractInstance = await getBlockchainContract();
    const isValid = await contractInstance.verifyCredit(creditId, metadataHash);
    return isValid;
  } catch (error) {
    console.error('❌ Failed to verify credit:', error);
    throw error;
  }
};

/**
 * Get user's credit balance
 */
const getCreditBalance = async (userAddress, creditId) => {
  try {
    const contractInstance = await getBlockchainContract();
    const balance = await contractInstance.balanceOf(userAddress, creditId);
    return balance.toString();
  } catch (error) {
    console.error('❌ Failed to get credit balance:', error);
    throw error;
  }
};

/**
 * Get total credits issued
 */
const getTotalCreditsIssued = async () => {
  try {
    const contractInstance = await getBlockchainContract();
    const total = await contractInstance.getTotalCreditsIssued();
    return total.toString();
  } catch (error) {
    console.error('❌ Failed to get total credits issued:', error);
    throw error;
  }
};

/**
 * Get user's credits (producer or consumer)
 */
const getUserCredits = async (userAddress, userType = 'producer') => {
  try {
    const contractInstance = await getBlockchainContract();
    
    if (userType === 'producer') {
      const credits = await contractInstance.getProducerCredits(userAddress);
      return credits.map(creditId => creditId.toString());
    } else if (userType === 'consumer') {
      const credits = await contractInstance.getConsumerCredits(userAddress);
      return credits.map(creditId => creditId.toString());
    } else {
      throw new Error('Invalid user type. Must be "producer" or "consumer"');
    }
  } catch (error) {
    console.error('❌ Failed to get user credits:', error);
    throw error;
  }
};

/**
 * Check if user has specific role
 */
const hasRole = async (userAddress, role) => {
  try {
    const contractInstance = await getBlockchainContract();
    
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const hasUserRole = await contractInstance.hasRole(roleHash, userAddress);
    
    return hasUserRole;
  } catch (error) {
    console.error('❌ Failed to check user role:', error);
    throw error;
  }
};

/**
 * Get contract events
 */
const getContractEvents = async (eventName, fromBlock = 0, toBlock = 'latest') => {
  try {
    const contractInstance = await getBlockchainContract();
    const events = await contractInstance.queryFilter(eventName, fromBlock, toBlock);
    
    return events.map(event => ({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      args: event.args,
      timestamp: event.blockTimestamp
    }));
  } catch (error) {
    console.error('❌ Failed to get contract events:', error);
    throw error;
  }
};

module.exports = {
  initializeBlockchain,
  getBlockchainContract,
  getContractWithSigner,
  getNetworkInfo,
  getTransactionReceipt,
  getTransactionStatus,
  getCreditMetadata,
  verifyCredit,
  getCreditBalance,
  getTotalCreditsIssued,
  getUserCredits,
  hasRole,
  getContractEvents
};
