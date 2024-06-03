import {     
    ContractExecuteTransaction,
    EthereumTransaction,
    ContractFunctionParameters,
    Hbar,
    EthereumTransactionData,
    ContractCreateFlow,    
    AccountId,
    AccountAllowanceApproveTransaction,
    TransactionResponse
    
 } from "@hashgraph/sdk";

 import { ethers } from 'ethers';

 import { getRPCProvider, getWallet } from "../src/rpcProvider.js";

 import etherSenderJson from '../smart-contract-subproject/artifacts/contracts/EtherSender.sol/EtherSender.json' assert { type: "json" };
 import htsExamplesJson from '../smart-contract-subproject/artifacts/contracts/HTSExamples.sol/HTSExamples.json' assert { type: "json" };


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
    
    const contract = new ethers.Contract(etherSenderSmartContractEVMAddress, etherSenderJson.abi, wallet);

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

async function deployEtherSenderSmartContract(client)
{
    const bytecode = etherSenderJson.bytecode;

    const contractCreate = new ContractCreateFlow()
    .setGas(1_000_000)
    .setBytecode(bytecode);
    const txResponse = await contractCreate.execute(client);            
    const receipt = await txResponse.getReceipt(client);

    //Get the new contract ID
    const etherSenderSmartContractId = receipt.contractId;
    const etherSenderSmartContractEVMAddress = "0x"+AccountId.fromString(etherSenderSmartContractId.toString()).toSolidityAddress();    
    console.log("The new contract ID for EtherSender is: " + etherSenderSmartContractId + " and EVM address is " + etherSenderSmartContractEVMAddress);
    return { etherSenderSmartContractId, etherSenderSmartContractEVMAddress };
}

async function deployHTSExamplesContract(client) {

    const bytecode = htsExamplesJson.bytecode;

    const contractCreate = new ContractCreateFlow()
    .setGas(1_000_000)
    .setBytecode(bytecode);
    const txResponse = await contractCreate.execute(client);
    const receipt = await txResponse.getReceipt(client);

    //Get the new contract ID
    const htsExamplesSmartContractId = receipt.contractId;
    const htsExamplesSmartContractEVMAddress = "0x"+AccountId.fromString(htsExamplesSmartContractId.toString()).toSolidityAddress();
    console.log("The new contract ID is for HTS Examples is: " + htsExamplesSmartContractId + " and EVM address is " + htsExamplesSmartContractEVMAddress);
    return { htsExamplesSmartContractId, htsExamplesSmartContractEVMAddress };

}

async function getHbarTransferHTSExampleContractCallTransaction(htsExamplesSmartContractId, recipientAccountEvmAddress) {
    const contractCallTx = new ContractExecuteTransaction()
        .setContractId(htsExamplesSmartContractId)        
        .setFunction("trasnsferHbar", new ContractFunctionParameters().addAddress(recipientAccountEvmAddress).addInt64(1))        
        .setGas(40_000);

        return contractCallTx;
}

async function getFungibleTokenTransferHTSExampleContractCallTransaction(htsExamplesSmartContractId, senderEVMAddress, recipientAccountEvmAddress, fungibleTokenEVMAddress) {
    // function transferHTS(address sender, address recipient, int64 amount, address tokenId) public returns (int responseCode)
    const contractCallTx = new ContractExecuteTransaction()
        .setContractId(htsExamplesSmartContractId)        
        .setFunction("transferHTS", new ContractFunctionParameters()
            .addAddress(senderEVMAddress)
            .addAddress(recipientAccountEvmAddress)            
            .addInt64(1)
            .addAddress(fungibleTokenEVMAddress))
        .setGas(60_000);

        return contractCallTx;
}

async function getFungibleTokenTransferHTSExampleEthererumTransaction(htsExamplesSmartContractEVMAddress, senderEVMAddress, recipientAccountEvmAddress, fungibleTokenEVMAddress) {
    const provider = await getRPCProvider();        
    const wallet = await getWallet(provider);
    
    const contract = new ethers.Contract(htsExamplesSmartContractEVMAddress, htsExamplesJson.abi, wallet);

    const chainId = await wallet.getChainId();
    const gasPrice = ethers.utils.hexValue(await wallet.getGasPrice());
    const gasLimit = ethers.utils.hexValue(60_000);

        // function transferHTS(address sender, address recipient, int64 amount, address tokenId) public returns (int responseCode)
    const tx = await contract.populateTransaction.transferHTS(senderEVMAddress, recipientAccountEvmAddress, 1, fungibleTokenEVMAddress);
    const transactionCount = await wallet.getTransactionCount();

    tx.gasLimit = gasLimit;
    tx.gasPrice = gasPrice;
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

async function getHbarTransferHTSExampleEthererumTransaction(htsExamplesSmartContractEVMAddress, recipientAccountEvmAddress) {
    const provider = await getRPCProvider();        
    const wallet = await getWallet(provider);
    
    const contract = new ethers.Contract(htsExamplesSmartContractEVMAddress, htsExamplesJson.abi, wallet);

    const chainId = await wallet.getChainId();
    const gasPrice = ethers.utils.hexValue(await wallet.getGasPrice());
    const gasLimit = ethers.utils.hexValue(40000);

    const tx = await contract.populateTransaction.trasnsferHbar(recipientAccountEvmAddress, 1);
    const transactionCount = await wallet.getTransactionCount();

    tx.gasLimit = gasLimit;
    tx.gasPrice = gasPrice;
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


async function approveHbar(client, ownerAccountKey, ownerAccountId, spenderAccountId, amount){

    // frezze and sign
    const approve = new AccountAllowanceApproveTransaction()
    .approveHbarAllowance(ownerAccountId, spenderAccountId, Hbar.fromTinybars(amount));

    //const txResponse = (await approve.freezeWith(client).sign(ownerAccountKey)).execute(client);
    const signTx = await approve.freezeWith(client).sign(ownerAccountKey);

    const txResponse = await signTx.execute(client);

    const receipt = await txResponse.getReceipt(client);

    console.log("Approval of HBAR receipt: " + receipt.status.toString());


}

async function approveTokenTransfer(client, ownerAccountKey, ownerAccountId, spenderAccountId, amount, fungibleTokenId){    
    // build approve tx
    const approve = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(fungibleTokenId, ownerAccountId, spenderAccountId, amount);    
    // freeze and sign
    const signTx = await approve.freezeWith(client).sign(ownerAccountKey);
    // execute
    const txResponse = await signTx.execute(client);
    // get receipt
    const receipt = await txResponse.getReceipt(client);
    // log receipt status
    console.log("Approval of HTS receipt: " + receipt.status.toString());
}

async function approveNFTTransfer(client, ownerAccountKey, ownerAccountId, spenderAccountId, nftTokenId){
    // build approve tx
    const approve = new AccountAllowanceApproveTransaction()
    .approveTokenNftAllowanceAllSerials(nftTokenId, ownerAccountId, spenderAccountId);        
    // freeze and sign
    const signTx = await approve.freezeWith(client).sign(ownerAccountKey);
    // execute
    const txResponse = await signTx.execute(client);
    // get receipt
    const receipt = await txResponse.getReceipt(client);
    // log receipt status
    console.log("Approval of NFT All Serials receipt: " + receipt.status.toString());
}

function prune0x(input) {
    return input.startsWith("0x") ? input.substring(2) : input;
}

export { 
    getEtherSenderContractCallTransaction,
    getEtherSenderEthererumTransaction,
    deployEtherSenderSmartContract,
    deployHTSExamplesContract,
    getHbarTransferHTSExampleContractCallTransaction,
    getHbarTransferHTSExampleEthererumTransaction,
    approveHbar,
    approveTokenTransfer,
    approveNFTTransfer,
    getFungibleTokenTransferHTSExampleContractCallTransaction,
    getFungibleTokenTransferHTSExampleEthererumTransaction
 };