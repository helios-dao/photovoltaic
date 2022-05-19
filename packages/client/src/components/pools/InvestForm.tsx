// import { initialize as burrataInit, verifyWallet } from "@burrata/sdk.ethers";
import { Button } from "@components/button";
// import { Provider } from "@ethersproject/providers";
import abi from "contracts";
import Persona from "persona";
import { useCallback, useEffect, useState } from "react";
import { USDC_ADDRESS } from "src/constants";
import db from "src/db";
import useContract from "src/hooks/useContract";
import useWallet from "src/hooks/useWallet";
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
};

// export const useBurrata = () => {
//   const [data, setData] = useState(null);
//   const [user, setUser] = useState(null);

//   const callback = ({ type, data }: { type: string; data: any }) => {
//     console.log("burrata callback", type, data);
//     switch (type) {
//       case "claimReceived":
//         setData(data);
//         break;

//       default:
//         break;
//     }
//   };

//   const connect = useCallback(async (account: string, provider: Provider) => {
//     console.log("connecting...");
//     try {
//       const user = await burrataInit({
//         callback,
//         account,
//         provider,
//         kyc: {
//           provider: "WithPersona",
//         },
//         info: {
//           name: "My Awesome DEX",
//           logoUrl: "https://hello.com/my-logo.png", // 64 x 64
//         },
//       });

//       console.log("burrata user", user);

//       setUser(user);
//     } catch (error) {
//       console.log("burrata error", error);
//       setUser(null);
//     }
//   }, []);

//   return [user, connect];
// };

const usePersona = () => {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState("init");

  const connect = useCallback(async (account: string) => {
    const client = new Persona.Client({
      templateId: "itmpl_JePii96YJMv8UjeMjJFp9zV9",
      environment: "sandbox",
      referenceId: account,
      onReady: () => setStatus("ready"),
      onComplete: ({ inquiryId, status, fields }) => {
        // Inquiry completed. Optionally tell your server about it.
        setStatus(status);
        console.log(`finished inquiry ${inquiryId} with status ${status}`);
      },
      onCancel: ({ inquiryId, sessionToken }) => {
        console.log("onCancel");
        setStatus("cancel");
      },
      onError: (error) => {
        console.log(error);
        setStatus("error");
      },
    });
    setClient(client);
  }, []);

  const reset = () => {
    if (status !== "init" && status !== "ready") setStatus("ready");
  };

  return { connect, client, reset, status };
};

const InvestForm = ({ pool }: InvestFormProps): JSX.Element => {
  const { account } = useWallet();
  const [amount, setAmount] = useState<number | undefined>();
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>();
  const poolContract = useContract(pool.address, abi.pool);
  const usdcToken = useContract(USDC_ADDRESS, abi.usdc);
  const approveTx = useBlockchainTransaction();
  const depositTx = useBlockchainTransaction();
  // const [burrataUser, burrataConnect] = useBurrata();
  const {
    connect: personaConnect,
    client: personaClient,
    reset,
    status,
  } = usePersona();
  const [needsKyc, setNeedsKyc] = useState(true);

  // useEffect(() => {
  //   if (!account || !provider || !burrataConnect) return;
  //   burrataConnect(account, provider);
  // }, [account, provider, burrataConnect]);

  useEffect(() => {
    if (!account) return;
    personaConnect(account);
  }, [account]);

  useEffect(() => {
    if (!account) return;
    if (status === "completed") onComplete();
    fetchKycStatus();
  }, [account, status]);

  const fetchKycStatus = async () => {
    const kyc = isApproved(account);
    setNeedsKyc(kyc);
  };

  const isReady = poolContract !== null && usdcToken !== null;
  const hasInvested =
    approveTx.status === StatusEnum.Complete &&
    depositTx.status === StatusEnum.Complete;
  const isInvesting =
    approveTx.status === StatusEnum.Pending ||
    depositTx.status === StatusEnum.Pending;
  const errorMsg = localErrorMsg || approveTx.error || depositTx.error;

  const isApproved = async (account: string) => {
    const kyc = await db.collection("kyc").get(account);
    return !!kyc && kyc.status === "complete";
  };

  const onComplete = async () => {
    const docRef = db.collection("kyc").doc(account);

    await docRef.set({ status: "complete" });
  };

  const openPersona = async (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    setLocalErrorMsg(null);

    if (!personaClient) {
      setLocalErrorMsg("Persona is not initialized");
      return;
    }

    reset();
    personaClient.open();

    // if (!burrataUser) {
    //   setLocalErrorMsg("Burrata is not initialized");
    //   return;
    // }

    // if (!burrataUser.isVerified) {
    //   verifyWallet();
    // }
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

  if (needsKyc)
    return (
      <div>
        <button onClick={openPersona}>Verify Identity</button>
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
