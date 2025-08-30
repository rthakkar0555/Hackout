const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  getNetworkInfo, 
  getTransactionStatus, 
  getTransactionReceipt,
  getCreditMetadata,
  verifyCredit,
  getCreditBalance,
  getTotalCreditsIssued,
  getUserCredits,
  hasRole,
  getContractEvents
} = require('../utils/blockchain');

const router = express.Router();

/**
 * @route   GET /api/blockchain/network
 * @desc    Get blockchain network information
 * @access  Private
 */
router.get('/network', auth, async (req, res) => {
  try {
    const networkInfo = await getNetworkInfo();
    res.json({
      network: networkInfo
    });
  } catch (error) {
    console.error('Get network info error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get network information',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/transaction/:txHash
 * @desc    Get transaction status and details
 * @access  Private
 */
router.get('/transaction/:txHash', auth, async (req, res) => {
  try {
    const { txHash } = req.params;
    const status = await getTransactionStatus(txHash);
    res.json({
      transaction: {
        hash: txHash,
        ...status
      }
    });
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get transaction status',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/credit/:creditId
 * @desc    Get credit metadata from blockchain
 * @access  Private
 */
router.get('/credit/:creditId', auth, async (req, res) => {
  try {
    const { creditId } = req.params;
    const metadata = await getCreditMetadata(creditId);
    res.json({
      credit: metadata
    });
  } catch (error) {
    console.error('Get credit metadata error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get credit metadata',
        details: error.message
      }
    });
  }
});

/**
 * @route   POST /api/blockchain/verify
 * @desc    Verify credit authenticity
 * @access  Private
 */
router.post('/verify', auth, async (req, res) => {
  try {
    const { creditId, metadataHash } = req.body;
    
    if (!creditId || !metadataHash) {
      return res.status(400).json({
        error: {
          message: 'Credit ID and metadata hash are required'
        }
      });
    }

    const isValid = await verifyCredit(creditId, metadataHash);
    res.json({
      verified: isValid,
      creditId,
      metadataHash
    });
  } catch (error) {
    console.error('Verify credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to verify credit',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/balance/:userAddress/:creditId
 * @desc    Get user's credit balance
 * @access  Private
 */
router.get('/balance/:userAddress/:creditId', auth, async (req, res) => {
  try {
    const { userAddress, creditId } = req.params;
    const balance = await getCreditBalance(userAddress, creditId);
    res.json({
      balance: balance,
      userAddress,
      creditId
    });
  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get credit balance',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/total-credits
 * @desc    Get total credits issued
 * @access  Private
 */
router.get('/total-credits', auth, async (req, res) => {
  try {
    const total = await getTotalCreditsIssued();
    res.json({
      totalCredits: total
    });
  } catch (error) {
    console.error('Get total credits error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get total credits',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/user-credits/:userAddress
 * @desc    Get user's credits (producer or consumer)
 * @access  Private
 */
router.get('/user-credits/:userAddress', auth, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { type = 'producer' } = req.query;
    
    if (!['producer', 'consumer'].includes(type)) {
      return res.status(400).json({
        error: {
          message: 'Type must be either "producer" or "consumer"'
        }
      });
    }

    const credits = await getUserCredits(userAddress, type);
    res.json({
      credits,
      userAddress,
      type
    });
  } catch (error) {
    console.error('Get user credits error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get user credits',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/role/:userAddress/:role
 * @desc    Check if user has specific role
 * @access  Private
 */
router.get('/role/:userAddress/:role', auth, async (req, res) => {
  try {
    const { userAddress, role } = req.params;
    const hasUserRole = await hasRole(userAddress, role);
    res.json({
      hasRole: hasUserRole,
      userAddress,
      role
    });
  } catch (error) {
    console.error('Check user role error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to check user role',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/blockchain/events
 * @desc    Get contract events
 * @access  Private
 */
router.get('/events', auth, async (req, res) => {
  try {
    const { eventName, fromBlock, toBlock } = req.query;
    
    if (!eventName) {
      return res.status(400).json({
        error: {
          message: 'Event name is required'
        }
      });
    }

    const events = await getContractEvents(eventName, fromBlock, toBlock);
    res.json({
      events,
      eventName,
      fromBlock,
      toBlock
    });
  } catch (error) {
    console.error('Get contract events error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get contract events',
        details: error.message
      }
    });
  }
});

module.exports = router;
