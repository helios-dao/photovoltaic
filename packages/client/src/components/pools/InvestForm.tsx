import { Button } from "@components/button";
import abi from "contracts";
import { useState } from "react";
import { USDC_ADDRESS } from "src/constants";
import useContract from "src/hooks/useContract";
import parseUsdc from "src/utils/parseUsdc";

const InvestForm = ({ pool }) => {
  const [status, setStatus] = useState({});
  const [amount, setAmount] = useState(undefined);
  const [errorMsg, setError] = useState("");
  const poolContract = useContract(pool.address, abi.pool);
  const usdcToken = useContract(USDC_ADDRESS, abi.usdc);

  const {
    hasApproved,
    hasDeposited,
    hasInvested,
    isApproving,
    isDepositing,
    isError,
    isInvesting,
  } = status;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus({
      ...status,
      hasApproved: false,
      hasDeposited: false,
      hasInvested: false,
      isApproving: false,
      isDepositing: false,
      isError: false,
      isInvesting: false,
    });

    if (poolContract == null || usdcToken == null) {
      setError("Contracts are not initialized");
      return;
    }
    if (!amount || amount < 0) {
      setError("Amount has to be positive");
      return;
    }

    setStatus({
      ...status,
      isInvesting: true,
      isApproving: true,
      isError: false,
    });
    try {
      const parsedAmount = parseUsdc(amount);
      let tx = await usdcToken.approve(pool.address, parsedAmount);
      await tx.wait();
      setStatus({
        ...status,
        isApproving: false,
        hasApproved: true,
        isDepositing: true,
      });
      tx = await poolContract.deposit(parsedAmount);
      await tx.wait();
      setStatus({
        ...status,
        isDepositing: false,
        hasDeposited: true,
        hasInvested: true,
        isInvesting: false,
      });
    } catch (error) {
      setStatus({
        ...status,
        isError: true,
      });
      setError(error.reason);
    }
  };

  const isReady = poolContract !== null && usdcToken !== null;

  if (hasInvested) return <div>Your investment is complete</div>;

  if (isInvesting) {
    return (
      <div>
        <div>
          1. Approval:
          {hasApproved
            ? "Complete"
            : isApproving
            ? "Waiting..."
            : "Not started"}
        </div>
        <div>
          2. Deposit:
          {hasDeposited
            ? "Complete"
            : isDepositing
            ? "Waiting..."
            : "Not started"}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="amount"
        onChange={(e) => setAmount(e.target.value)}
        defaultValue={amount}
      />
      {isError ? (
        <Button disabled={!isReady}>Retry</Button>
      ) : (
        <Button disabled={!isReady}>Invest</Button>
      )}
      {errorMsg !== "" && <div>Error: {errorMsg}</div>}
    </form>
  );
};

export default InvestForm;
