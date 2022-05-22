import abi from "contracts";
import { useState, useEffect } from "react";
import useContract from "src/hooks/useContract";
import useWallet from "src/hooks/useWallet";
import formatUsdc from "src/utils/formatUsdc";

const UserParticipation = ({ pool, hasInvested }) => {
  const poolContract = useContract(pool.address, abi.pool);
  const { account, isConnected } = useWallet();
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    getAmount();
  }, [pool, account, hasInvested]);

  const getAmount = async () => {
    if (!account || poolContract == null) return;
    const userParticipation = await poolContract.balanceOf(account);
    setAmount(formatUsdc(userParticipation.toString()));
  };

  if (!isConnected) return <></>;

  return <div>You invested: ${amount || "???"}</div>;
};

export default UserParticipation;
