# Deploy
Protocol leverages [hardhat-deploy-ethers](https://github.com/wighawag/hardhat-deploy-ethers) library to deploy contracts.

- This plugins adds an `ethers` object to the Hardhat Runtime Environment.
- Some helpful commands to call on `ethers` object
    - `function getContractAt(nameOsrAbi: string | any[], address: string, signer?: ethers.Signer | string): Promise<ethers.Contract>;`
    - `function getContract(deploymentName: string, signer?: ethers.Signer | string): Promise<ethers.Contract>;`
    - `function getContractOrNull(deploymentName: string, signer?: ethers.Signer | string): Promise<ethers.Contract | null>;`

Hardhat comes built-in with Hardhat Network, a local Ethereum network node designed for development.
To deploy to local Hardhat network node, run
``` yarn hardhat node``` from root of protocol. If you want to see debug logs, add the `--verbose` flag.

Note: Hardhat doesn’t keep track of your deployed contracts. Make sure to log the deployed address in scripts. This will be useful when interacting with them programmatically.

## Debugging
If you reach a heap OOM error, try running <br>
```yarn hardhat clean & yarn hardhat node; ```

If you get a connection error, make sure you are running a local blockchain in another terminal.

Remember that local blockchains do not persist their state throughout multiple runs! If you close your local blockchain process, you’ll have to re-deploy your contracts.

## Interacting with Contracts

Startup the hardhat console by
``` npx hardhat console --network localhost```

Example commands:
> const Box = await ethers.getContractFactory('Box');
undefined
> const box = await Box.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3')
undefined

## Deploying to Rinkeby

Create an `.env` file in the root directory and add the following:

```
CHAINLINK_USD_WBTC_AGGREGATOR=0xECe365B379E1dD183B20fc5f022230C044d51404
UNISWAP_ROUTER=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
USD_TOKEN=0x553D0a8807f8E325671Ce953a4D00883CCE1ee56
WBTC_TOKEN=0xBa711fCa79c559EC8D98c39a81876105A6C0cefa
WBTC_ORACLE_OWNER=
PROTOCOL_GOVERNOR=
PROTOCOL_GLOBAL_ADMIN=
DEPLOYER_ADDRESS=
DEPLOYER_PRIVATE_KEY=
```

`WBTC_ORACLE_OWNER`, `WBTC_ORACLE_OWNER`, `PROTOCOL_GOVERNOR`, and `PROTOCOL_GLOBAL_ADMIN` should be your own MetaMask wallet address, and `DEPLOYER_PRIVATE_KEY` should its private key. Alternatively (and this is what we'll need to do on Mainnet) go to [https://gnosis-safe.io](https://gnosis-safe.io) and create a safe for each of those.

Then run: <br>
``` yarn hardhat deploy --network rinkeby ```

## Verifying the source code on Etherscan

Get an API key from Etherscan and add it to your `.env` under `ETHERSCAN_API_KEY`. Then run: <br>
``` yarn hardhat etherscan-verify --network rinkeby --license "AGPL-3.0" --force-license --sleep ```
