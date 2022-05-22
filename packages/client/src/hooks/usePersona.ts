import { useState, useEffect, useCallback } from "react";

const usePersona = () => {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState("init");
  const [mod, setMod] = useState(null);

  // Because of a Nextjs/SSR quirk we have to async load this module
  useEffect(() => {
    const init = async () => {
      const Persona = await import("persona");
      setMod(Persona);
    };
    init();
  }, []);

  const connect = useCallback(
    async (account: string) => {
      if (!mod) return;
      const client = new mod.Client({
        templateId: "itmpl_JePii96YJMv8UjeMjJFp9zV9",
        environment: "sandbox",
        referenceId: account,
        onComplete: ({ status }) => {
          setStatus(status);
        },
      });
      setClient(client);
    },
    [mod],
  );

  return { connect, client, status };
};

export default usePersona;
