# Deploy
Protocol leverages [hardhat-deploy-ethers](https://github.com/wighawag/hardhat-deploy-ethers) library to deploy contracts.

- This plugins adds an `ethers` object to the Hardhat Runtime Environment.
- Some helpful commands to call on `ethers` object
    - `function getContractAt(nameOsrAbi: string | any[], address: string, signer?: ethers.Signer | string): Promise<ethers.Contract>;`
    - `function getContract(deploymentName: string, signer?: ethers.Signer | string): Promise<ethers.Contract>;`
    - `function getContractOrNull(deploymentName: string, signer?: ethers.Signer | string): Promise<ethers.Contract | null>;`

To deploy to local Hardhat network node, run
``` yarn hardhat node ``` from root of protocol.

## Debugging
If you reach a heap OOM error, try running <br>
```yarn hardhat clean & yarn hardhat node; ```