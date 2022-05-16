import { Button } from "@components/button";
import abi from "contracts";
import addresses from "contracts/addresses";
import { ethers } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BPOOL_ADDRESS, HELIOS_GLOBALS_ADDRESS, USDC_ADDRESS, LIQUIDITY_LOCKER_FACTORY_ADDRESS,POOL_FACTORY_ADDRESS, STAKE_LOCKER_FACTORY_ADDRESS } from "src/constants";
import { getContract } from "src/utils";
import useWallet from "src/hooks/useWallet";
import useContract from "src/hooks/useContract";



// creates pool but does not initialize
// context: https://github.com/maple-labs/maple-core/wiki/Pool-Creation

export default function CreatePoolPage() { 
    const router = useRouter();
    const { account } = useWallet();
    const [isPoolDelegate, setIsPoolDelegate] = useState(false);

    const globals = useContract(HELIOS_GLOBALS_ADDRESS, abi.globals);
    const bPool = useContract(BPOOL_ADDRESS, abi.bPool);
    const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
    const slFactory = useContract(STAKE_LOCKER_FACTORY_ADDRESS, abi.stakeLockerFactory);
    const llFactory = useContract(LIQUIDITY_LOCKER_FACTORY_ADDRESS, abi.liquidityLockerFactory);
    const poolFactory = useContract(POOL_FACTORY_ADDRESS, abi.poolFactory);
  
    useEffect(() => {
      checkIfPoolDelegate(account);
    }, [isPoolDelegate]);

    const checkIfPoolDelegate = async () => {
      if (!account == null) {
        alert('No account found.');
        return;
      }
      const isPoolDelegate =await globals?.isValidPoolDelegate(account);

      console.log("isPoolDelegate", isPoolDelegate)
      
      setIsPoolDelegate(isPoolDelegate);
      };

   
    const createNewPool = async () => {
      if (!isPoolDelegate) alert(<h1>Sorry! You are not permissioned to create a pool.</h1>);
    
      const index = await poolFactory?.poolsCreated();
      console.log("pools created", index);
      // liquidityAsset, stakeAsset, slFactory, llFactory, stakingFee, delegateFee, liquidityCap
      
      const usdcAddress = usdcToken.address;
      console.log(`usdcAdd = ${usdcAddress}`);
      console.log(`bPoolAdd = ${bPool.address}`);
      console.log(`slFactory.add = ${slFactory.address}`);
      console.log(`llFactory.add = ${llFactory.address}`);


      const tx = await poolFactory?.createPool(usdcToken.address, bPool.address, slFactory?.address, llFactory?.address, 0, 0, 10 ** 13);
      await tx.await();


      const poolAddress = await poolFactory?.pools(index);
      poolAddress.await;

      console.log(`Pool created at ${poolAddress}.`);
      const pool =  async() => await useContract(poolAddress, abi.pool);
    
      pool.finalize();
      console.log('Pool finalized')
      pool.setOpenToPublic(false);

      return poolAddress
    };

      
    return(
        <>
        <div>
        <h3>Create a new Investment Pool</h3>
          <Link href="/">
            <a>&larr; Home</a>
          </Link>
        </div>
        <Button onClick={createNewPool}>Create a new Pool</Button>
        </>
    );
  }
  
