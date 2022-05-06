import { useEffect, useState } from "react";
import useWallet from "src/hooks/useWallet";

const SUPPORTED_NETWORKS = {
  80001: "Polygon Testnet",
};
const UNKNOWN_NETWORK = "Unknown network";

const getProviderChainId = async (provider) =>
  provider && (await provider.getNetwork()).chainId.toString();

const isSupportedNetwork = async (provider) => {
  if (!provider) return false;
  const chainId = await getProviderChainId(provider);
  return Object.keys(SUPPORTED_NETWORKS).includes(chainId);
};

export const getProviderName = async (provider) => {
  const chainId = await getProviderChainId(provider);
  return SUPPORTED_NETWORKS[chainId] || UNKNOWN_NETWORK;
};

const WalletWrapper = ({ children }) => {
  const { connect, isConnected, signer, provider } = useWallet();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    fetchIsSupported();
  }, [provider]);

  const fetchIsSupported = async () => {
    setIsSupported(await isSupportedNetwork(provider));
  };

  if (!isConnected) return <button onClick={connect}>Connect metamask</button>;

  if (!isSupported) return <div>Please connect to Polygon</div>;

  return children;
};

export default WalletWrapper;
