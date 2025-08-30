const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Credit = require('../models/Credit');
require('dotenv').config();

// Sample data for seeding
const sampleUsers = [
  {
    username: 'producer1',
    email: 'producer@demo.com',
    password: 'password123',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'PRODUCER',
    organization: 'Green Hydrogen Solutions Ltd.',
    isVerified: true,
    profile: {
      firstName: 'राजेश',
      lastName: 'कुमार',
      phone: '+91-9876543210',
      address: {
        street: '123 Green Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      },
      website: 'https://greenhydrogen.com',
      description: 'Leading producer of green hydrogen using solar energy'
    }
  },
  {
    username: 'certifier1',
    email: 'certifier@demo.com',
    password: 'password123',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    role: 'CERTIFIER',
    organization: 'Carbon Credit Certification Authority',
    isVerified: true,
    profile: {
      firstName: 'प्रिया',
      lastName: 'शर्मा',
      phone: '+91-9876543211',
      address: {
        street: '456 Certification Road',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        zipCode: '110001'
      },
      website: 'https://carboncertification.org',
      description: 'Certified carbon credit auditor and validator'
    }
  },
  {
    username: 'consumer1',
    email: 'consumer@demo.com',
    password: 'password123',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    role: 'CONSUMER',
    organization: 'EcoTech Industries',
    isVerified: true,
    profile: {
      firstName: 'अमित',
      lastName: 'वर्मा',
      phone: '+91-9876543212',
      address: {
        street: '789 Industrial Park',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001'
      },
      website: 'https://ecotech.com',
      description: 'Manufacturing company committed to carbon neutrality'
    }
  },
  {
    username: 'regulator1',
    email: 'regulator@demo.com',
    password: 'password123',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    role: 'REGULATOR',
    organization: 'Ministry of Environment and Climate Change',
    isVerified: true,
    profile: {
      firstName: 'डॉ. सुनीता',
      lastName: 'पटेल',
      phone: '+91-9876543213',
      address: {
        street: 'Government Complex',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        zipCode: '110001'
      },
      website: 'https://moefcc.gov.in',
      description: 'Senior environmental regulator and policy maker'
    }
  }
];

const sampleCredits = [
  {
    creditId: 1,
    blockchainTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    renewableSourceType: 'Solar',
    hydrogenAmount: 1000, // kg
    creditAmount: 100,
    metadataHash: 'QmSolarHash123456789',
    detailedMetadata: {
      productionFacility: {
        name: 'Solar Hydrogen Plant - Mumbai',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Mumbai, Maharashtra, India'
        },
        capacity: 50, // MW
        efficiency: 85 // percentage
      },
      productionDetails: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalEnergyConsumed: 50000, // kWh
        renewableEnergyPercentage: 100, // percentage
        carbonIntensity: 0, // gCO2/kWh
        certificationStandards: ['ISO 14001', 'Green Hydrogen Standard']
      },
      environmentalImpact: {
        co2Avoided: 5000, // kg CO2
        waterSaved: 10000, // liters
        landUse: 2.5 // hectares
      },
      qualityMetrics: {
        purity: 99.9, // percentage
        pressure: 350, // bar
        temperature: 25, // celsius
        contaminants: []
      },
      documentation: {
        certificates: [],
        reports: []
      }
    },
    status: 'ISSUED',
    currentBalance: 100,
    isRetired: false
  },
  {
    creditId: 2,
    blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    renewableSourceType: 'Wind',
    hydrogenAmount: 1500, // kg
    creditAmount: 150,
    metadataHash: 'QmWindHash123456789',
    detailedMetadata: {
      productionFacility: {
        name: 'Wind Hydrogen Facility - Tamil Nadu',
        location: {
          latitude: 13.0827,
          longitude: 80.2707,
          address: 'Chennai, Tamil Nadu, India'
        },
        capacity: 75, // MW
        efficiency: 80 // percentage
      },
      productionDetails: {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        totalEnergyConsumed: 75000, // kWh
        renewableEnergyPercentage: 100, // percentage
        carbonIntensity: 0, // gCO2/kWh
        certificationStandards: ['ISO 14001', 'Wind Energy Standard']
      },
      environmentalImpact: {
        co2Avoided: 7500, // kg CO2
        waterSaved: 15000, // liters
        landUse: 3.0 // hectares
      },
      qualityMetrics: {
        purity: 99.8, // percentage
        pressure: 300, // bar
        temperature: 20, // celsius
        contaminants: []
      },
      documentation: {
        certificates: [],
        reports: []
      }
    },
    status: 'TRANSFERRED',
    currentBalance: 75,
    isRetired: false
  }
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hydrogen-credits');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Credit.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.username} (${user.role})`);
    }

    // Create credits
    for (let i = 0; i < sampleCredits.length; i++) {
      const creditData = sampleCredits[i];
      
      // Assign producer and certifier
      const producer = createdUsers.find(u => u.role === 'PRODUCER');
      const certifier = createdUsers.find(u => u.role === 'CERTIFIER');
      
      const credit = new Credit({
        ...creditData,
        producer: producer._id,
        certifier: certifier._id,
        currentOwner: producer._id,
        ownershipHistory: [
          {
            owner: producer._id,
            amount: creditData.creditAmount,
            transactionHash: creditData.blockchainTxHash,
            type: 'ISSUE'
          }
        ]
      });

      // Add transfer history for second credit
      if (i === 1) {
        const consumer = createdUsers.find(u => u.role === 'CONSUMER');
        credit.currentOwner = consumer._id;
        credit.ownershipHistory.push({
          owner: consumer._id,
          amount: 75,
          transactionHash: '0xtransferhash123456789',
          type: 'TRANSFER'
        });
      }

      await credit.save();
      console.log(`💳 Created credit: ${credit.creditId} (${credit.renewableSourceType})`);
    }

    console.log('✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users created: ${createdUsers.length}`);
    console.log(`- Credits created: ${sampleCredits.length}`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Producer: producer@demo.com / password123');
    console.log('Certifier: certifier@demo.com / password123');
    console.log('Consumer: consumer@demo.com / password123');
    console.log('Regulator: regulator@demo.com / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedData();
