// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract AToken is ERC20, ERC20Burnable, Ownable, EIP712 {
    using ECDSA for bytes32;

    mapping(string => mapping(address => bool)) public hasClaimed;
    uint256 public constant ATTENDANCE_VERSION = 2;
    bytes32 private constant ATTENDANCE_TYPEHASH = keccak256(
        "Attendance(string classId,address student,uint256 deadline)"
    );
    event AttendanceClaimed(string classId, address indexed student);

    constructor() ERC20("AlphaToken", "ATK") Ownable(msg.sender) EIP712("CampusAttendance", "2") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function claimToken(string memory classId, uint256 deadline, bytes memory signature) public {
        require(bytes(classId).length > 0 && bytes(classId).length <= 128, "Invalid class ID");
        require(block.timestamp <= deadline, "Attendance expired");
        require(!hasClaimed[classId][msg.sender], "You have already claimed this class!");
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            ATTENDANCE_TYPEHASH, keccak256(bytes(classId)), msg.sender, deadline
        )));
        address signer = digest.recover(signature);
        require(signer == owner(), "Invalid signature! Cheat detected!");
        hasClaimed[classId][msg.sender] = true;
        _mint(msg.sender, 10 * 10**decimals());
        emit AttendanceClaimed(classId, msg.sender);
    }
}
