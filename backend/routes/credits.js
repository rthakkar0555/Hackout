const express = require('express');
const Joi = require('joi');
const { ethers } = require('ethers');
const User = require('../models/User');
const Credit = require('../models/Credit');
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { getBlockchainContract } = require('../utils/blockchain');

const router = express.Router();

// Validation schemas
const issueCreditSchema = Joi.object({
  producerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  renewableSourceType: Joi.string().valid('Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Other').required(),
  hydrogenAmount: Joi.number().positive().required(),
  creditAmount: Joi.number().positive().required(),
  detailedMetadata: Joi.object({
    productionFacility: Joi.object({
      name: Joi.string().required(),
      location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string()
      }),
      capacity: Joi.number().positive(),
      efficiency: Joi.number().min(0).max(100)
    }),
    productionDetails: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      totalEnergyConsumed: Joi.number().positive(),
      renewableEnergyPercentage: Joi.number().min(0).max(100),
      carbonIntensity: Joi.number().positive(),
      certificationStandards: Joi.array().items(Joi.string())
    }),
    environmentalImpact: Joi.object({
      co2Avoided: Joi.number().positive(),
      waterSaved: Joi.number().positive(),
      landUse: Joi.number().positive()
    }),
    qualityMetrics: Joi.object({
      purity: Joi.number().min(0).max(100),
      pressure: Joi.number().positive(),
      temperature: Joi.number(),
      contaminants: Joi.array().items(Joi.string())
    }),
    documentation: Joi.object({
      certificates: Joi.array().items(Joi.object({
        name: Joi.string(),
        issuer: Joi.string(),
        issueDate: Joi.date(),
        expiryDate: Joi.date(),
        fileHash: Joi.string()
      })),
      reports: Joi.array().items(Joi.object({
        title: Joi.string(),
        type: Joi.string(),
        date: Joi.date(),
        fileHash: Joi.string()
      }))
    })
  }).required()
});

const transferCreditSchema = Joi.object({
  toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  creditId: Joi.number().integer().min(0).required(),
  amount: Joi.number().positive().required()
});

const retireCreditSchema = Joi.object({
  creditId: Joi.number().integer().min(0).required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().required()
});

/**
 * @route   POST /api/credits/issue
 * @desc    Issue new hydrogen credits (Certifiers only)
 * @access  Private (Certifier)
 */
router.post('/issue', auth, validateRequest(issueCreditSchema), async (req, res) => {
  try {
    // Check if user is a certifier
    if (req.user.role !== 'CERTIFIER') {
      return res.status(403).json({
        error: {
          message: 'Access denied. Certifier privileges required.'
        }
      });
    }

    const {
      producerAddress,
      renewableSourceType,
      hydrogenAmount,
      creditAmount,
      detailedMetadata
    } = req.body;

    // Find producer user
    const producer = await User.findByWalletAddress(producerAddress);
    if (!producer) {
      return res.status(404).json({
        error: {
          message: 'Producer not found'
        }
      });
    }

    // Check if producer has PRODUCER role
    if (producer.role !== 'PRODUCER') {
      return res.status(400).json({
        error: {
          message: 'Address does not belong to a certified producer'
        }
      });
    }

    // Get blockchain contract
    const contract = await getBlockchainContract();
    const certifier = await User.findById(req.user.userId);

    // Create metadata hash
    const metadataString = JSON.stringify(detailedMetadata);
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));

    // Issue credits on blockchain
    const tx = await contract.issueCredit(
      producerAddress,
      renewableSourceType,
      hydrogenAmount,
      metadataHash,
      creditAmount
    );

    await tx.wait();

    // Get the credit ID from the transaction receipt
    const receipt = await tx.wait();
    const creditIssuedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CreditIssued';
      } catch {
        return false;
      }
    });

    if (!creditIssuedEvent) {
      throw new Error('CreditIssued event not found in transaction');
    }

    const parsedEvent = contract.interface.parseLog(creditIssuedEvent);
    const creditId = parsedEvent.args[0]; // creditId is the first argument

    // Save credit to database
    const credit = new Credit({
      creditId: creditId.toString(),
      blockchainTxHash: tx.hash,
      producer: producer._id,
      certifier: certifier._id,
      renewableSourceType,
      hydrogenAmount,
      creditAmount,
      metadataHash,
      detailedMetadata,
      currentOwner: producer._id,
      currentBalance: creditAmount,
      ownershipHistory: [{
        owner: producer._id,
        amount: creditAmount,
        transactionHash: tx.hash,
        type: 'ISSUE'
      }]
    });

    await credit.save();

    res.status(201).json({
      message: 'Credits issued successfully',
      creditId: creditId.toString(),
      transactionHash: tx.hash,
      credit: {
        id: credit._id,
        creditId: credit.creditId,
        producer: producer.getPublicProfile(),
        renewableSourceType,
        hydrogenAmount,
        creditAmount,
        status: credit.status
      }
    });

  } catch (error) {
    console.error('Issue credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to issue credits',
        details: error.message
      }
    });
  }
});

/**
 * @route   POST /api/credits/transfer
 * @desc    Transfer credits between accounts
 * @access  Private
 */
router.post('/transfer', auth, validateRequest(transferCreditSchema), async (req, res) => {
  try {
    const { toAddress, creditId, amount } = req.body;

    // Find recipient user
    const recipient = await User.findByWalletAddress(toAddress);
    if (!recipient) {
      return res.status(404).json({
        error: {
          message: 'Recipient not found'
        }
      });
    }

    // Find credit in database
    const credit = await Credit.findOne({ creditId: creditId.toString() });
    if (!credit) {
      return res.status(404).json({
        error: {
          message: 'Credit not found'
        }
      });
    }

    // Check if credit is retired
    if (credit.isRetired) {
      return res.status(400).json({
        error: {
          message: 'Credit is already retired'
        }
      });
    }

    // Check if sender owns the credit
    if (credit.currentOwner.toString() !== req.user.userId) {
      return res.status(403).json({
        error: {
          message: 'You do not own this credit'
        }
      });
    }

    // Check if sender has enough balance
    if (credit.currentBalance < amount) {
      return res.status(400).json({
        error: {
          message: 'Insufficient credit balance'
        }
      });
    }

    // Get blockchain contract
    const contract = await getBlockchainContract();
    const sender = await User.findById(req.user.userId);

    // Transfer credits on blockchain
    const tx = await contract.transferCredit(
      toAddress,
      creditId,
      amount
    );

    await tx.wait();

    // Update credit in database
    const newBalance = credit.currentBalance - amount;
    await credit.transferOwnership(
      recipient._id,
      newBalance,
      tx.hash
    );

    res.json({
      message: 'Credits transferred successfully',
      transactionHash: tx.hash,
      credit: {
        id: credit._id,
        creditId: credit.creditId,
        newBalance,
        recipient: recipient.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Transfer credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to transfer credits',
        details: error.message
      }
    });
  }
});

/**
 * @route   POST /api/credits/retire
 * @desc    Retire credits (Consumers only)
 * @access  Private (Consumer)
 */
router.post('/retire', auth, validateRequest(retireCreditSchema), async (req, res) => {
  try {
    // Check if user is a consumer
    if (req.user.role !== 'CONSUMER') {
      return res.status(403).json({
        error: {
          message: 'Access denied. Consumer privileges required.'
        }
      });
    }

    const { creditId, amount, reason } = req.body;

    // Find credit in database
    const credit = await Credit.findOne({ creditId: creditId.toString() });
    if (!credit) {
      return res.status(404).json({
        error: {
          message: 'Credit not found'
        }
      });
    }

    // Check if credit is already retired
    if (credit.isRetired) {
      return res.status(400).json({
        error: {
          message: 'Credit is already retired'
        }
      });
    }

    // Check if user owns the credit
    if (credit.currentOwner.toString() !== req.user.userId) {
      return res.status(403).json({
        error: {
          message: 'You do not own this credit'
        }
      });
    }

    // Check if user has enough balance
    if (credit.currentBalance < amount) {
      return res.status(400).json({
        error: {
          message: 'Insufficient credit balance'
        }
      });
    }

    // Get blockchain contract
    const contract = await getBlockchainContract();

    // Retire credits on blockchain
    const tx = await contract.retireCredit(creditId, amount);
    await tx.wait();

    // Update credit in database
    await credit.retireCredit(req.user.userId, reason, tx.hash);

    res.json({
      message: 'Credits retired successfully',
      transactionHash: tx.hash,
      credit: {
        id: credit._id,
        creditId: credit.creditId,
        retiredAmount: amount,
        reason
      }
    });

  } catch (error) {
    console.error('Retire credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retire credits',
        details: error.message
      }
    });
  }
});

/**
 * @route   GET /api/credits/:id
 * @desc    Get credit details by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const credit = await Credit.findById(id)
      .populate('producer', 'username organization profile')
      .populate('certifier', 'username organization')
      .populate('currentOwner', 'username organization')
      .populate('ownershipHistory.owner', 'username organization');

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
        createdAt: credit.createdAt,
        updatedAt: credit.updatedAt
      }
    });

  } catch (error) {
    console.error('Get credit error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get credit details'
      }
    });
  }
});

/**
 * @route   GET /api/credits/my-credits
 * @desc    Get current user's credits
 * @access  Private
 */
router.get('/my-credits', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { currentOwner: req.user.userId };
    if (status) {
      query.status = status;
    }

    const credits = await Credit.find(query)
      .populate('producer', 'username organization')
      .populate('certifier', 'username organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Credit.countDocuments(query);

    res.json({
      credits: credits.map(credit => ({
        id: credit._id,
        creditId: credit.creditId,
        producer: credit.producer,
        renewableSourceType: credit.renewableSourceType,
        hydrogenAmount: credit.hydrogenAmount,
        creditAmount: credit.creditAmount,
        currentBalance: credit.currentBalance,
        status: credit.status,
        isRetired: credit.isRetired,
        createdAt: credit.createdAt
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
    console.error('Get my credits error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get credits'
      }
    });
  }
});

/**
 * @route   GET /api/credits/produced-credits
 * @desc    Get credits produced by current user (Producers only)
 * @access  Private (Producer)
 */
router.get('/produced-credits', auth, async (req, res) => {
  try {
    if (req.user.role !== 'PRODUCER') {
      return res.status(403).json({
        error: {
          message: 'Access denied. Producer privileges required.'
        }
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const credits = await Credit.find({ producer: req.user.userId })
      .populate('certifier', 'username organization')
      .populate('currentOwner', 'username organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Credit.countDocuments({ producer: req.user.userId });

    res.json({
      credits: credits.map(credit => ({
        id: credit._id,
        creditId: credit.creditId,
        certifier: credit.certifier,
        renewableSourceType: credit.renewableSourceType,
        hydrogenAmount: credit.hydrogenAmount,
        creditAmount: credit.creditAmount,
        currentOwner: credit.currentOwner,
        currentBalance: credit.currentBalance,
        status: credit.status,
        isRetired: credit.isRetired,
        createdAt: credit.createdAt
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
    console.error('Get produced credits error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get produced credits'
      }
    });
  }
});

/**
 * @route   GET /api/credits/statistics
 * @desc    Get credit statistics
 * @access  Private
 */
router.get('/statistics', auth, async (req, res) => {
  try {
    const stats = await Credit.getStatistics();
    const result = stats[0] || {
      totalCredits: 0,
      totalHydrogen: 0,
      activeCredits: 0,
      retiredCredits: 0
    };

    res.json({
      statistics: result
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get statistics'
      }
    });
  }
});

module.exports = router;
