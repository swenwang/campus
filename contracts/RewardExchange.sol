// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AToken.sol";
import "./BToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardExchange is Ownable {
    AToken public aToken;
    BToken public bToken;

    uint256 public constant INITIAL_RATE = 100;
    uint256 public constant HALVING_INTERVAL = 5 * 10**18;

    constructor(address _aTokenAddress, address _bTokenAddress) Ownable(msg.sender) {
        aToken = AToken(_aTokenAddress);
        bToken = BToken(_bTokenAddress);
    }

    function getCurrentRate() public view returns (uint256) {
        uint256 halvingCount = bToken.totalSupply() / HALVING_INTERVAL;
        return INITIAL_RATE * (2 ** halvingCount);
    }

    function exchangeForB(uint256 _amountB) external {
        uint256 currentRate = getCurrentRate();
        uint256 aRequired = _amountB * currentRate;
        aToken.burnFrom(msg.sender, aRequired);
        bToken.mint(msg.sender, _amountB);
    }
}
