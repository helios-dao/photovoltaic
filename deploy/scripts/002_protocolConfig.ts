const { getContractAddress } = require('./../helpers/helpers.ts');

// Sets all the necessary variables in HeliosGlobals
module.exports = async ({
  getChainId
}) => {
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
  const wbtcAddress = await getContractAddress('WETH', chainId);

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
    console.log('setValidBalancerPool');
    await heliosGlobals.setValidBalancerPool(bPoolAddress, true, TX);
  }
};
