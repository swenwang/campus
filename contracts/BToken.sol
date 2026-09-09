// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100 * 10 ** 18;

    constructor() ERC20("BetaToken", "BTK") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
