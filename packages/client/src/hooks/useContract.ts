import { Contract } from "@ethersproject/contracts";
import { useMemo } from "react";
import { getContract } from "src/utils";
import useWallet from "./useWallet";

export default function useContract<T extends Contract = Contract>(
  address: string,
  ABI: any,
): T | null {
  const { signer } = useWallet();

  return useMemo(() => {
    if (!address || !ABI || !signer) {
      return null;
    }

    try {
      return getContract(address, ABI, signer);
    } catch (error) {
      console.error("Failed To Get Contract", error);

      return null;
    }
  }, [address, ABI, signer]) as T;
}
