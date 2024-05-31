import {     
    ContractExecuteTransaction,
    EthereumTransaction,
    ContractFunctionParameters,
    Hbar,
    EthereumTransactionData
    
 } from "@hashgraph/sdk";

 import { ethers } from 'ethers';

 import { getRPCProvider, getWallet } from "../src/rpcProvider.js";

 import jsonData from '../smart-contract-subproject/artifacts/contracts/EtherSender.sol/EtherSender.json' assert { type: "json" };



async function getEtherSenderContractCallTransaction(etherSenderSmartContractId, recipientAccountEvmAddress) {
    const contractCallTx = new ContractExecuteTransaction()
        .setContractId(etherSenderSmartContractId)
        .setFunction("sendEther", new ContractFunctionParameters().addAddress(recipientAccountEvmAddress))
        .setPayableAmount(0.00000001)
        .setGas(35_000);

        return contractCallTx;
}

async function getEtherSenderEthererumTransaction(etherSenderSmartContractEVMAddress, recipientAccountEvmAddress) {
    const provider = await getRPCProvider();        
    const wallet = await getWallet(provider);
    
    const contract = new ethers.Contract(etherSenderSmartContractEVMAddress, jsonData.abi, wallet);

    const chainId = await wallet.getChainId();
    const gasPrice = ethers.utils.hexValue(await wallet.getGasPrice());
    const gasLimit = ethers.utils.hexValue(35000);

    const tx = await contract.populateTransaction.sendEther(recipientAccountEvmAddress);
    const transactionCount = await wallet.getTransactionCount();

    tx.gasLimit = gasLimit;
    tx.gasPrice = gasPrice;
    tx.value = ethers.utils.parseEther("0.00000001");
    tx.nonce = transactionCount;
    tx.chainId = chainId;        
    
    const signedTx = await wallet.signTransaction(tx);

    const transactionBuffer = Buffer.from(prune0x(signedTx), 'hex');
    const ethereumTransactionData = EthereumTransactionData.fromBytes(transactionBuffer);


    const ethereumTransaction = new EthereumTransaction()
    .setEthereumData(ethereumTransactionData.toBytes())
    .setMaxTransactionFee(Hbar.fromTinybars(15_000_000*85))

    return ethereumTransaction;
}


function prune0x(input) {
    return input.startsWith("0x") ? input.substring(2) : input;
}

export { 
    getEtherSenderContractCallTransaction,
    getEtherSenderEthererumTransaction
 };