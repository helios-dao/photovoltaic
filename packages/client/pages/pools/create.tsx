import { Button } from "@components/button";
import abi from "contracts";
import addresses from "contracts/addresses";
import { ethers } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useContract from "src/hooks/useContract";
import { HELIOS_GLOBALS_ADDRESS, SUPPORTED_NETWORKS, USDC_ADDRESS } from "src/constants";
import { getContract } from "src/utils";
import useWallet from "src/hooks/useWallet";


// creates pool but does not initialize
// context: https://github.com/maple-labs/maple-core/wiki/Pool-Creation

export default function CreatePoolPage() { 
    const router = useRouter();
    const { account, signer , network} = useWallet();

    const globals = useContract(HELIOS_GLOBALS_ADDRESS, abi.globals);
    const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
    const slFactory = useContract(addresses.stakeLockerFactory, abi.stakeLockerFactory);
    const llFactory = useContract(addresses.liquidityLockerFactory, abi.liquidityLockerFactory);
    const poolFactory = useContract(addresses.poolFactory, abi.poolFactory);

    const [isPoolDelegate, setIsPoolDelegate] = useState(false);

    useEffect(() => { async() => {
      const isValidPoolDelegate = await globals?.isValidPoolDelegate(account);
      if(!isValidPoolDelegate){ return <h1>Sorry! You are not permissioned to create a pool.</h1>;
      }
      setIsPoolDelegate(isValidPoolDelegate)
    }
    });

    let bPoolAddress;

    // governor only
    const setupPoolCreation = async() => {
      globals.setValidPoolFactory(poolFactory.address, true, TX);
      globals.setValidSubFactory(poolFactory.address, liquidityLockerFactory.address, true, TX);
      globals.setValidSubFactory(poolFactory.address, stakeLockerFactory.address, true, TX);
      globals.setValidSubFactory(poolFactory.address, debtLockerFactory.address, true, TX);
      console.log('setValidLoanFactory');
      globals.setValidLoanFactory(loanFactory.address, true, TX);
      globals.setValidSubFactory(loanFactory.address, fundingLockerFactory.address, true, TX);
      globals.setValidSubFactory(loanFactory.address, collateralLockerFactory.address, true, TX);
      console.log('setLiquidityAsset');
      globals.setLiquidityAsset(usdcAddress, true, TX);
      console.log('setCollateralAsset');
      await heliosGlobals.setCollateralAsset(usdcAddress, true, TX);
      await heliosGlobals.setCollateralAsset(wbtcAddress, true, TX);
      console.log('setPoolDelegateAllowlist');
      await heliosGlobals.setPoolDelegateAllowlist(process.env.DEFAULT_POOL_DELEGATE, true, TX);
      console.log('setCalc');
      await heliosGlobals.setCalc(lateFeeCalc.address, true, TX);
      await heliosGlobals.setCalc(premiumCalc.address, true, TX);
      await heliosGlobals.setCalc(repaymentCalc.address, true, TX);
      console.log('setHeliosTreasury');
      await heliosGlobals.setHeliosTreasury(heliosTreasury.address, TX);
      console.log('setPriceOracle');
      await heliosGlobals.setPriceOracle(usdcAddress, usdOracle.address, TX);
      await heliosGlobals.setPriceOracle(wbtcAddress, wbtcOracle.address, TX);
      console.log('setDefaultUniswapPath');
      await heliosGlobals.setDefaultUniswapPath(wbtcAddress, usdcAddress, usdcAddress, TX);

      bPoolAddress = await getContractAddress('BPool', chainId);
      if (bPoolAddress) {
        console.log('setValidBalancerPool');
        await heliosGlobals.setValidBalancerPool(bPoolAddress, true, TX);
      }
    };

   
    const createNewPool = async (bPoolAddress) => {
      if (!isPoolDelegate) return <h1>Sorry! You are not permissioned to create a pool.</h1>;;
          
      const index = await poolFactory.poolsCreated()
      // liquidityAsset, stakeAsset, slFactory, llFactory, stakingFee, delegateFee, liquidityCap
      const tx = await poolFactory.createPool(address(usdcAddress), balancerPoolAddress, slFactory.address, llFactory.address, 0, 0, 10 ** 13);
      await tx.await();
  
      const poolAddress = await poolFactory.pools(index);
      console.log(`Pool created at ${poolAddress}.`);
      const pool =  async() => await useContract(poolAddress, abi.pool);
      pool.finalize();
      pool.setOpenToPublic(false);
      return poolAddress;
    };
      
    return(
        <>
        <div>
        <h3>Create a new Investment Pool</h3>
          <Link href="/">
            <a>&larr; Home</a>
          </Link>
        </div>
        <Button  onClick={createNewPool} disabled={!isPoolDelegate}>Create a new Pool</Button>
        </>
    )
}