/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// require('@openzeppelin/hardhat-upgrades');
require('dotenv-flow').config();
require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');

module.exports = {
  solidity: {
    version: "0.6.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
  contractSizer: {
    except: [
      ":Loan$",
      ":Pool$",
      ":StakeLocker$",
      "Test",
      "test",
    ],
    runOnCompile: true
  },
  networks: {
    rinkeby: {
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      verify: {
        etherscan: {
          apiUrl: "https://api-rinkeby.etherscan.io",
          license: "AGPL-3.0",
          forceLicense: true,
          sleep: true
        }
      },
      url: "https://eth-rinkeby.alchemyapi.io/v2/KE1qQBCNVse9h7NAa_re7cfQWtaZy1ix"
    },
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true
    }
  },
  paths: {
    sources: "./packages/protocol/contracts",
    deploy: "./deploy"
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: process.env.DEPLOYER_ADDRESS,
      4: process.env.DEPLOYER_ADDRESS
    },
    globalAdmin: {
      default: 0,
      1: process.env.PROTOCOL_GLOBAL_ADMIN
    },
    governor: {
      default: 0,
      1: process.env.PROTOCOL_GOVERNOR
    },
    oracleOwner: {
      default: 0,
      1: process.env.WBTC_ORACLE_OWNER
    }
  }
};
