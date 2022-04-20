// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FakeUSDC is ERC20("USD Coin", "USDC") {
  constructor(uint256 initialSupply) public {
    _setupDecimals(6);
    _mint(msg.sender, initialSupply);
  }
}
