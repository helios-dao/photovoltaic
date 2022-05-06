import { Container, Header, Main, Footer, Cards } from "@components";
import Link from "next/link";
import { POOLS } from "src/constants";
import useWallet from "src/hooks/useWallet";

const Home: React.FC = () => {
  const { account, providerName, disconnect, isConnected, connect } =
    useWallet();

  return (
    <Container>
      <header>
        {isConnected ? (
          <>
            <div>
              Connected as {account} to {providerName}
            </div>
            <div>
              <button onClick={disconnect}>Disconnect</button>
            </div>
          </>
        ) : (
          <button onClick={connect}>connect metamask</button>
        )}
      </header>
      <main>
        {POOLS.map((pool) => (
          <Link href={`/pools/${pool.address}`} key={pool.address}>
            <a>{pool.name}</a>
          </Link>
        ))}
      </main>
    </Container>
  );
};

export default Home;
