import { Button } from "./button";
import useWallet from "src/hooks/useWallet";

const WalletWrapper = ({ children }) => {
  const { connect, isConnected, isSupportedNetwork } = useWallet();

  if (!isConnected) return <Button onClick={connect}>Connect Wallet</Button>;

  if (!isSupportedNetwork) return <div>Wrong Network</div>;

  return children;
};

export default WalletWrapper;
