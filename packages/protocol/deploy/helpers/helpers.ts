const fs = require('fs');
const path = require('path');

const getMeta = (contractName) => {
  const fullPath = path.resolve(__dirname, './../meta/' + contractName + '.json');
  const json = fs.readFileSync(fullPath);
  return JSON.parse(json);
};

const CONTRACTS = {
  'BPool': {
    80001: '0xE4598983Ba40eBbB5c60e91241b240c259ed53F1'
  },
  'BPoolFactory': {
    4: '0x9C84391B443ea3a48788079a5f98e2EaD55c9309',
    1337: '0x9C84391B443ea3a48788079a5f98e2EaD55c9309',
    80001: '0x375dfeFf7147238787F6C30a6A734f5704D326aa'
  },
  'USDC': {
    1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    4: '0x553D0a8807f8E325671Ce953a4D00883CCE1ee56',
    137: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    1337: '0x553D0a8807f8E325671Ce953a4D00883CCE1ee56',
    80001: '0x4a3443686285ba1d857107159D3c27f85Ac9267f',
  },
  'WBTC': {
    4: '0xBa711fCa79c559EC8D98c39a81876105A6C0cefa',
    1337: '0xBa711fCa79c559EC8D98c39a81876105A6C0cefa',
    80001: '0xb4a45b6715f6b47e6b76b8984f75f4634083474f'
  },
  'WETH': {
    4: '0x464Fd1dE206cB8ed2Ee77f100dd75CaEdF1F9738',
    1337: '0x464Fd1dE206cB8ed2Ee77f100dd75CaEdF1F9738',
    80001: '0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa',
  }
};

const getContractAddress = async (contractName, chainId) => {
  const address = CONTRACTS[contractName][chainId];
  if (address) return address;

  if (contractName !== 'USDC') return;

  try {
    const contract = await hre.ethers.getContract('FakeUSDC');
    return contract.address;
  } catch {
    return process.env.USD_TOKEN;
  }
}

module.exports = {
  getMeta,
  getContractAddress
};