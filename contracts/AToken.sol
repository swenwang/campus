// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AToken is ERC20, ERC20Burnable, Ownable {
    using ECDSA for bytes32;

    mapping(string => mapping(address => bool)) public hasClaimed;

    constructor() ERC20("AlphaToken", "ATK") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function claimToken(string memory classId, bytes memory signature) public {
        require(!hasClaimed[classId][msg.sender], "You have already claimed this class!");
        bytes32 messageHash = keccak256(abi.encodePacked(classId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == owner(), "Invalid signature! Cheat detected!");
        hasClaimed[classId][msg.sender] = true;
        _mint(msg.sender, 10 * 10**decimals());
    }
}
