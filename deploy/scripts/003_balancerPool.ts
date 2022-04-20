const { getAbi, getUSDCAddress } = require('./../helpers/helpers.ts');

// This script deploys the Balancer pool, which is needed to create investment pools.
// It only does it locally since otherwise you should use the Balancer app.
module.exports = async ({
  getChainId,
}) => {
  const chainId = await getChainId();
  if (chainId != 1337) return;

  const bPoolFactory = await hre.ethers.getContractAt(getAbi('BPoolFactory'), process.env.BPOOL_FACTORY);
  const heliosGlobals = await hre.ethers.getContract('HeliosGlobals');
  const heliosToken = await hre.ethers.getContract('HeliosToken');
  const usdcToken = await hre.ethers.getContract('FakeUSDC');

  const bPoolWait = await (await bPoolFactory.newBPool()).wait();
  const bPoolAddress = bPoolWait.logs[1].address;
  const bPool = await hre.ethers.getContractAt(getAbi('BPool'), bPoolAddress);
  console.log(`Created BPool at ${bPoolAddress}`);

  console.log('Bind USD')
  const usdcAmount = hre.ethers.BigNumber.from('1000000');  // USDC has 6 decimals
  await usdcToken.approve(bPool.address, usdcAmount);
  await bPool.bind(usdcToken.address, usdcAmount, hre.ethers.BigNumber.from('5000000000000000000'));
  console.log('Bind HLS')
  const hlsAmount = hre.ethers.BigNumber.from('1000000000000000000');  // HLS has 18 decimals
  await heliosToken.approve(bPool.address, hlsAmount);
  await bPool.bind(heliosGlobals.hls(), hlsAmount, hre.ethers.BigNumber.from('5000000000000000000'));
  console.log('Finalize')
  await bPool.finalize();

  console.log('setValidBalancerPool');
  await heliosGlobals.setValidBalancerPool(bPool.address, true);
};
