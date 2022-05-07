import WalletWrapper from "@components/WalletWrapper";
import { Button } from "@components/button";
import { Container } from "@components/container";
import useWallet from "src/hooks/useWallet";
import { getNetworkName } from "src/utils";

const Layout: React.FC = ({ children }) => {
  const { account, network, disconnect } = useWallet();
  const providerName = getNetworkName(network);

  return (
    <Container>
      <header>
        <WalletWrapper>
          <>
            <div>
              Connected as {account} to {providerName}
            </div>
            <div>
              <Button onClick={disconnect}>Disconnect</Button>
            </div>
          </>
        </WalletWrapper>
      </header>
      {children}
    </Container>
  );
};

export default Layout;
