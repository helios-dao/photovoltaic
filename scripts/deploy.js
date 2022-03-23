// scripts/deploy.js

const fs = require('fs');
const { hre } = require('hardhat');

async function main () {  // We receive the contract to deploy
  const contractName = 'MapleGlobals' // Change this for other contract
  const constructorArgs = ['0x0', '0x0']    // Put constructor args (if any) here for your contract

  // Note that the script needs the ABI which is generated from the compilation artifact.
  // Make sure contract is compiled and artifacts are generated
  //artifacts/packages/protocol/contracts/test/TestUtil.sol/TestUtil.json
  const artifactsPath = `artifacts/packages/protocol/contracts/${contractName}.sol/${contractName}.json` // Change this for different path

  const metadata = JSON.parse(fs.readFileSync(artifactsPath).toString());
  
  await hre.run('compile');
  let factory = new hre.ContractFactory(metadata.abi, metadata.bytecode, signer);

  let contract = await factory.deploy(...constructorArgs);
  await contract.deployed();

  console.log('TestUtil deployed to:', contract.address);

  console.log('Deploying to ethernal')
  await hre.ethernal.push({
    name: contract.name,
    address: contract.address
})

}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});