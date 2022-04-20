const { getUSDCAddress } = require('./../helpers/helpers.ts');

// Sets all the necessary variables in HeliosGlobals
module.exports = async ({
}) => {
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
  const usdcToken = await getUSDCAddress();

  console.log('setValidPoolFactory');
  await heliosGlobals.setValidPoolFactory(poolFactory.address, true);
  await heliosGlobals.setValidSubFactory(poolFactory.address, liquidityLockerFactory.address, true);
  await heliosGlobals.setValidSubFactory(poolFactory.address, stakeLockerFactory.address, true);
  await heliosGlobals.setValidSubFactory(poolFactory.address, debtLockerFactory.address, true);
  console.log('setValidLoanFactory');
  await heliosGlobals.setValidLoanFactory(loanFactory.address, true);
  await heliosGlobals.setValidSubFactory(loanFactory.address, fundingLockerFactory.address, true);
  await heliosGlobals.setValidSubFactory(loanFactory.address, collateralLockerFactory.address, true);
  console.log('setLiquidityAsset');
  await heliosGlobals.setLiquidityAsset(usdcToken, true);
  console.log('setCollateralAsset');
  await heliosGlobals.setCollateralAsset(usdcToken, true);
  await heliosGlobals.setCollateralAsset(process.env.WBTC_TOKEN, true);
  console.log('setPoolDelegateAllowlist');
  await heliosGlobals.setPoolDelegateAllowlist(process.env.DEFAULT_POOL_DELEGATE, true);
  console.log('setCalc');
  await heliosGlobals.setCalc(lateFeeCalc.address, true);
  await heliosGlobals.setCalc(premiumCalc.address, true);
  await heliosGlobals.setCalc(repaymentCalc.address, true);
  console.log('setHeliosTreasury');
  await heliosGlobals.setHeliosTreasury(heliosTreasury.address);
  console.log('setPriceOracle');
  await heliosGlobals.setPriceOracle(usdcToken, usdOracle.address);
  await heliosGlobals.setPriceOracle(process.env.WBTC_TOKEN, wbtcOracle.address);
  console.log('setDefaultUniswapPath');
  await heliosGlobals.setDefaultUniswapPath(process.env.WBTC_TOKEN, usdcToken, usdcToken);
  if (process.env.BALANCER_POOL) {
    console.log('setValidBalancerPool');
    await heliosGlobals.setValidBalancerPool(process.env.BALANCER_POOL, true);
  }
};
