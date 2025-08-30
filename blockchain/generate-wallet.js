const { ethers } = require('ethers');

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('🔑 New Wallet Generated:');
console.log('📋 Address:', wallet.address);
console.log('🔐 Private Key:', wallet.privateKey);
console.log('📝 Mnemonic:', wallet.mnemonic.phrase);

// Generate all 20 demo wallets
console.log('\n🎭 All 20 Demo Wallets:');
for (let i = 0; i < 20; i++) {
  const demoWallet = ethers.Wallet.createRandom();
  console.log(`\nWallet ${i + 1}:`);
  console.log('Address:', demoWallet.address);
  console.log('Private Key:', demoWallet.privateKey);
}

console.log('\n✅ All 20 wallet addresses generated successfully!');
console.log('💡 You can use these addresses for testing your hydrogen credit system.');
