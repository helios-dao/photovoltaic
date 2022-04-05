// import { network } from "hardhat";

module.exports = async ({
  getNamedAccounts,
  deployments,
  network
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let deployedContracts = {};

  const deployContract = async ({ name, args = [], libraries = {}}) => {
    console.log(`Deploying ${name}...`, 'args: ', args, 'libraries: ', libraries);
    const contract = await deploy(name, {
      from: deployer,
      // gasLimit: 4000000,
      args,
      libraries,
    });
    deployedContracts[name] = contract.address;
    console.log(`Deployed ${name} at ${contract.address}`);
  };

  const governor = deployer;  // proxy contract
  const mplToken = deployer;  // helios token contract
  const globalAdmin = deployer;  // proxy contract
  const aggregator = deployer;  // chainlink USD-WBTC contract
  const assetAddress = deployer;  // WBTC token contract
  const owner = deployer;  // proxy contract
  const fundsToken = deployer;  // USD token contract
  const uniswapRouter = deployer;  // uniswap router contract
  const lateFee = 0;
  const premiumFee = 0;

  const CONTRACTS = [
    {
      name: 'MapleGlobals',
      args: [governor, mplToken, globalAdmin]
    },
    {
      name: 'PoolLib'
    },
    {
      name: 'Util'
    },
    {
      name: 'LoanLib',
      libs: ['Util']
    },
    {
      name: 'PoolFactory',
      args: ['MapleGlobals'],
      libs: ['PoolLib']
    },
    {
      name: 'StakeLockerFactory'
    },
    {
      name: 'LiquidityLockerFactory'
    },
    {
      name: 'DebtLockerFactory'
    },
    {
      name: 'CollateralLockerFactory'
    },
    {
      name: 'FundingLockerFactory'
    },
    {
      name: 'LoanFactory',
      args: ['MapleGlobals'],
      libs: ['LoanLib', 'Util']
    },
    {
      name: 'MplRewardsFactory',
      args: ['MapleGlobals'],
    },
    {
      name: 'UsdOracle'
    },
    {
      name: 'ChainlinkOracle',
      args: [aggregator, assetAddress, owner]
    },
    {
      name: 'MapleTreasury',
      args: [mplToken, fundsToken, uniswapRouter, 'MapleGlobals'],
      libs: ['Util']
    },
    {
      name: 'RepaymentCalc'
    },
    {
      name: 'LateFeeCalc',
      args: [lateFee]
    },
    {
      name: 'PremiumCalc',
      args: [premiumFee]
    },
  ];

  for (let contract of CONTRACTS) {
    const args = (contract.args || []).map(arg => {
      return (arg in deployedContracts)
        ? deployedContracts[arg]
        : arg;
    });
    const libraries = (contract.libs || []).reduce((arr, libName) => {
      arr[libName] = deployedContracts[libName];
      return arr;
    }, {})
    await deployContract({
      name: contract.name,
      args,
      libraries
    });
  }
};
