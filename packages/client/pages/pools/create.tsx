import { Button } from "@components/button";
import abi from "contracts";
import addresses from "contracts/addresses";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BPOOL_ADDRESS, HELIOS_GLOBALS_ADDRESS, USDC_ADDRESS, LIQUIDITY_LOCKER_FACTORY_ADDRESS,POOL_FACTORY_ADDRESS, STAKE_LOCKER_FACTORY_ADDRESS } from "src/constants";
import { getContract, getNetworkName } from "src/utils";
import useWallet from "src/hooks/useWallet";
import useContract from "src/hooks/useContract";
import WalletWrapper from "@components/WalletWrapper";

// creates pool but does not initialize
// context: https://github.com/maple-labs/maple-core/wiki/Pool-Creation

export default function CreatePoolPage() { 

    const { account, network, signer, provider } = useWallet();
    const [isPoolDelegate, setIsPoolDelegate] = useState(false);

    const globals = useContract(HELIOS_GLOBALS_ADDRESS, abi.globals);
    const bPool = useContract(BPOOL_ADDRESS, abi.bPool);
    const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
    const slFactory = useContract(STAKE_LOCKER_FACTORY_ADDRESS, abi.stakeLockerFactory);
    const llFactory = useContract(LIQUIDITY_LOCKER_FACTORY_ADDRESS, abi.liquidityLockerFactory);
    const poolFactory = useContract(POOL_FACTORY_ADDRESS, abi.poolFactory);
  
    useEffect(() => {
      checkIfPoolDelegate();
    }, [account]);

    /*poolFactory.on("PoolCreated", (pool, delegate, liquidityAsset, stakeAsset, liquidityLocker, stakeLocker, stakingFee, delegateFee, liquidityCap, name, symbol) => {
      // Called when anyone changes the value
      console.log(pool);
      console.log(delegate);
  });
  */

    const checkIfPoolDelegate = async () => {
      if (account === null) {
          console.error("No account found")
          return;
      }
      if(globals === null){
        console.error("Cannot find HeliosGlobals contract instance") 
        return;
      }

      const isPoolDelegate =await globals?.isValidPoolDelegate(account);      
      setIsPoolDelegate(isPoolDelegate);
      };

  
    const createNewLiquidityPool = async () => {
      if(!signer){
        return;
      }
      
      if(!usdcToken || !poolFactory || !slFactory || !llFactory || !bPool){
        return;
      }

      if (!isPoolDelegate) {
        console.log("not a valid pool delegate");
        return(<h1>Sorry! You are not permissioned to create a pool.</h1>);
      }
      console.log("going to create pool on:", getNetworkName(network))   

      const index = await poolFactory.poolsCreated();    
    
      try {
        let tx = await poolFactory.createPool(usdcToken.address, bPool.address, slFactory.address, llFactory.address, 0, 0, 10 ** 13);
        console.log(tx.hash);
        // The operation is NOT complete yet; we must wait until it is mined
        await tx.wait();  
        console.log(tx.pool);
        
        const poolAddress = await poolFactory.pools(index);

        return <div>`Success! Pool created on ${network.name} address: ${poolAddress}`</div>
      } catch (error) {
          console.log(`Error creating pool: ${error}`)
          return <div>Error creating pool</div>;
      }
    };
    
    return(
        <>
        <div>
        <h3>Create a new Investment Pool on {getNetworkName(network)}</h3>
          <Link href="/">
            <a>&larr; Home</a>
          </Link>
        </div>
        
        <Button onClick={createNewLiquidityPool}>Create a new Pool</Button>
        </>
    );
  }
  
