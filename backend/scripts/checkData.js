const mongoose = require('mongoose');
const User = require('../models/User');
const Credit = require('../models/Credit');
require('dotenv').config();

async function checkData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hydrogen-credits');
    console.log('✅ Connected to MongoDB');

    // Check users
    const users = await User.find({}).select('-password');
    console.log('\n📊 Users in Database:');
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.role}`);
    });

    // Check credits
    const credits = await Credit.find({});
    console.log('\n💳 Credits in Database:');
    console.log(`Total credits: ${credits.length}`);
    credits.forEach((credit, index) => {
      console.log(`${index + 1}. Credit ID: ${credit.creditId} - ${credit.renewableSourceType} - Amount: ${credit.creditAmount}`);
    });

    // Check database stats
    const userCount = await User.countDocuments();
    const creditCount = await Credit.countDocuments();
    
    console.log('\n📈 Database Statistics:');
    console.log(`Users: ${userCount}`);
    console.log(`Credits: ${creditCount}`);

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check function
checkData();
