/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// require('@openzeppelin/hardhat-upgrades');
require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.6.11",
  paths: {
    sources: "./packages/protocol/contracts"
  }
};
