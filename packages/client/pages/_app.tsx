import Title from "@components/header/title";
import Layout from "@components/Layout";
import "@styles/global.css";
import { AppProps } from "next/app";
import React from "react";
import { WalletProvider } from "src/hooks/useWallet";
import "tailwindcss/tailwind.css";
import Header from "@components/header/index";

function HeliosDapp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
    <WalletProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WalletProvider>
    </>
  );
}

export default HeliosDapp;
