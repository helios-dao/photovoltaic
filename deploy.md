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

## Deploying to Rinkeby (Ethereum testnet) or Mumbai (Polygon testnet)

Create an `.env` file in the root directory and add the following:

```
CHAINLINK_USD_WBTC_AGGREGATOR=0xECe365B379E1dD183B20fc5f022230C044d51404
UNISWAP_ROUTER=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
WBTC_ORACLE_OWNER=
PROTOCOL_GOVERNOR=
PROTOCOL_GLOBAL_ADMIN=
DEPLOYER_ADDRESS=
DEPLOYER_PRIVATE_KEY=
ALCHEMY_RINKEBY_URL=
ALCHEMY_MUMBAI_URL=
DEFAULT_POOL_DELEGATE=
```

`WBTC_ORACLE_OWNER`, `WBTC_ORACLE_OWNER`, `PROTOCOL_GOVERNOR`, `PROTOCOL_GLOBAL_ADMIN` and `DEFAULT_POOL_DELEGATE` should be your own MetaMask wallet address, and `DEPLOYER_PRIVATE_KEY` should be its private key. Alternatively (and this is what we'll need to do on Mainnet) go to [https://gnosis-safe.io](https://gnosis-safe.io) and create a safe for each of those.

Get an account on Alchemy, create a node on Rinkeby or Mumbai, and set `ALCHEMY_RINKEBY_URL` or `ALCHEMY_MUMBAI_URL` to the URL.

If you need to add Mumbai or Polygon Mainnet to your metamask, the easiest way to get it done is by searching “MATIC” on Chainlist and clicking “Add To Metamask” on “Matic (Polygon) Testnet Mumbai”, and you are good to go.

If you need tokens for gas fees, go to a faucet and request tokens.
Polygon: https://faucet.polygon.technology/

hardhat-deploy allows you to write deploy scripts in the deploy folder. Each of these files that look as follows will be executed in turn when you execute the following task: hardhat --network <networkName> deploy

To deploy to a network, run: <br>
``` yarn hardhat deploy --network rinkeby ``` or ``` yarn hardhat deploy --network mumbai ```

## Verifying the source code on Etherscan

Get an API key from Etherscan and add it to your `.env` under `ETHERSCAN_API_KEY`. Then run: <br>
``` yarn hardhat etherscan-verify --network rinkeby --license "AGPL-3.0" --force-license --sleep ```

## Current state

The deploy scripts are currently tested locally only. They will fork Rinkeby, deploy all the contracts, set the config, and create + fund a balancer pool. Once the local network is running (`yarn localnode`), you can play in the console (`yarn hardhat console --network localhost`) manually or with the functions in `deploy/helpers/testing.ts`. 

### Manually
Example:
```
const heliosGlobals = await hre.ethers.getContract('HeliosGlobals');
await heliosGlobals.hls()
//'0x0b932e28000A132fd25A36795f4Fd5F4557693DA'
await globals.isValidPoolFactory("0xE7E4320c9b36cC3E0CD2b6Cac56A4ca10A7A89DE");
false
```


### Using functions
Go in order:

1. `createPool(bPoolAddress)` (you'll see `bPoolAddress` in the node's logs)
2. `deposit(poolAddress, amount)` (`poolAddress` is outputed by the previous function, `amount` is up to you)
3. `createLoan(poolAddress, amount)` (same as above)

If all this works, you've created + funded a pool, and created + funded a loan from said pool!

# Debugging

Error
If you see the following:
``` 
reason: 'insufficient funds for intrinsic transaction cost',
  code: 'INSUFFICIENT_FUNDS',
  error: ProviderError: insufficient funds for gas * price + value
```