import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import WalletConnect from "@walletconnect/web3-provider";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SUPPORTED_NETWORKS } from "src/constants";
import Web3Modal from "web3modal";

export const providerOptions = {
  walletconnect: {
    package: WalletConnect, // required
    options: {
      infuraId: process.env.INFURA_KEY, // required
    },
  },
};

let web3Modal;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mumbai", // optional
    cacheProvider: true, // optional
    providerOptions, // required
  });
}

export const WalletContext = React.createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [library, setLibrary] = useState(null);

  const connect = useCallback(async function () {
    const provider = await web3Modal.connect();
    const library = new Web3Provider(provider);
    const signer = library.getSigner();
    const address = await signer.getAddress();
    const network = await library.getNetwork();

    setLibrary(library);
    setProvider(provider);
    setSigner(signer);
    setAccount(address);
    setNetwork(network);
  }, []);

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setLibrary(null);
    },
    [provider],
  );

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0]);
      };

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload();
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log("disconnect", error);
        disconnect();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("chainChanged", handleChainChanged);
          provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider, disconnect]);

  const isConnected = !!account;

  const isSupportedNetwork =
    network?.chainId &&
    Object.keys(SUPPORTED_NETWORKS).includes(network.chainId.toString());

  const readProvider = new JsonRpcProvider(
    "https://polygon-mumbai.g.alchemy.com/v2/p0sNpOZvi2r51gDRPZjQkBdIcsk8xbZB",
  );

  const values = useMemo(
    () => ({
      account,
      connect,
      disconnect,
      isConnected,
      isSupportedNetwork,
      network,
      provider: library,
      readProvider,
      signer,
    }),
    [signer, account, network, provider],
  );

  return (
    <WalletContext.Provider value={values}>{children}</WalletContext.Provider>
  );
};

export default function useWallet() {
  const context = React.useContext(WalletContext);

  if (context === undefined) {
    throw new Error(
      "useWallet hook must be used with a WalletProvider component",
    );
  }

  return context;
}
