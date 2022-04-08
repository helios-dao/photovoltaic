// scripts/index.js
const hre = require("hardhat");
const ethers = hre.ethers;

async function main () {
    // Retrieve accounts from the local node
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);

    // Set up an ethers contract, representing our deployed MapleGlobals instance
    const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const MapleGlobals = await ethers.getContractFactory('MapleGlobals');
    const mapleGlobals = await MapleGlobals.attach(address);
    console.log(mapleGlobals);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
 });