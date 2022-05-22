import WalletWrapper from "@components/WalletWrapper";
import InvestForm from "@components/pools/InvestForm";
import UserParticipation from "@components/pools/UserParticipation";
import abi from "contracts";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { POOLS, USDC_ADDRESS } from "src/constants";
import useContract from "src/hooks/useContract";
import formatUsdc from "src/utils/formatUsdc";

export default function PoolPage() {
  const router = useRouter();
  const params = router.query;
  const [totalParticipation, setTotalParticipation] = useState(null);
  const poolContract = useContract(params.address, abi.pool);
  const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
  const [hasInvested, setHasInvested] = useState(false);
  const pool = POOLS.find((pool) => params.address === pool.address);

  useEffect(() => {
    fetchTotalParticipation();
  }, [poolContract, usdcToken, hasInvested]);

  const fetchTotalParticipation = async () => {
    if (!poolContract || !usdcToken) return;

    const totalParticipation = await usdcToken.balanceOf(
      await poolContract.liquidityLocker(),
    );
    setTotalParticipation(formatUsdc(totalParticipation.toString()));
  };

  const handleInvest = () => {
    setHasInvested(true);
  };

  if (!pool) return <div>Could not find pool</div>;

  return (
    <>
      <div>
        <Link href="/">
          <a>&larr; Home</a>
        </Link>
      </div>
      <div>{pool.name}</div>
      <div>Total participation: ${totalParticipation || "??"}</div>
      <WalletWrapper>
        <UserParticipation pool={pool} hasInvested={hasInvested} />
        <InvestForm pool={pool} onInvest={handleInvest} />
      </WalletWrapper>
    </>
  );
}
