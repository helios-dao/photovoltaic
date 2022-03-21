// scripts/deploy.js

const fs = require('fs');
const { ethers } = require('hardhat');

async function main () {  // We receive the contract to deploy
  const contractName = 'CollateralLocker2' // Change this for other contract
  const constructorArgs = ['0x0', '0x0']    // Put constructor args (if any) here for your contract

  // Note that the script needs the ABI which is generated from the compilation artifact.
  // Make sure contract is compiled and artifacts are generated
  //artifacts/packages/protocol/contracts/test/TestUtil.sol/TestUtil.json
  const artifactsPath = `artifacts/packages/protocol/contracts/${contractName}.sol/${contractName}.json` // Change this for different path

  const metadata = JSON.parse(fs.readFileSync(artifactsPath).toString());

  // 'web3Provider' is a remix global variable object
  // const signer = (new ethers.providers.Web3Provider(web3Provider)).getSigner()
  console.log('yo')
  const signer = (await ethers.getSigners())[0];
  console.log( 'signer', signer)

  let factory = new ethers.ContractFactory(metadata.abi, metadata.bytecode, signer);
  // const factory = await ethers.getContractFactory('CollateralLocker');

  let contract = await factory.deploy(...constructorArgs);
  console.log('TestUtil deployed to:', contract.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});