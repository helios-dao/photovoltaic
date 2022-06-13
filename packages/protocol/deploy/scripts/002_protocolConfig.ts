const { getContractAddress } = require('./../helpers/helpers.ts');
const {setUpBalancerPoolForPools} = require('./../helpers/setUpBalancerPoolForPools.ts')

// Sets all the necessary variables in HeliosGlobals

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

  const chainId = await getChainId();
  const heliosGlobals = await hre.ethers.getContract('HeliosGlobals');
  const poolFactory = await hre.ethers.getContract('PoolFactory');
  const loanFactory = await hre.ethers.getContract('LoanFactory');
  const fundingLockerFactory = await hre.ethers.getContract('FundingLockerFactory');
  const collateralLockerFactory = await hre.ethers.getContract('CollateralLockerFactory');
  const liquidityLockerFactory = await hre.ethers.getContract('LiquidityLockerFactory');
  const stakeLockerFactory = await hre.ethers.getContract('StakeLockerFactory');
  const debtLockerFactory = await hre.ethers.getContract('DebtLockerFactory');
  const lateFeeCalc = await hre.ethers.getContract('LateFeeCalc');
  const premiumCalc = await hre.ethers.getContract('PremiumCalc');
  const repaymentCalc = await hre.ethers.getContract('RepaymentCalc');
  const heliosTreasury = await hre.ethers.getContract('HeliosTreasury');
  const usdOracle = await hre.ethers.getContract('UsdOracle');
  const wbtcOracle = await hre.ethers.getContract('ChainlinkOracle');
  const usdcAddress = await getContractAddress('USDC', chainId);
  const usdc = await hre.ethers.getContractAt('FakeUSDC', usdcAddress);  // Real USDC and ERC20 have same ABI.
  console.log('USDC address:', usdcAddress);
  const wbtcAddress = await getContractAddress('WBTC', chainId);
  const heliosToken = await hre.ethers.getContract('HeliosToken');


  const TX = { gasLimit: 100000 };
  

  console.log('setValidPoolFactory');
  await heliosGlobals.setValidPoolFactory(poolFactory.address, true, TX);
  await heliosGlobals.setValidSubFactory(poolFactory.address, liquidityLockerFactory.address, true, TX);
  await heliosGlobals.setValidSubFactory(poolFactory.address, stakeLockerFactory.address, true, TX);
  await heliosGlobals.setValidSubFactory(poolFactory.address, debtLockerFactory.address, true, TX);
  console.log('setValidLoanFactory');
  await heliosGlobals.setValidLoanFactory(loanFactory.address, true, TX);
  await heliosGlobals.setValidSubFactory(loanFactory.address, fundingLockerFactory.address, true, TX);
  await heliosGlobals.setValidSubFactory(loanFactory.address, collateralLockerFactory.address, true, TX);
  console.log('setLiquidityAsset');
  await heliosGlobals.setLiquidityAsset(usdcAddress, true, TX);
  console.log('setCollateralAsset');
  await heliosGlobals.setCollateralAsset(usdcAddress, true, TX);
  await heliosGlobals.setCollateralAsset(wbtcAddress, true, TX);
  console.log('setPoolDelegateAllowlist');
  await heliosGlobals.setPoolDelegateAllowlist(process.env.DEFAULT_POOL_DELEGATE, true, TX);
  console.log('setCalc');
  await heliosGlobals.setCalc(lateFeeCalc.address, true, TX);
  await heliosGlobals.setCalc(premiumCalc.address, true, TX);
  await heliosGlobals.setCalc(repaymentCalc.address, true, TX);
  console.log('setHeliosTreasury');
  await heliosGlobals.setHeliosTreasury(heliosTreasury.address, TX);
  console.log('setPriceOracle');
  await heliosGlobals.setPriceOracle(usdcAddress, usdOracle.address, TX);
  await heliosGlobals.setPriceOracle(wbtcAddress, wbtcOracle.address, TX);
  console.log('setDefaultUniswapPath');
  await heliosGlobals.setDefaultUniswapPath(wbtcAddress, usdcAddress, usdcAddress, TX);

  const bPoolAddress = await getContractAddress('BPool', chainId);
  
  if (bPoolAddress) {
    console.log('BPoolAddress found.');
    const hlsBalance = await heliosToken.balanceOf(bPoolAddress);
    console.log(`hlsBalance=${hlsBalance}`);
    console.log(`bPoolAddress:`, bPoolAddress);
    await heliosGlobals.setValidBalancerPool(bPoolAddress, true, TX);
    const isValidBP = await heliosGlobals.isValidBalancerPool(bPoolAddress);
    console.log(`isValidBalancerPool=${isValidBP}`);
  }
  else{ 
    const usdcAmount = '1000000';
    if (chainId == 1337 || chainId == 80001) {
      // Mint fake USDC if testnet or localhost to fund balancer pool
      const usdcPrecision = hre.ethers.BigNumber.from(usdcAmount);  // USDC has 6 decimals
      const account = process.env.DEFAULT_POOL_DELEGATE;
      console.log(`Minting USDC into ${account} wallet`);
      const result = usdc.approve(account, usdcPrecision).then((tx) => {
        return tx.wait().then((receipt) => {
            return true;
        }, (err) => {
            const code = err.data.replace('Reverted ','');
            console.log({err});
            let reason = hre.ethers.utils.toUtf8String('0x' + code.substr(138));
            console.log('revert reason:', reason);
            return false;
          
        })
    });
  };
    const hlsAmount = '1000000000000000000'; // HLS has 18 decimals
    const bPoolAddress = await setUpBalancerPoolForPools(usdcAmount, hlsAmount);
    console.log('BPool successfully finalized at:', bPoolAddress)
    }
};
