// hederaClient.js
import { Client, PrivateKey, AccountBalanceQuery } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function createClient(type) {
    let accountId, privateKey;

    if (type === "ED") {
        accountId = process.env.ED_ACCOUNT_ID;
        privateKey = PrivateKey.fromStringDer(process.env.ED_PRIVATE_KEY);
    } else if (type === "EC") {
        accountId = process.env.EC_ACCOUNT_ID;
        privateKey = PrivateKey.fromStringDer(process.env.EC_PRIVATE_KEY);
    } else {
        throw new Error("Invalid key type specified. Use 'ED' or 'EC'.");
    }

    if (!accountId || !privateKey) {
        throw new Error("Environment variables are missing");
    }

    const client = Client.forPreviewnet(); // Use Client.forMainnet() for mainnet
    client.setOperator(accountId, privateKey);

    return client;
}

async function createClientWithOperatorAccount(accountId, privateKey) {
    if (!accountId || !privateKey) {
        throw new Error("Account ID or Private Key is missing");
    }

    const client = Client.forPreviewnet(); // Use Client.forMainnet() for mainnet
    client.setOperator(accountId, privateKey);

    return client;
}   


export { 
    createClient,
    createClientWithOperatorAccount 
};
