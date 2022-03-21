module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const d = await deploy('MapleGlobals', {
    from: deployer,
    gasLimit: 4000000,
    args: ['0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', deployer, deployer],
  });
  console.log('MapleGlobals:', d.address)
};