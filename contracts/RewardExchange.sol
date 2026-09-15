// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AToken.sol";
import "./BToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RewardExchange is ReentrancyGuard {
    AToken public immutable aToken;
    BToken public immutable bToken;
    uint256 public constant EXCHANGE_VERSION = 2;
    event Exchanged(address indexed student, uint256 amountA, uint256 amountB);

    uint256 public constant INITIAL_RATE = 100;
    uint256 public constant HALVING_INTERVAL = 5 * 10**18;

    constructor(address _aTokenAddress, address _bTokenAddress) {
        require(_aTokenAddress.code.length > 0 && _bTokenAddress.code.length > 0 && _aTokenAddress != _bTokenAddress, "Invalid tokens");
        aToken = AToken(_aTokenAddress);
        bToken = BToken(_bTokenAddress);
    }

    function getCurrentRate() public view returns (uint256) {
        uint256 halvingCount = bToken.totalSupply() / HALVING_INTERVAL;
        return INITIAL_RATE * (2 ** halvingCount);
    }

    // Price each supply tier separately, including orders crossing a tier boundary.
    function quoteExchange(uint256 amountB) public view returns (uint256 requiredA) {
        require(amountB > 0, "Amount must be positive");
        uint256 supply = bToken.totalSupply();
        require(amountB <= bToken.MAX_SUPPLY() - supply, "Exceeds max supply");
        while (amountB > 0) {
            uint256 tier = supply / HALVING_INTERVAL;
            uint256 remainingInTier = HALVING_INTERVAL - supply % HALVING_INTERVAL;
            uint256 portion = amountB < remainingInTier ? amountB : remainingInTier;
            requiredA += portion * INITIAL_RATE * (2 ** tier);
            supply += portion;
            amountB -= portion;
        }
    }

    function exchangeForB(uint256 _amountB, uint256 maxAmountA) external nonReentrant {
        uint256 aRequired = quoteExchange(_amountB);
        require(aRequired <= maxAmountA, "Quote changed");
        aToken.burnFrom(msg.sender, aRequired);
        bToken.mint(msg.sender, _amountB);
        emit Exchanged(msg.sender, aRequired, _amountB);
    }
}
