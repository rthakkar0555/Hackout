const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  creditId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  blockchainTxHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certifier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  renewableSourceType: {
    type: String,
    required: true,
    enum: ['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Other']
  },
  hydrogenAmount: {
    type: Number,
    required: true,
    min: 0
  },
  creditAmount: {
    type: Number,
    required: true,
    min: 0
  },
  metadataHash: {
    type: String,
    required: true
  },
  detailedMetadata: {
    productionFacility: {
      name: String,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      capacity: Number, // MW
      efficiency: Number // percentage
    },
    productionDetails: {
      startDate: Date,
      endDate: Date,
      totalEnergyConsumed: Number, // kWh
      renewableEnergyPercentage: Number, // percentage
      carbonIntensity: Number, // gCO2/kWh
      certificationStandards: [String]
    },
    environmentalImpact: {
      co2Avoided: Number, // kg CO2
      waterSaved: Number, // liters
      landUse: Number // hectares
    },
    qualityMetrics: {
      purity: Number, // percentage
      pressure: Number, // bar
      temperature: Number, // celsius
      contaminants: [String]
    },
    documentation: {
      certificates: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        fileHash: String
      }],
      reports: [{
        title: String,
        type: String,
        date: Date,
        fileHash: String
      }]
    }
  },
  status: {
    type: String,
    enum: ['ISSUED', 'TRANSFERRED', 'RETIRED', 'EXPIRED'],
    default: 'ISSUED'
  },
  ownershipHistory: [{
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    transactionHash: String,
    timestamp: Date,
    type: {
      type: String,
      enum: ['ISSUE', 'TRANSFER', 'RETIRE']
    }
  }],
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isRetired: {
    type: Boolean,
    default: false
  },
  retirementDetails: {
    retiredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    retirementDate: Date,
    retirementReason: String,
    retirementTxHash: String
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
creditSchema.index({ producer: 1 });
creditSchema.index({ currentOwner: 1 });
creditSchema.index({ status: 1 });
creditSchema.index({ renewableSourceType: 1 });
creditSchema.index({ 'detailedMetadata.productionDetails.startDate': 1 });
creditSchema.index({ 'detailedMetadata.productionDetails.endDate': 1 });

// Virtual for calculating age of credit
creditSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to add ownership history entry
creditSchema.methods.addOwnershipHistory = function(entry) {
  this.ownershipHistory.push({
    ...entry,
    timestamp: new Date()
  });
  return this.save();
};

// Method to transfer ownership
creditSchema.methods.transferOwnership = function(newOwner, amount, txHash) {
  this.currentOwner = newOwner;
  this.currentBalance = amount;
  this.addOwnershipHistory({
    owner: newOwner,
    amount: amount,
    transactionHash: txHash,
    type: 'TRANSFER'
  });
  return this.save();
};

// Method to retire credit
creditSchema.methods.retireCredit = function(retiredBy, reason, txHash) {
  this.isRetired = true;
  this.status = 'RETIRED';
  this.currentBalance = 0;
  this.retirementDetails = {
    retiredBy: retiredBy,
    retirementDate: new Date(),
    retirementReason: reason,
    retirementTxHash: txHash
  };
  this.addOwnershipHistory({
    owner: retiredBy,
    amount: 0,
    transactionHash: txHash,
    type: 'RETIRE'
  });
  return this.save();
};

// Static method to find active credits
creditSchema.statics.findActive = function() {
  return this.find({ isRetired: false, currentBalance: { $gt: 0 } });
};

// Static method to find credits by producer
creditSchema.statics.findByProducer = function(producerId) {
  return this.find({ producer: producerId }).populate('producer', 'username organization');
};

// Static method to find credits by owner
creditSchema.statics.findByOwner = function(ownerId) {
  return this.find({ currentOwner: ownerId, isRetired: false }).populate('currentOwner', 'username organization');
};

// Static method to get credit statistics
creditSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCredits: { $sum: '$creditAmount' },
        totalHydrogen: { $sum: '$hydrogenAmount' },
        activeCredits: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$isRetired', false] }, { $gt: ['$currentBalance', 0] }] }, '$currentBalance', 0]
          }
        },
        retiredCredits: {
          $sum: {
            $cond: [{ $eq: ['$isRetired', true] }, '$creditAmount', 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Credit', creditSchema);
