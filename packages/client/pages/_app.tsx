import React from "react";
import { AppProps } from "next/app";
import "tailwindcss/tailwind.css";
import "@styles/global.css";
import { WalletProvider } from "src/hooks/useWallet";

function HeliosDapp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default HeliosDapp;
