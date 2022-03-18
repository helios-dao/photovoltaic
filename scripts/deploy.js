// scripts/deploy.js

const fs = require('fs');

async function main () {  // We receive the contract to deploy
  const contractName = 'TestUtil' // Change this for other contract
  const constructorArgs = []    // Put constructor args (if any) here for your contract

  // Note that the script needs the ABI which is generated from the compilation artifact.
  // Make sure contract is compiled and artifacts are generated
  //artifacts/packages/protocol/contracts/test/TestUtil.sol/TestUtil.json
  const artifactsPath = `artifacts/packages/protocol/contracts/test/${contractName}.sol/${contractName}.json` // Change this for different path

  const metadata = JSON.parse(fs.readFileSync(artifactsPath).toString());

  // 'web3Provider' is a remix global variable object
  // const signer = (new ethers.providers.Web3Provider(web3Provider)).getSigner()

  let factory = new ethers.ContractFactory(metadata.abi, metadata.deployedBytecode);//, signer);

  let contract = await factory.deploy(...constructorArgs);
  console.log('TestUtil deployed to:', contract.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});