module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // the following will only deploy "GenericMetaTxProcessor" if the contract was never deployed or if the code changed since last deployment
  const d = await deploy('MapleToken', {
    from: deployer,
    gasLimit: 4000000,
    args: ['Token', 'TOK', deployer],
  });
  console.log('MapleToken:', d.address)
};