/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('dotenv-flow').config();
require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
// require('hardhat-contract-sizer');

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.12"
      },
      {
        version: "0.6.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ]
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
    mumbai: {
      chainId: 80001,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      verify: {
        etherscan: {
          apiUrl: "https://api-testnet.polygonscan.com",
          license: "AGPL-3.0",
          forceLicense: true,
          sleep: true
        }
      },
      url: process.env.ALCHEMY_MUMBAI_URL
    },
    rinkeby: {
      chainId: 4,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      verify: {
        etherscan: {
          apiUrl: "https://api-rinkeby.etherscan.io",
          license: "AGPL-3.0",
          forceLicense: true,
          sleep: true
        }
      },
      url: process.env.ALCHEMY_RINKEBY_URL
    },
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
      forking: {
        enabled: true,
        url: process.env.ALCHEMY_MUMBAI_URL
      },
    }
  },
  paths: {
    sources: "./contracts",
    deploy: "./deploy/scripts"
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
