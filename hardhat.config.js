/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// require('@openzeppelin/hardhat-upgrades');
require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require('hardhat-ethernal');

module.exports = {
  solidity: "0.6.11",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/KE1qQBCNVse9h7NAa_re7cfQWtaZy1ix"
    }
  },
  paths: {
    sources: "./packages/protocol/contracts",
    deploy: "./deploys/protocol"
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: '0xA296a3d5F026953e17F472B497eC29a5631FB51B' // but for rinkeby it will be a specific address
    }
  }
};
