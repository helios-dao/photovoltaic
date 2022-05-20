import { Button } from "@components/button";
import abi from "contracts";
import { useEffect, useState } from "react";
import { USDC_ADDRESS } from "src/constants";
import useContract from "src/hooks/useContract";
import usePersona from "src/hooks/usePersona";
import useWallet from "src/hooks/useWallet";
import { fetchPersonaKycStatus } from "src/utils/api";
import parseUsdc from "src/utils/parseUsdc";

type BlockchainTransactionExecuteProps = {
  contract: any;
  functionName: string;
  args: any[];
};

type UseBlockchainTransactionReturn = {
  error: unknown;
  execute: (args: BlockchainTransactionExecuteProps) => Promise<void>;
  status: StatusEnum;
};

const handleError = (e: unknown): string => {
  if (typeof e === "string") {
    return e;
  } else if (e instanceof Error) {
    return e.message;
  } else {
    return "";
  }
};

const useBlockchainTransaction = (): UseBlockchainTransactionReturn => {
  const [status, setStatus] = useState<StatusEnum>(StatusEnum.Init);
  const [error, setError] = useState<string | null>(null);

  const execute = async ({
    contract,
    functionName,
    args,
  }: BlockchainTransactionExecuteProps): Promise<void> => {
    setError(null);
    setStatus(StatusEnum.Pending);
    try {
      const tx = await contract[functionName](...args);
      await tx.wait();
      setStatus(StatusEnum.Complete);
    } catch (error) {
      setStatus(StatusEnum.Error);
      setError(handleError(error));
    }
  };

  return {
    error,
    execute,
    status,
  };
};

enum StatusEnum {
  Complete = "complete",
  Error = "error",
  Init = "init",
  Pending = "pending",
}

const STATUS_MAP = {
  [StatusEnum.Complete]: "Complete",
  [StatusEnum.Error]: "Error",
  [StatusEnum.Init]: "Not started",
  [StatusEnum.Pending]: "Waiting...",
};

type BlockchainTransactionStepProps = {
  status: StatusEnum;
  stepName: string;
};

const BlockchainTransactionStep = ({
  status,
  stepName,
}: BlockchainTransactionStepProps) => {
  return (
    <div>
      {stepName}:{STATUS_MAP[status]}
    </div>
  );
};

type IPool = {
  address: string;
};

type InvestFormProps = {
  pool: IPool;
  onInvest: () => void;
};

const InvestForm = ({ pool, onInvest }: InvestFormProps): JSX.Element => {
  const { account } = useWallet();
  const [amount, setAmount] = useState<number | undefined>();
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>();
  const poolContract = useContract(pool.address, abi.pool);
  const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
  const approveTx = useBlockchainTransaction();
  const depositTx = useBlockchainTransaction();
  const {
    connect: personaConnect,
    client: personaClient,
    status,
  } = usePersona();
  const [needsKyc, setNeedsKyc] = useState(null);

  const isReady = poolContract !== null && usdcToken !== null;
  const hasInvested =
    approveTx.status === StatusEnum.Complete &&
    depositTx.status === StatusEnum.Complete;
  const isInvesting =
    approveTx.status === StatusEnum.Pending ||
    depositTx.status === StatusEnum.Pending;
  const errorMsg = localErrorMsg || approveTx.error || depositTx.error;

  useEffect(() => {
    if (!account) return;
    personaConnect(account);
  }, [account]);

  useEffect(() => {
    if (!account) return;
    fetchKycStatus();
  }, [account, status]);

  useEffect(() => {
    if (hasInvested) onInvest();
  }, [hasInvested]);

  const fetchKycStatus = async () => {
    const kyc = await fetchPersonaKycStatus(account);
    setNeedsKyc(kyc);
  };

  const handleVerifyIdentity = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    setLocalErrorMsg(null);

    if (!personaClient) {
      setLocalErrorMsg("Persona is not initialized");
      return;
    }

    personaClient.open();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (poolContract == null || usdcToken == null) {
      setLocalErrorMsg("Contracts are not initialized");
      return;
    }
    if (!amount || amount < 0) {
      setLocalErrorMsg("Amount has to be positive");
      return;
    }

    const parsedAmount = parseUsdc(amount.toString());
    await approveTx.execute({
      contract: usdcToken,
      functionName: "approve",
      args: [pool.address, parsedAmount],
    });
    await depositTx.execute({
      contract: poolContract,
      functionName: "deposit",
      args: [parsedAmount],
    });
  };

  if (hasInvested) return <div>Your investment is complete</div>;

  // KYC info is loading:
  if (needsKyc === null) return <></>;

  if (needsKyc)
    return (
      <div>
        <button onClick={handleVerifyIdentity}>Verify Identity</button>
      </div>
    );

  if (isInvesting) {
    return (
      <>
        <BlockchainTransactionStep
          status={approveTx.status}
          stepName="1. Approval"
        />
        <BlockchainTransactionStep
          status={depositTx.status}
          stepName="2. Deposit"
        />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        name="amount"
        onChange={(e) =>
          setAmount(
            e.target.value !== "" ? parseFloat(e.target.value) : undefined,
          )
        }
        defaultValue={amount}
      />
      {errorMsg ? (
        <>
          <div>Error: {errorMsg}</div>
          <Button disabled={!isReady}>Retry</Button>
        </>
      ) : (
        <Button disabled={!isReady}>Invest</Button>
      )}
    </form>
  );
};

export default InvestForm;
