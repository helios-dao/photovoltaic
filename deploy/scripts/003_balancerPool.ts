const { getMeta, getContractAddress } = require('./../helpers/helpers.ts');

// This script deploys the Balancer pool, which is needed to create investment pools.
// It only does it locally since otherwise you should use the Balancer app.
module.exports = async ({
  getChainId,
  getNamedAccounts,
  deployments
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const heliosGlobals = await hre.ethers.getContract('HeliosGlobals');

  let bPoolAddress;
  bPoolAddress = await getContractAddress('BPool', chainId);

  // If we already have an address for the BPool, exit.
  if (bPoolAddress) {
    return;
  }

  let bPoolFactoryAddress = await getContractAddress('BPoolFactory', chainId);
  const bPoolFactoryMeta = getMeta('BPoolFactory');
  if (!bPoolFactoryAddress) {
    const contract = await deploy('BFactory', {
      contract: {
        abi: bPoolFactoryMeta.abi,
        bytecode: bPoolFactoryMeta.bytecode
      },
      from: deployer
    });
    console.log(`Deployed BFactory at ${contract.address}`);
    bPoolFactoryAddress = contract.address;
  }
  const bPoolFactory = await hre.ethers.getContractAt(bPoolFactoryMeta.abi, bPoolFactoryAddress);
  const heliosToken = await hre.ethers.getContract('HeliosToken');
  const usdcAddress = await getContractAddress('USDC', chainId);
  const usdcToken = await hre.ethers.getContractAt('FakeUSDC', usdcAddress);  // Real USDC and FakeUSDC have same ABI.

  const TX = { gasLimit: 100000 };

  const bPoolWait = await (await bPoolFactory.newBPool()).wait();
  bPoolAddress = bPoolWait.logs[1].address;
  const bPool = await hre.ethers.getContractAt(getMeta('BPool').abi, bPoolAddress);
  console.log(`Created BPool at ${bPoolAddress}`);

  console.log('Bind USD')
  const usdcAmount = hre.ethers.BigNumber.from('1000000');  // USDC has 6 decimals
  await usdcToken.approve(bPool.address, usdcAmount, TX);
  await bPool.bind(usdcToken.address, usdcAmount, hre.ethers.BigNumber.from('5000000000000000000'), TX);
  console.log('Bind HLS')
  const hlsAmount = hre.ethers.BigNumber.from('1000000000000000000');  // HLS has 18 decimals
  await heliosToken.approve(bPool.address, hlsAmount, TX);
  await bPool.bind(heliosGlobals.hls(), hlsAmount, hre.ethers.BigNumber.from('5000000000000000000'), TX);
  console.log('Finalize')
  await bPool.finalize(TX);

  console.log('setValidBalancerPool');
  await heliosGlobals.setValidBalancerPool(bPool.address, true, TX);
};
