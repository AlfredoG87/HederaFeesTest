import { expect } from "chai";
import jsonData from '../smart-contract-subproject/artifacts/contracts/EtherSender.sol/EtherSender.json' assert { type: "json" };
import { 
    createClient,
    createClientWithOperatorAccount
 } from "../src/hederaClient.js";
import {     
    AccountId,
    PrivateKey
 } from "@hashgraph/sdk";

import { 
    createNewEcAccount, 
    createFungibleToken,
    associateTokenToAccount,
    transferToken
} from "../src/transactions.js";

import { 
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
} from "../src/smart-contract.js";

import dotenv from "dotenv";

dotenv.config();

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
    let recipientClient;

    let htsExamplesSmartContractId;
    let htsExamplesSmartContractEVMAddress;
    
    let ecPrivateKey = PrivateKey.fromStringDer(process.env.EC_PRIVATE_KEY);
    let edPrivateKey = PrivateKey.fromStringDer(process.env.ED_PRIVATE_KEY);

    let ecAccountId = AccountId.fromString(process.env.EC_ACCOUNT_ID);
    let edAccountId = AccountId.fromString(process.env.ED_ACCOUNT_ID);

    let ecEVMAddress = "0x"+AccountId.fromString(ecAccountId.toString()).toSolidityAddress();
    let edEVMAddress = "0x"+AccountId.fromString(edAccountId.toString()).toSolidityAddress();

    let ecLongZero = convertAccountIdtoLongZeroAddress(ecAccountId.toString());
    let edLongZero = convertAccountIdtoLongZeroAddress(edAccountId.toString());

    let fungibleTokenId;
    let fungibleTokenEVMAddress;

    before(async function () {

        // create clients
        ecClient = await createClient("EC");
        edClient = await createClient("ED");
        clients["ED"] = { name: "ED", client: edClient, privateKey: edPrivateKey, accountId: edAccountId, evmAddress: edEVMAddress, longZero: edLongZero};
        clients["EC"] = { name: "EC", client: ecClient, privateKey: ecPrivateKey, accountId: ecAccountId, evmAddress: ecEVMAddress, longZero: ecLongZero};


        recipientAccount = await createNewEcAccount(edClient, 5);
        recipientAccountEvmAddress = "0x"+AccountId.fromString(recipientAccount.accountId.toString()).toSolidityAddress();
        console.log("Recipient Account ID: " + recipientAccount.accountId + " EVM Address: " + recipientAccountEvmAddress);        

        // deploy the smart contract etherSender smart contract
        ({ etherSenderSmartContractId, etherSenderSmartContractEVMAddress } = await deployEtherSenderSmartContract(edClient));

        // deploy HTS Examples contract
        ({ htsExamplesSmartContractId, htsExamplesSmartContractEVMAddress } = await deployHTSExamplesContract(edClient));

        // approval for HBAR transfer
        await approveHbar(edClient, ecPrivateKey, ecAccountId, htsExamplesSmartContractId,  10_000_000);
        await approveHbar(edClient, edPrivateKey, edAccountId, htsExamplesSmartContractId,  10_000_000);


        // create a fungible token and associate it with all accounts transfer 100 tokens to each account
        fungibleTokenId = await createFungibleToken(edClient, "TokenNameForHTS", "TSHTS", 1000);
        fungibleTokenEVMAddress = "0x"+AccountId.fromString(fungibleTokenId.toString()).toSolidityAddress();
        console.log("Fungible Token ID: " + fungibleTokenId + " EVM Address: " + fungibleTokenEVMAddress);

        // associate the token to all accounts
        await associateTokenToAccount(ecClient, fungibleTokenId, ecClient.operatorAccountId);
        recipientClient = await createClientWithOperatorAccount(recipientAccount.accountId, recipientAccount.privateKey);
        const txResponse = await associateTokenToAccount(recipientClient, fungibleTokenId, recipientAccount.accountId);
        //console.log("Token associated with recipient account: " + txResponse);        

        // transfer 100 tokens to EC account
        const transferTokenResponse = await transferToken(edClient, fungibleTokenId, edClient.operatorAccountId, ecClient.operatorAccountId, 100);
        //console.log("Token transfer response: " + transferTokenResponse);

        // Approve HTSExample Contract to transfer fungible token
        //async function approveTokenTransfer(client, ownerAccountKey, ownerAccountId, spenderAccountId, amount, fungibleTokenId)
        await approveTokenTransfer(edClient, ecPrivateKey, ecAccountId, htsExamplesSmartContractId, 100, fungibleTokenId);
        await approveTokenTransfer(edClient, edPrivateKey, edAccountId, htsExamplesSmartContractId, 100, fungibleTokenId);


        /// NFT Preps


    });

    after(async function () {
        console.log(testResults);

        // close clients
        await ecClient.close();
        await edClient.close();
        await recipientClient.close();
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

    const testCase2 = "A smart contract execution of a system contract HTS CryptoTransfer of 1 tiny bar";
    it(testCase2, async function() {
        // Using ContractExecuteTransaction
        for (const client of Object.values(clients)) {
            const tx = await getHbarTransferHTSExampleContractCallTransaction(htsExamplesSmartContractId, recipientAccountEvmAddress);
            //const tx = await getHbarTransferHTSExampleContractCallTransaction("0.0.27529", recipientAccountEvmAddress);
            const txResponse = await tx.execute(client.client);
            await assertAndReportCost(txResponse, client, testResults, testCase2 + " (ContractExecuteTransaction)");
        }

        // Using EthereumTransaction        
        for (const client of Object.values(clients)) {
            const txET = await getHbarTransferHTSExampleEthererumTransaction(htsExamplesSmartContractEVMAddress, recipientAccountEvmAddress);
            //const txET = await getHbarTransferHTSExampleEthererumTransaction("0x0000000000000000000000000000000000006b89", recipientAccountEvmAddress);
            const txResponseET = await txET.execute(client.client);
            await assertAndReportCost(txResponseET, client, testResults, testCase2 + " (EthereumTransaction)");
            // wait a couple seconds for the nonce to reflect on the mirror node
            await new Promise(r => setTimeout(r, 3000));
        }
    });

    const testCase3 = "A smart contract execution of a system contract HTS CryptoTransfer of 1 fungible token";
    it.only(testCase3, async function() {
        // Using ContractExecuteTransaction
        for (const client of Object.values(clients)) {
            //async function getFungibleTokenTransferHTSExampleContractCallTransaction(htsExamplesSmartContractId, senderEVMAddress, recipientAccountEvmAddress, fungibleTokenEVMAddress) {
            const tx = await getFungibleTokenTransferHTSExampleContractCallTransaction(htsExamplesSmartContractId, client.longZero, recipientAccountEvmAddress, fungibleTokenEVMAddress);
            const txResponse = await tx.execute(client.client);
            await assertAndReportCost(txResponse, client, testResults, testCase3 + " (ContractExecuteTransaction)");
        }

        // Using EthereumTransaction        
        for (const client of Object.values(clients)) {
            // async function getFungibleTokenTransferHTSExampleEthererumTransaction(htsExamplesSmartContractEVMAddress, senderEVMAddress, recipientAccountEvmAddress, fungibleTokenEVMAddress) {
            const txET = await getFungibleTokenTransferHTSExampleEthererumTransaction(htsExamplesSmartContractEVMAddress, client.longZero, recipientAccountEvmAddress, fungibleTokenEVMAddress);
            const txResponseET = await txET.execute(client.client);
            await assertAndReportCost(txResponseET, client, testResults, testCase3 + " (EthereumTransaction)");
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

function convertAccountIdtoLongZeroAddress(accountId) {

    const parts = accountId.split(".");
    const lastPart = parts[2];

    const hexValue = parseInt(lastPart).toString(16).padStart(40, '0');
    const longZero = `0x${hexValue}`;
    
    return longZero;
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