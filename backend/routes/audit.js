const express = require('express');
const auth = require('../middleware/auth');
const Credit = require('../models/Credit');
const User = require('../models/User');
const { getContractEvents } = require('../utils/blockchain');

const router = express.Router();

/**
 * @route   GET /api/audit/credits
 * @desc    Get audit trail for all credits
 * @access  Private (Regulator/Certifier)
 */
router.get('/credits', auth, async (req, res) => {
  try {
    // Check if user has audit permissions
    if (!['REGULATOR', 'CERTIFIER'].includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Access denied. Audit privileges required.'
        }
      });
    }

    const { page = 1, limit = 20, status, renewableSourceType, producer, certifier } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (renewableSourceType) query.renewableSourceType = renewableSourceType;
    if (producer) query.producer = producer;
    if (certifier) query.certifier = certifier;

    const credits = await Credit.find(query)
      .populate('producer', 'username organization')
      .populate('certifier', 'username organization')
      .populate('currentOwner', 'username organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Credit.countDocuments(query);

    res.json({
      credits: credits.map(credit => ({
        id: credit._id,
        creditId: credit.creditId,
        blockchainTxHash: credit.blockchainTxHash,
        producer: credit.producer,
        certifier: credit.certifier,
        renewableSourceType: credit.renewableSourceType,
        hydrogenAmount: credit.hydrogenAmount,
        creditAmount: credit.creditAmount,
        currentOwner: credit.currentOwner,
        currentBalance: credit.currentBalance,
        status: credit.status,
        isRetired: credit.isRetired,
        ownershipHistory: credit.ownershipHistory,
        verificationStatus: credit.verificationStatus,
        createdAt: credit.createdAt,
        updatedAt: credit.updatedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCredits: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get audit trail'
      }
    });
  }
});

/**
 * @route   GET /api/audit/credits/:id
 * @desc    Get detailed audit trail for specific credit
 * @access  Private (Regulator/Certifier)
 */
router.get('/credits/:id', auth, async (req, res) => {
  try {
    // Check if user has audit permissions
    if (!['REGULATOR', 'CERTIFIER'].includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Access denied. Audit privileges required.'
        }
      });
    }

    const { id } = req.params;

    const credit = await Credit.findById(id)
      .populate('producer', 'username organization profile')
      .populate('certifier', 'username organization')
      .populate('currentOwner', 'username organization')
      .populate('ownershipHistory.owner', 'username organization')
      .populate('verificationStatus.verifiedBy', 'username organization');

    if (!credit) {
      return res.status(404).json({
        error: {
          message: 'Credit not found'
        }
      });
    }

    res.json({
      credit: {
        id: credit._id,
        creditId: credit.creditId,
        blockchainTxHash: credit.blockchainTxHash,
        producer: credit.producer,
        certifier: credit.certifier,
        renewableSourceType: credit.renewableSourceType,
        hydrogenAmount: credit.hydrogenAmount,
        creditAmount: credit.creditAmount,
        currentOwner: credit.currentOwner,
        currentBalance: credit.currentBalance,
        status: credit.status,
        isRetired: credit.isRetired,
        ownershipHistory: credit.ownershipHistory,
        detailedMetadata: credit.detailedMetadata,
        verificationStatus: credit.verificationStatus,
        retirementDetails: credit.retirementDetails,
        createdAt: credit.createdAt,
        updatedAt: credit.updatedAt
      }
    });

  } catch (error) {
    console.error('Get credit audit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get credit audit details'
      }
    });
  }
});

/**
 * @route   POST /api/audit/verify/:id
 * @desc    Verify a credit (Certifier/Regulator only)
 * @access  Private (Certifier/Regulator)
 */
router.post('/verify/:id', auth, async (req, res) => {
  try {
    // Check if user has verification permissions
    if (!['REGULATOR', 'CERTIFIER'].includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Access denied. Verification privileges required.'
        }
      });
    }

    const { id } = req.params;
    const { isVerified, verificationNotes } = req.body;

    const credit = await Credit.findById(id);
    if (!credit) {
      return res.status(404).json({
        error: {
          message: 'Credit not found'
        }
      });
    }

    // Update verification status
    credit.verificationStatus = {
      isVerified: isVerified,
      verifiedBy: req.user.userId,
      verificationDate: new Date(),
      verificationNotes: verificationNotes
    };

    await credit.save();

    res.json({
      message: 'Credit verification status updated successfully',
      credit: {
        id: credit._id,
        creditId: credit.creditId,
        verificationStatus: credit.verificationStatus
      }
    });

  } catch (error) {
    console.error('Verify credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to verify credit'
      }
    });
  }
});

/**
 * @route   GET /api/audit/statistics
 * @desc    Get audit statistics
 * @access  Private (Regulator/Certifier)
 */
router.get('/statistics', auth, async (req, res) => {
  try {
    // Check if user has audit permissions
    if (!['REGULATOR', 'CERTIFIER'].includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Access denied. Audit privileges required.'
        }
      });
    }

    const stats = await Credit.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: 1 },
          totalHydrogen: { $sum: '$hydrogenAmount' },
          totalCreditAmount: { $sum: '$creditAmount' },
          activeCredits: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isRetired', false] }, { $gt: ['$currentBalance', 0] }] }, 1, 0]
            }
          },
          retiredCredits: {
            $sum: {
              $cond: [{ $eq: ['$isRetired', true] }, 1, 0]
            }
          },
          verifiedCredits: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus.isVerified', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get credits by renewable source type
    const sourceTypeStats = await Credit.aggregate([
      {
        $group: {
          _id: '$renewableSourceType',
          count: { $sum: 1 },
          totalHydrogen: { $sum: '$hydrogenAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get credits by status
    const statusStats = await Credit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = stats[0] || {
      totalCredits: 0,
      totalHydrogen: 0,
      totalCreditAmount: 0,
      activeCredits: 0,
      retiredCredits: 0,
      verifiedCredits: 0
    };

    res.json({
      statistics: {
        ...result,
        sourceTypeStats,
        statusStats
      }
    });

  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get audit statistics'
      }
    });
  }
});

/**
 * @route   GET /api/audit/blockchain-events
 * @desc    Get blockchain events for audit
 * @access  Private (Regulator/Certifier)
 */
router.get('/blockchain-events', auth, async (req, res) => {
  try {
    // Check if user has audit permissions
    if (!['REGULATOR', 'CERTIFIER'].includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Access denied. Audit privileges required.'
        }
      });
    }

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
    console.error('Get blockchain events error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get blockchain events'
      }
    });
  }
});

/**
 * @route   GET /api/audit/users
 * @desc    Get user audit information
 * @access  Private (Regulator only)
 */
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is regulator
    if (req.user.role !== 'REGULATOR') {
      return res.status(403).json({
        error: {
          message: 'Access denied. Regulator privileges required.'
        }
      });
    }

    const { page = 1, limit = 20, role, isVerified } = req.query;

    // Build query
    const query = { isActive: true };
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get user statistics
    const userStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verifiedCount: {
            $sum: {
              $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      users: users.map(user => user.getPublicProfile()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      statistics: userStats
    });

  } catch (error) {
    console.error('Get user audit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get user audit information'
      }
    });
  }
});

module.exports = router;
