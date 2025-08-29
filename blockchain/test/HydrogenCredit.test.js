const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HydrogenCredit", function () {
  let HydrogenCredit;
  let hydrogenCredit;
  let owner;
  let producer;
  let certifier;
  let consumer;
  let regulator;
  let addr1;
  let addr2;

  const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
  const CERTIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CERTIFIER_ROLE"));
  const CONSUMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CONSUMER_ROLE"));
  const REGULATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGULATOR_ROLE"));

  beforeEach(async function () {
    // Get signers
    [owner, producer, certifier, consumer, regulator, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
    hydrogenCredit = await HydrogenCredit.deploy();

    // Grant roles
    await hydrogenCredit.grantRole(PRODUCER_ROLE, producer.address);
    await hydrogenCredit.grantRole(CERTIFIER_ROLE, certifier.address);
    await hydrogenCredit.grantRole(CONSUMER_ROLE, consumer.address);
    await hydrogenCredit.grantRole(REGULATOR_ROLE, regulator.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hydrogenCredit.hasRole(await hydrogenCredit.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should grant REGULATOR_ROLE to owner", async function () {
      expect(await hydrogenCredit.hasRole(REGULATOR_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Role Management", function () {
    it("Should grant roles correctly", async function () {
      expect(await hydrogenCredit.hasRole(PRODUCER_ROLE, producer.address)).to.equal(true);
      expect(await hydrogenCredit.hasRole(CERTIFIER_ROLE, certifier.address)).to.equal(true);
      expect(await hydrogenCredit.hasRole(CONSUMER_ROLE, consumer.address)).to.equal(true);
    });

    it("Should allow admin to grant roles", async function () {
      await hydrogenCredit.grantRole(PRODUCER_ROLE, addr1.address);
      expect(await hydrogenCredit.hasRole(PRODUCER_ROLE, addr1.address)).to.equal(true);
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        hydrogenCredit.connect(addr1).grantRole(PRODUCER_ROLE, addr2.address)
      ).to.be.revertedWithCustomError(hydrogenCredit, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Credit Issuance", function () {
    it("Should allow certifier to issue credits", async function () {
      const metadataHash = "QmTestHash123";
      const hydrogenAmount = 1000; // kg
      const creditAmount = 100;

      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Solar",
        hydrogenAmount,
        metadataHash,
        creditAmount
      );

      expect(await hydrogenCredit.balanceOf(producer.address, 0)).to.equal(creditAmount);
    });

    it("Should not allow non-certifier to issue credits", async function () {
      await expect(
        hydrogenCredit.connect(addr1).issueCredit(
          producer.address,
          "Solar",
          1000,
          "QmTestHash123",
          100
        )
      ).to.be.revertedWithCustomError(hydrogenCredit, "AccessControlUnauthorizedAccount");
    });

    it("Should emit CreditIssued event", async function () {
      const metadataHash = "QmTestHash123";
      const hydrogenAmount = 1000;
      const creditAmount = 100;

      await expect(
        hydrogenCredit.connect(certifier).issueCredit(
          producer.address,
          "Solar",
          hydrogenAmount,
          metadataHash,
          creditAmount
        )
      ).to.emit(hydrogenCredit, "CreditIssued")
        .withArgs(0, producer.address, "Solar", hydrogenAmount, metadataHash, await time());
    });

    it("Should reject invalid parameters", async function () {
      await expect(
        hydrogenCredit.connect(certifier).issueCredit(
          ethers.ZeroAddress,
          "Solar",
          1000,
          "QmTestHash123",
          100
        )
      ).to.be.revertedWith("Invalid producer address");

      await expect(
        hydrogenCredit.connect(certifier).issueCredit(
          producer.address,
          "Solar",
          0,
          "QmTestHash123",
          100
        )
      ).to.be.revertedWith("Hydrogen amount must be positive");

      await expect(
        hydrogenCredit.connect(certifier).issueCredit(
          producer.address,
          "Solar",
          1000,
          "",
          100
        )
      ).to.be.revertedWith("Metadata hash required");
    });
  });

  describe("Credit Transfer", function () {
    beforeEach(async function () {
      // Issue credits first
      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Solar",
        1000,
        "QmTestHash123",
        100
      );
    });

    it("Should allow transfer of credits", async function () {
      await hydrogenCredit.connect(producer).transferCredit(consumer.address, 0, 50);
      expect(await hydrogenCredit.balanceOf(consumer.address, 0)).to.equal(50);
      expect(await hydrogenCredit.balanceOf(producer.address, 0)).to.equal(50);
    });

    it("Should emit CreditTransferred event", async function () {
      await expect(
        hydrogenCredit.connect(producer).transferCredit(consumer.address, 0, 50)
      ).to.emit(hydrogenCredit, "CreditTransferred")
        .withArgs(0, producer.address, consumer.address, 50, await time());
    });

    it("Should not allow transfer of more credits than owned", async function () {
      await expect(
        hydrogenCredit.connect(producer).transferCredit(consumer.address, 0, 150)
      ).to.be.revertedWith("Insufficient credits");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        hydrogenCredit.connect(producer).transferCredit(ethers.ZeroAddress, 0, 50)
      ).to.be.revertedWith("Invalid recipient address");
    });
  });

  describe("Credit Retirement", function () {
    beforeEach(async function () {
      // Issue and transfer credits
      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Solar",
        1000,
        "QmTestHash123",
        100
      );
      await hydrogenCredit.connect(producer).transferCredit(consumer.address, 0, 50);
    });

    it("Should allow retirement of credits", async function () {
      await hydrogenCredit.connect(consumer).retireCredit(0, 30);
      expect(await hydrogenCredit.balanceOf(consumer.address, 0)).to.equal(20);
    });

    it("Should emit CreditRetired event", async function () {
      await expect(
        hydrogenCredit.connect(consumer).retireCredit(0, 30)
      ).to.emit(hydrogenCredit, "CreditRetired")
        .withArgs(0, consumer.address, 30, await time());
    });

    it("Should not allow retirement of more credits than owned", async function () {
      await expect(
        hydrogenCredit.connect(consumer).retireCredit(0, 60)
      ).to.be.revertedWith("Insufficient credits");
    });

    it("Should mark credit as retired in metadata", async function () {
      await hydrogenCredit.connect(consumer).retireCredit(0, 50);
      const metadata = await hydrogenCredit.getCreditMetadata(0);
      expect(metadata.isRetired).to.equal(true);
      expect(metadata.retiredBy).to.equal(consumer.address);
    });
  });

  describe("Credit Verification", function () {
    beforeEach(async function () {
      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Solar",
        1000,
        "QmTestHash123",
        100
      );
    });

    it("Should verify valid credit", async function () {
      const isValid = await hydrogenCredit.verifyCredit(0, "QmTestHash123");
      expect(isValid).to.equal(true);
    });

    it("Should reject invalid metadata hash", async function () {
      const isValid = await hydrogenCredit.verifyCredit(0, "QmInvalidHash");
      expect(isValid).to.equal(false);
    });

    it("Should reject non-existent credit", async function () {
      const isValid = await hydrogenCredit.verifyCredit(999, "QmTestHash123");
      expect(isValid).to.equal(false);
    });
  });

  describe("Credit Queries", function () {
    beforeEach(async function () {
      // Issue multiple credits
      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Solar",
        1000,
        "QmTestHash1",
        100
      );
      await hydrogenCredit.connect(certifier).issueCredit(
        producer.address,
        "Wind",
        2000,
        "QmTestHash2",
        200
      );
    });

    it("Should return correct credit metadata", async function () {
      const metadata = await hydrogenCredit.getCreditMetadata(0);
      expect(metadata.producer).to.equal(producer.address);
      expect(metadata.renewableSourceType).to.equal("Solar");
      expect(metadata.hydrogenAmount).to.equal(1000);
      expect(metadata.metadataHash).to.equal("QmTestHash1");
    });

    it("Should return producer credits", async function () {
      const credits = await hydrogenCredit.getProducerCredits(producer.address);
      expect(credits.length).to.equal(2);
      expect(credits[0]).to.equal(0);
      expect(credits[1]).to.equal(1);
    });

    it("Should return total credits issued", async function () {
      const total = await hydrogenCredit.getTotalCreditsIssued();
      expect(total).to.equal(2);
    });
  });
});

// Helper function to get current timestamp
async function time() {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block.timestamp;
}
