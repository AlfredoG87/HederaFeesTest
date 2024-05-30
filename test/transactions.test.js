// test/transactions.test.js
import { expect } from "chai";
import { createClient, createClientWithOperatorAccount } from "../src/hederaClient.js";
import {
    hcsMessageTransaction,    
    createHCSTopic,
    hbarTransferTransaction,
    createNewAccount,
    createFungibleToken,
    associateTokenToAccount,
    transferToken
} from "../src/transactions.js";

describe("Hedera Transaction Fee Tests", function () {
    this.timeout(60000); // Set timeout to 60 seconds

    let topicID;
    let edClient;
    let ecClient;
    let testResults = {};
    let clients = {};
    let recipientAccount;
    let fungibleTokenId;
    

    before(async function () {
        edClient = await createClient("ED");
        ecClient = await createClient("EC");
        clients["ED"] = { name: "ED", client: edClient};
        clients["EC"] = { name: "EC", client: ecClient};

        topicID = await createHCSTopic(edClient);

        recipientAccount = await createNewAccount(edClient, 5);
        console.log("Recipient Account ID: " + recipientAccount.accountId);

        // create a fungible token and associate it with all accounts transfer 100 tokens to each account
        fungibleTokenId = await createFungibleToken(edClient, "TokenName", "TokenSymbol", 1000);
        console.log("Fungible Token ID: " + fungibleTokenId);
        // associate the token to all accounts
        await associateTokenToAccount(ecClient, fungibleTokenId, ecClient.operatorAccountId);
        const recipientClient = await createClientWithOperatorAccount(recipientAccount.accountId, recipientAccount.privateKey);
        const txResponse = await associateTokenToAccount(recipientClient, fungibleTokenId, recipientAccount.accountId);
        console.log("Token associated with recipient account: " + txResponse);
        recipientClient.close();

        // transfer 100 tokens to EC account
        const transferTokenResponse = await transferToken(edClient, fungibleTokenId, edClient.operatorAccountId, ecClient.operatorAccountId, 100);
        console.log("Token transfer response: " + transferTokenResponse);

    });

    after(async function () {
        console.log(testResults);
        edClient.close();
        ecClient.close();
    });

    it("HCS message with 1 byte", async function () {        
        for (const client of Object.values(clients)) {
            const txResponse = await hcsMessageTransaction(client.client, topicID, "A");
            await assertAndReportCost(txResponse, client, testResults, "HCS message with 1 byte");
        }
    });

    it("1 Tinybar transfer", async function () {        
        for (const client of Object.values(clients)) {
            const txResponse = await hbarTransferTransaction(client.client, recipientAccount.accountId, 1);
            await assertAndReportCost(txResponse, client, testResults, "1 Tiny bar transfer");
        }
    });

    it("A fungible token transfer", async function () {
        for (const client of Object.values(clients)) {
            const txResponse = await transferToken(client.client, fungibleTokenId, client.client.operatorAccountId, recipientAccount.accountId, 5);
            await assertAndReportCost(txResponse, client, testResults, "A fungible token transfer");
        }
    });




    // Add more test cases for other transactions
});

async function assertAndReportCost(txResponse, client, testResults, testDescription) {
    const record = await txResponse.getRecord(client.client);
    const transactionFee = record.transactionFee.toTinybars();
    expect(transactionFee.toNumber()).to.be.greaterThan(0);
    testResults[`${testDescription} - KeyType: ${client.name}`] = transactionFee.toNumber();
}


/*
Transaction Type	HBAR Price
An HCS message w/ 1 byte with an ED key	
An HCS message w/ 1 byte with an EC key	

A 1 tiny bar Hbar transfer with an ED key	
A 1 tiny bar Hbar transfer with an EC key	

A fungible token transfer with an ED key	
A fungible token transfer with an EC key	

An NFT token transfer with an ED key	
An NFT token transfer with an EC key	
A smart contract execution of a simple value transfer of 1 tiny bar (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a simple value transfer of 1 tiny bar (ContractCall w EC key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 tiny bar (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 tiny bar (ContractCall w EC key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 fungible token (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 fungible token (ContractCall w EC key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 NFT (ContractCall w ED key and EthereumTransaction)	
A smart contract execution of a system contract HTS CryptoTransfer of 1 NFT (ContractCall w EC key and EthereumTransaction)
*/