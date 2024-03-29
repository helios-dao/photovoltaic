import { Button } from "@components/button";
import abi from "contracts";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BPOOL_ADDRESS, HELIOS_GLOBALS_ADDRESS, USDC_ADDRESS, LIQUIDITY_LOCKER_FACTORY_ADDRESS, POOL_FACTORY_ADDRESS, STAKE_LOCKER_FACTORY_ADDRESS } from "src/constants";
import { getNetworkName } from "src/utils";
import useWallet from "src/hooks/useWallet";
import useContract from "src/hooks/useContract";
import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";

// creates pool but does not initialize
// context: https://github.com/maple-labs/maple-core/wiki/Pool-Creation

export default function CreatePoolPage() {

  const { account, network, signer, provider, isConnected } = useWallet();
  const [isPoolDelegate, setIsPoolDelegate] = useState(false);
  const [newPoolSuccess, setNewPoolSuccess] = useState(false);
  const [newPoolAddress, setNewPoolAddress] = useState(null);
  const globals = useContract(HELIOS_GLOBALS_ADDRESS, abi.globals);
  const bPool = useContract(BPOOL_ADDRESS, abi.bPool);
  const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
  const slFactory = useContract(STAKE_LOCKER_FACTORY_ADDRESS, abi.stakeLockerFactory);
  const llFactory = useContract(LIQUIDITY_LOCKER_FACTORY_ADDRESS, abi.liquidityLockerFactory);
  const poolFactory = useContract(POOL_FACTORY_ADDRESS, abi.poolFactory);


  useEffect(() => {
    isConnected;
  }, [account, globals]);


  useEffect(() => {
    checkIfPoolDelegate();
  }, [account, globals]);


  const checkIfPoolDelegate = async () => {
    if (account === null) {
      console.error("No account found")
      return;
    }
    if (globals === null) {
      console.error("Cannot find HeliosGlobals contract instance")
      return;
    }

    const isPoolDelegate = await globals?.isValidPoolDelegate(account);
    setIsPoolDelegate(isPoolDelegate);
  };


  const createNewLiquidityPool = async () => {
    const isReady = usdcToken !== null || poolFactory !== null || slFactory !== null || llFactory !== null || bPool !== null;
    if (!signer || !isReady || !globals ) {
      return;
    }
    const protocolPaused = await globals.protocolPaused();

    const isValidPoolFactory = await globals.isValidPoolFactory(poolFactory?.address);
    const isValidBalancerPool = await globals.isValidBalancerPool(bPool?.address);
    const isValidLiquidityAsset = await globals.isValidLiquidityAsset(usdcToken?.address);

    if(protocolPaused){
      console.log("protocol paused.", globals.protocolPaused())
      return;
    }

    if (!isPoolDelegate) {
      console.log("not a valid pool delegate");
      return;
    }

    if(!isValidPoolFactory || !isValidBalancerPool || !isValidLiquidityAsset) return <div> Missing valid contract to create pool.</div>

    console.log("going to create pool on:", getNetworkName(network))

    // createPool: liquidityAsset, stakeAsset, slFactory, llFactory, stakingFee, delegateFee, liquidityCap
    poolFactory.createPool(usdcToken.address, bPool.address, slFactory.address, llFactory.address, 0, 0, 10 * 13, { gasLimit: 2000000 }).then((tx) => {
      return tx.wait().then((receipt) => {
        console.log("success", receipt.toString);
        setNewPoolAddress(receipt);
        setNewPoolSuccess(true);
        return receipt;
      }, (error) => {
          console.log(error);
          setNewPoolSuccess(false);
          return;
      }
      )
    });
  };

  const finalizeAndOpenToPublic = async () => {
        // approve
        //finalize
  }

  return (
    <>
      <div>
        {(isConnected) ?
          (<h3>Create a new liquidity investment pool on {getNetworkName(network)}</h3>)
          : (<h3>Connect wallet to create a new liquidity pool.</h3>)
        }
        <Link href="/">
          <a>&larr; Home</a>
        </Link>
      </div>
      {(newPoolSuccess) ??
          <>
        <h3>New pool created successfully at address: ${newPoolAddress}</h3>
        <Button disabled={!newPoolSuccess} onClick={finalizeAndOpenToPublic}>Finalize Pool and Open to Public</Button>
        </>
      }
      <Button onClick={createNewLiquidityPool}>Create a new Pool</Button>
    </>
  );
}

