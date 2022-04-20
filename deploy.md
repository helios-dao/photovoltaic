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
ALCHEMY_KEY=
DEFAULT_POOL_DELEGATE=
BPOOL_FACTORY=0x9C84391B443ea3a48788079a5f98e2EaD55c9309
```

`WBTC_ORACLE_OWNER`, `WBTC_ORACLE_OWNER`, `PROTOCOL_GOVERNOR`, `PROTOCOL_GLOBAL_ADMIN` and `DEFAULT_POOL_DELEGATE` should be your own MetaMask wallet address, and `DEPLOYER_PRIVATE_KEY` should be its private key. Alternatively (and this is what we'll need to do on Mainnet) go to [https://gnosis-safe.io](https://gnosis-safe.io) and create a safe for each of those.

Get an account on Alchemy, create a node on Rinkeby, and set `ALCHEMY_KEY` to the API key.

Then run: <br>
``` yarn hardhat deploy --network rinkeby ```

## Verifying the source code on Etherscan

Get an API key from Etherscan and add it to your `.env` under `ETHERSCAN_API_KEY`. Then run: <br>
``` yarn hardhat etherscan-verify --network rinkeby --license "AGPL-3.0" --force-license --sleep ```

## Current state

The deploy scripts are currently tested locally only. They will fork Rinkeby, deploy all the contracts, set the config, and create + fund a balancer pool. Once the local network is running (`yarn localnode`), you can play in the console (`yarn hardhat console --network localhost`) with the functions in `deploy/helpers/testing.ts`. Go in order:

1. `createPool(bPoolAddress)` (you'll see `bPoolAddress` in the node's logs)
2. `deposit(poolAddress, amount)` (`poolAddress` is outputed by the previous function, `amount` is up to you)
3. `createLoan(poolAddress, amount)` (same as above)

If all this works, you've created + funded a pool, and created + funded a loan from said pool!
