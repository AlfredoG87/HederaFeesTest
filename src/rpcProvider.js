// hederaClient.js
import { Client, PrivateKey, AccountBalanceQuery } from "@hashgraph/sdk";
import { ethers } from 'ethers';
import dotenv from "dotenv";

dotenv.config();


async function getRPCProvider() {
    const providerUrl = process.env.RPC_PROVIDER_URL;
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    return provider;
}

async function getWallet(provider) {
    const RPC_EC_PRIVATE_KEY = process.env.RPC_EC_PRIVATE_KEY;
    const wallet = new ethers.Wallet(RPC_EC_PRIVATE_KEY, provider);
    return wallet;
}

export { 
    getRPCProvider,
    getWallet
};
