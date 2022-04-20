const fs = require('fs');
const path = require('path');

const getAbi = (contractName) => {
  const fullPath = path.resolve(__dirname, './../abi/' + contractName + '.json');
  const json = fs.readFileSync(fullPath);
  return JSON.parse(json);
};

const getUSDCAddress = async () => {
  try {
    const contract = await hre.ethers.getContract('FakeUSDC');
    return contract.address;
  } catch {
    return process.env.USD_TOKEN;
  }
}

module.exports = {
  getAbi,
  getUSDCAddress
};