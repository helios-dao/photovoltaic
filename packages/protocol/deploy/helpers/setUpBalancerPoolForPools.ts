// requiring hardhat gives instance of hre
const { getContractAddress, getMeta} = require('./helpers.ts');

const setUpBalancerPoolForPools = async(usdcAmount, hlsAmount) => {
    const CHAIN_ID = 80001;
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const TX = { gasLimit: 300000 };

    let bPoolAddress;
    bPoolAddress = await getContractAddress('BPool', CHAIN_ID);
    const heliosGlobals = await hre.ethers.getContract('HeliosGlobals');

    // If we already have an address for the BPool, exit.
    if (bPoolAddress) {
        console.log("Already have a bPoolAddress at:", bPoolAddress)
        return;
    }
    let bPoolFactoryAddress = await getContractAddress('BPoolFactory', CHAIN_ID);
    const bPoolFactoryMeta = getMeta('BPoolFactory');
    const USDCMeta = getMeta('USDC');
    const usdcAddress = await getContractAddress('USDC', CHAIN_ID);
    const usdc = await hre.ethers.getContractAt('FakeUSDC', usdcAddress);  // Real USDC and ERC20 have same ABI.
    console.log('USDC address:', usdcAddress);

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
    console.log('Going to fetch contracts..')
    const bPoolFactory = await hre.ethers.getContractAt(bPoolFactoryMeta.abi, bPoolFactoryAddress);
    const heliosToken = await hre.ethers.getContract('HeliosToken');

    let bPool;
    try {
        console.log('Creating BPool...');
        const bPoolWait = await (await bPoolFactory.newBPool()).wait();
        bPoolAddress = bPoolWait.logs[1].address;
        bPool = await hre.ethers.getContractAt(getMeta('BPool').abi, bPoolAddress);
        console.log(`Created BPool at ${bPoolAddress}`);
    } catch (error) {
        console.log(error.toString);
    };

    console.log('Initializing USDC/HLS Balancer pool');
    try {
        console.log('Bind USDC');
        await usdc.approve(bPool.address, usdcAmount, TX);
        await bPool.bind(usdc.address, usdcAmount, hre.ethers.BigNumber.from('5000000000000000000'), TX);
        console.log('Bind HLS');
        await heliosToken.approve(bPool.address, hlsAmount, TX);
        await bPool.bind(heliosGlobals.hls(), hlsAmount, hre.ethers.BigNumber.from('5000000000000000000'), TX);

        const hlsBalance = heliosToken.balanceOf(bPoolAddress);
        const usdcBalance = heliosToken.balanceOf(bPoolAddress);
        console.log(`hlsBalance=${hlsBalance}`);
        console.log(`usdcBalance=${hlsBalance}`);
    } catch (error) {
        console.log(`Error binding USDC/HLS to BPool`);
        console.log(error.error.toString);
    }

    console.log('Finalize')
    await bPool.finalize(TX);

    console.log('setValidBalancerPool');
    await heliosGlobals.setValidBalancerPool(bPool.address, true, TX);
    return bPool.address;
};

module.exports = {
    setUpBalancerPoolForPools
};
