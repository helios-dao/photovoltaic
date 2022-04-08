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
