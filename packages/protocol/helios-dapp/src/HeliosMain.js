import detectEthereumProvider from '@metamask/detect-provider';
import { getContractAddress } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import React, {useState} from 'react'

const HeliosMain = ()  => {

    // change contract address here for each contract
    const contractAddress = "";
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
        // provider is abstraction of a connection to Ethereum Network
        // read-only provider for metamask
        let tempProvider = new ethers.providers.Web3Provider(winodw.ethereum);
        setProvider(tempProvider);

        // gives read + write access
        // allows us to perform functions on the contract
        let tempSigner = tempProvider.getSigner();
        setSigner(tempSigner);

        let tempContract = new ethers.Contract(contractAddress, Contract_abi, tempSigner);
        setContract(tempContract);
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