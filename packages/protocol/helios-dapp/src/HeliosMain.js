import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'hardhat';

import React, {useState} from 'react'

const HeliosMain = ()  => {
    const ethereumProvider = async () => {
        await detectEthereumProvider()
    };


    const [errorMessage, setErrorMessage]  = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [connButtonText, setConnButtonText] = useState("Connect your Wallet");
    
    const [currentContractVal, setCurrentContractVal] = useState(null);

    // Ethers.js functionality
    const [provider, setProvider] = useState(null);
    const [signer, setSigner]= useState(null);
    const [contract, setContract] = useState(null);


    const connectWalletHandler = () =>  {
        // Metamask injects ethereum into the window
        if (ethereumProvider){
            console.log("Ethereum library successfully detected.")
            window.ethereum.request({method: 'eth_requestAccounts'})
            .then(result => {
                accountChangedHandler(result[0]);
                setConnButtonText('Wallet Connected')
            })
        }
        else{
            setErrorMessage("Need to install Metamask.")
        }
    }

    const accountChangedHandler = (newAccount) => {
        setDefaultAccount(newAccount)
        updateEthers();
    }

    const updateEthers = () => {
        const alchemyMumbaiUrl = (apiKey) => `https://polygon-mumbai.g.alchemy.com/v2/${apiKey}`
        // provider is abstraction of a connection to Ethereum Network
        let tempProvider = new ethers.providers.JsonRpcProvider()
    }

    return (
        <div> 
           <h1>Welcome to Helios Protocol</h1>
           <h4>
                <a href='https://helios.eco'>Helios.eco</a> 
           </h4>
           <h3>Interact with the protocol below:</h3>
           <button onClick={connectWalletHandler}> {"Connect your Wallet"}</button>
           <h3> Wallet Address: {defaultAccount} </h3>
        </div>
    )
}

export default HeliosMain;