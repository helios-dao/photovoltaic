const { getContractAddress } = require('./../helpers/helpers.ts');

// Deploys all the contracts.
module.exports = async ({
  getChainId,
  getNamedAccounts,
  deployments
}) => {
  const { deploy } = deployments;
  const {
    deployer,
    globalAdmin,
    governor,
    oracleOwner,
  } = await getNamedAccounts();

  let deployedContracts = {};

  const deployContract = async ({ name, args = [], libraries = {}}) => {
    console.log(`Deploying ${name}...`, 'args: ', args, 'libraries: ', libraries);
    const contract = await deploy(name, {
      from: deployer,
      args,
      libraries
    });
    deployedContracts[name] = contract.address;
    console.log(`Deployed ${name} at ${contract.address}`);
  };

  // Locally, we want to deploy a fake USDC contract so we can easily mint tokens for
  // ourselves.
  const chainId = await getChainId();
  if (chainId == 1337) {
    await deployContract({ name: 'FakeUSDC', args: [hre.ethers.utils.parseEther("1000000.0").toString()] })
  }

  const CHAINLINK_USD_WBTC_AGGREGATOR = process.env.CHAINLINK_USD_WBTC_AGGREGATOR;  // chainlink USD-WBTC contract
  const LATE_FEE = 0;
  const PREMIUM_FEE = 0;
  const TOKEN_NAME = 'Helios Token';  // token name
  const TOKEN_SYMBOL = 'HLS';  // token symbol
  const TOKEN_AMOUNT = 1;   // amount to mint
  const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER;  // uniswap router contract
  const usdcAddress = await getContractAddress('USDC', chainId);  // USD token contract
  const wbtcAddress = await getContractAddress('WBTC', chainId);  // WBTC token contract

  const CONTRACTS = [
    {
      name: 'HeliosToken',
      args: [TOKEN_NAME, TOKEN_SYMBOL, usdcAddress, TOKEN_AMOUNT]
    },
    {
      name: 'HeliosGlobals',
      args: [governor, 'HeliosToken', globalAdmin]
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
      args: ['HeliosGlobals'],
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
      args: ['HeliosGlobals'],
      libs: ['LoanLib', 'Util']
    },
    {
      name: 'HlsRewardsFactory',
      args: ['HeliosGlobals'],
    },
    {
      name: 'UsdOracle'
    },
    {
      name: 'ChainlinkOracle',
      args: [CHAINLINK_USD_WBTC_AGGREGATOR, wbtcAddress, oracleOwner]
    },
    {
      name: 'HeliosTreasury',
      args: ['HeliosToken', usdcAddress, UNISWAP_ROUTER, 'HeliosGlobals'],
      libs: ['Util']
    },
    {
      name: 'RepaymentCalc'
    },
    {
      name: 'LateFeeCalc',
      args: [LATE_FEE]
    },
    {
      name: 'PremiumCalc',
      args: [PREMIUM_FEE]
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
