// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title HydrogenCredit
 * @dev Green Hydrogen Credit System using ERC-1155 tokens
 * @author Green Hydrogen Team
 */
contract HydrogenCredit is ERC1155, AccessControl {
    using Strings for uint256;

    // Role definitions
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Credit metadata structure
    struct CreditMetadata {
        uint256 creditId;
        address producer;
        string renewableSourceType;
        uint256 productionDate;
        uint256 hydrogenAmount; // in kg
        string metadataHash;
        bool isRetired;
        uint256 retirementDate;
        address retiredBy;
    }

    // State variables
    uint256 private _creditIdCounter;
    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(address => uint256[]) public producerCredits;
    mapping(address => uint256[]) public consumerCredits;
    
    // Events
    event CreditIssued(
        uint256 indexed creditId,
        address indexed producer,
        string renewableSourceType,
        uint256 hydrogenAmount,
        string metadataHash,
        uint256 timestamp
    );

    event CreditTransferred(
        uint256 indexed creditId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event CreditRetired(
        uint256 indexed creditId,
        address indexed retiredBy,
        uint256 amount,
        uint256 timestamp
    );



    /**
     * @dev Constructor - sets up initial roles
     */
    constructor() ERC1155("https://api.hydrogen-credits.com/metadata/{id}") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @dev Issue new hydrogen credits (only certifiers can call)
     * @param producer Address of the hydrogen producer
     * @param renewableSourceType Type of renewable energy source
     * @param hydrogenAmount Amount of hydrogen produced in kg
     * @param metadataHash IPFS hash of detailed metadata
     * @param amount Number of credits to issue
     */
    function issueCredit(
        address producer,
        string memory renewableSourceType,
        uint256 hydrogenAmount,
        string memory metadataHash,
        uint256 amount
    ) external onlyRole(CERTIFIER_ROLE) {
        require(producer != address(0), "Invalid producer address");
        require(hydrogenAmount > 0, "Hydrogen amount must be positive");
        require(amount > 0, "Credit amount must be positive");
        require(bytes(metadataHash).length > 0, "Metadata hash required");

        uint256 creditId = _creditIdCounter;
        _creditIdCounter++;

        // Create credit metadata
        creditMetadata[creditId] = CreditMetadata({
            creditId: creditId,
            producer: producer,
            renewableSourceType: renewableSourceType,
            productionDate: block.timestamp,
            hydrogenAmount: hydrogenAmount,
            metadataHash: metadataHash,
            isRetired: false,
            retirementDate: 0,
            retiredBy: address(0)
        });

        // Mint ERC-1155 tokens
        _mint(producer, creditId, amount, "");
        
        // Track producer's credits
        producerCredits[producer].push(creditId);

        emit CreditIssued(
            creditId,
            producer,
            renewableSourceType,
            hydrogenAmount,
            metadataHash,
            block.timestamp
        );
    }

    /**
     * @dev Transfer credits between accounts
     * @param to Recipient address
     * @param creditId ID of the credit to transfer
     * @param amount Amount to transfer
     */
    function transferCredit(
        address to,
        uint256 creditId,
        uint256 amount
    ) external {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Transfer amount must be positive");
        require(!creditMetadata[creditId].isRetired, "Credit is already retired");
        require(balanceOf(msg.sender, creditId) >= amount, "Insufficient credits");

        // Transfer tokens
        _safeTransferFrom(msg.sender, to, creditId, amount, "");
        
        // Track consumer's credits
        if (balanceOf(to, creditId) == amount) {
            consumerCredits[to].push(creditId);
        }

        emit CreditTransferred(
            creditId,
            msg.sender,
            to,
            amount,
            block.timestamp
        );
    }

    /**
     * @dev Retire credits (only consumers can call)
     * @param creditId ID of the credit to retire
     * @param amount Amount to retire
     */
    function retireCredit(uint256 creditId, uint256 amount) external {
        require(amount > 0, "Retirement amount must be positive");
        require(!creditMetadata[creditId].isRetired, "Credit is already retired");
        require(balanceOf(msg.sender, creditId) >= amount, "Insufficient credits");

        // Update metadata
        creditMetadata[creditId].isRetired = true;
        creditMetadata[creditId].retirementDate = block.timestamp;
        creditMetadata[creditId].retiredBy = msg.sender;

        // Burn tokens
        _burn(msg.sender, creditId, amount);

        emit CreditRetired(
            creditId,
            msg.sender,
            amount,
            block.timestamp
        );
    }

    /**
     * @dev Get credit metadata
     * @param creditId ID of the credit
     * @return CreditMetadata struct
     */
    function getCreditMetadata(uint256 creditId) external view returns (CreditMetadata memory) {
        return creditMetadata[creditId];
    }

    /**
     * @dev Get all credits for a producer
     * @param producer Address of the producer
     * @return Array of credit IDs
     */
    function getProducerCredits(address producer) external view returns (uint256[] memory) {
        return producerCredits[producer];
    }

    /**
     * @dev Get all credits for a consumer
     * @param consumer Address of the consumer
     * @return Array of credit IDs
     */
    function getConsumerCredits(address consumer) external view returns (uint256[] memory) {
        return consumerCredits[consumer];
    }

    /**
     * @dev Verify credit authenticity
     * @param creditId ID of the credit
     * @param metadataHash Expected metadata hash
     * @return bool True if credit exists and hash matches
     */
    function verifyCredit(uint256 creditId, string memory metadataHash) external view returns (bool) {
        CreditMetadata memory metadata = creditMetadata[creditId];
        return (
            metadata.producer != address(0) &&
            keccak256(bytes(metadata.metadataHash)) == keccak256(bytes(metadataHash))
        );
    }

    /**
     * @dev Grant role to address (only admin can call)
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.grantRole(role, account);
    }

    /**
     * @dev Get total credits issued
     * @return uint256 Total number of credits issued
     */
    function getTotalCreditsIssued() external view returns (uint256) {
        return _creditIdCounter;
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
