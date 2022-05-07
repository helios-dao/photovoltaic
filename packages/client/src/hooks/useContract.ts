import useWallet from "./useWallet";
import { Contract } from "@ethersproject/contracts";
import { useMemo } from "react";
import { getContract } from "src/utils";

export default function useContract<T extends Contract = Contract>(
  address: string,
  ABI: any,
): T | null {
  const { isSupportedNetwork, readProvider, signer } = useWallet();
  const signerOrProvider = isSupportedNetwork
    ? signer || readProvider
    : readProvider;

  return useMemo(() => {
    if (!address || !ABI || !signerOrProvider) {
      return null;
    }

    try {
      return getContract(address, ABI, signerOrProvider);
    } catch (error) {
      console.error("Failed To Get Contract", error);

      return null;
    }
  }, [address, ABI, signerOrProvider]) as T;
}
