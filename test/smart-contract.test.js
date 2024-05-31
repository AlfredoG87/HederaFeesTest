import { expect } from "chai";
import jsonData from '../smart-contract-subproject/artifacts/contracts/EtherSender.sol/EtherSender.json' assert { type: "json" };
import { createClient } from "../src/hederaClient.js";
import {     
    PrivateKey,
    ContractCreateFlow,
    AccountId
 } from "@hashgraph/sdk";

import { createNewEcAccount } from "../src/transactions.js";

import { 
    getEtherSenderContractCallTransaction,
    getEtherSenderEthererumTransaction
} from "../src/smart-contract.js";

const bytecode = jsonData.bytecode;

describe("Hedera Transaction Fee Tests", function () {
    this.timeout(120000); // Set timeout to 60 seconds
    let ecClient;
    let edClient;
    let clients = {};
    let etherSenderSmartContractId;
    let etherSenderSmartContractEVMAddress;
    let testResults = {};
    let recipientAccount;
    let recipientAccountEvmAddress;
    

    before(async function () {

        // create clients
        ecClient = await createClient("EC");
        edClient = await createClient("ED");
        clients["ED"] = { name: "ED", client: edClient};
        clients["EC"] = { name: "EC", client: ecClient};

        recipientAccount = await createNewEcAccount(edClient, 5);
        recipientAccountEvmAddress = "0x"+AccountId.fromString(recipientAccount.accountId.toString()).toSolidityAddress();
        console.log("Recipient Account ID: " + recipientAccount.accountId + " EVM Address: " + recipientAccountEvmAddress);
        

        // deploy the smart contract
        const contractCreate = new ContractCreateFlow()
        .setGas(1_000_000)
        .setBytecode(bytecode);
        const txResponse = contractCreate.execute(edClient);            
        const receipt = (await txResponse).getReceipt(edClient);    
        //Get the new contract ID
        etherSenderSmartContractId = (await receipt).contractId;
        etherSenderSmartContractEVMAddress = "0x"+AccountId.fromString(etherSenderSmartContractId.toString()).toSolidityAddress();    
        console.log("The new contract ID is " + etherSenderSmartContractId + " and EVM address is " + etherSenderSmartContractEVMAddress);

    });

    after(async function () {
        console.log(testResults);

        // close clients
        await ecClient.close();
        await edClient.close();
    });

    const testCase1 = "A smart contract execution of a simple value transfer of 1 tiny bar";
    it(testCase1, async function () {

        // Using ContractExecuteTransaction
        for (const client of Object.values(clients)) {
            const tx = await getEtherSenderContractCallTransaction(etherSenderSmartContractId, recipientAccountEvmAddress);
            const txResponse = await tx.execute(client.client);            
            await assertAndReportCost(txResponse, client, testResults, testCase1 + " (ContractExecuteTransaction)");
        }

        // Using EthereumTransaction
        for (const client of Object.values(clients)) {
            const ethereumTransaction = await getEtherSenderEthererumTransaction(etherSenderSmartContractEVMAddress, recipientAccountEvmAddress);
            const txResponseEthereum = await ethereumTransaction.execute(client.client);            
            await assertAndReportCost(txResponseEthereum, client, testResults, testCase1 + " (EthereumTransaction)");
            // wait a couple seconds for the nonce to reflect on the mirror node
            await new Promise(r => setTimeout(r, 3000));
        }

    }); 

});


async function assertAndReportCost(txResponse, client, testResults, testDescription) {
    const record = await txResponse.getRecord(client.client);
    const transactionFee = record.transactionFee.toTinybars();
    expect(transactionFee.toNumber()).to.be.greaterThan(0);
    const exchangeRate = record.receipt.exchangeRate.cents;
    testResults[`${testDescription} - Client KeyType: ${client.name}`] = { "tiny bar": transactionFee.toNumber(), "exchange rate in cents" : exchangeRate };
}


/*
A smart contract execution of a simple value transfer of 1 tiny bar (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a simple value transfer of 1 tiny bar (ContractCall w EC key and EthereumTransaction)	



A smart contract execution of a system contract HTS CryptoTransfer of 1 tiny bar (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 tiny bar (ContractCall w EC key and EthereumTransaction)

A smart contract execution of a system contract HTS CryptoTransfer of 1 fungible token (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 fungible token (ContractCall w EC key and EthereumTransaction)	

A smart contract execution of a system contract HTS CryptoTransfer of 1 NFT (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 NFT (ContractCall w EC key and EthereumTransaction)

*/