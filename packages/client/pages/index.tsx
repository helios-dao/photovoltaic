import { CardsList, Card } from "@components";
import Link from "next/link";
import { useEffect, useState } from "react";
import useWallet from "src/hooks/useWallet";
import { POOLS } from "src/metadata/pools/mumbai";
import { Pool__factory } from "src/types/ethers-contracts";
import { shortenAddress } from "src/utils";
import formatUsdc from "src/utils/formatUsdc";

const Dashboard: React.FC = ({}) => {
  const { account , provider } = useWallet();
  const [amount, setAmount] = useState(null);
  let contract;

  useEffect(() => {
    getAmount();
  }, [account]);

  const getAmount = async () => {
    if (!account) return;

    let amount = 0;
    let pool;
    for (let i = 0; i < POOLS.length; i++) {
      pool = POOLS[i];
      if (!contract) {
        contract = Pool__factory.connect(pool.address, provider);
      } else {
        contract = contract.attach(pool.address);
      }
      amount = amount + (await contract.balanceOf(account));
    }
    setAmount(formatUsdc(amount.toString()));
  };

  return <div>Total invested: ${amount || "???"}</div>;
};

const Home: React.FC = () => {
  const { isConnected } = useWallet();

  return (
    <>
      {isConnected && <Dashboard />}
      <CardsList>
        {POOLS.map((pool) => (
          <Link href={`/pools/${pool.address}`} key={pool.address}>
            <a>
              <Card
                name={pool.name}
                description={shortenAddress(pool.address)}
              />
            </a>
          </Link>
        ))}
      </CardsList>
    </>
  );
};

export default Home;
