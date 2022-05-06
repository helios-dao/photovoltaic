import React, { useState, useEffect, useMemo, useCallback } from "react";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import { getProviderName } from "@components/WalletWrapper";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

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
  const [providerName, setProviderName] = useState(null);

  const fetchProviderName = async () => {
    const name = await getProviderName(provider);
    setProviderName(name);
  };

  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be Wallet or WalletConnect.
    const instance = await web3Modal.connect();

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const provider = new Web3Provider(instance);

    const signer = provider.getSigner();
    const address = await signer.getAddress();

    const network = await provider.getNetwork();

    setProvider(provider);
    setSigner(signer);
    setAccount(address);
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
      setProviderName(null);
    },
    [provider],
  );

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    fetchProviderName();
  }, [provider]);

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log("accountsChanged", accounts);
        setAccount(accounts[0]);
      };

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        console.log("chain changed");
        window.location.reload();
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
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

  //   const switchNetwork = async () => {
  //   try {
  //     await ethers.provider.request({
  //       method: "wallet_switchEthereumChain",
  //       params: [{ chainId: toHex(network) }]
  //     });
  //   } catch (switchError) {

  //         setError(error);
  //     }
  //   }
  // };

  const isConnected = !!account;

  const readProvider = new JsonRpcProvider(
    "https://polygon-mumbai.g.alchemy.com/v2/p0sNpOZvi2r51gDRPZjQkBdIcsk8xbZB",
  );

  const values = useMemo(
    () => ({
      account,
      provider,
      signer,
      isConnected,
      connect,
      providerName,
      readProvider,
      disconnect,
    }),
    [provider, signer, isConnected, account, providerName],
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
