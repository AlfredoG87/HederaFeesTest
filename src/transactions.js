// transactions.js
import {
    TransferTransaction,
    TokenCreateTransaction,
    TokenAssociateTransaction,
    TokenType,
    TransactionReceiptQuery,
    Hbar,
    TopicCreateTransaction,
    TopicMessage,
    TopicMessageSubmitTransaction,
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
    TokenMintTransaction
} from "@hashgraph/sdk";

async function createHCSTopic(client) {
    // Create a new topic
    const transaction = new TopicCreateTransaction();
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    return receipt.topicId;
}

async function hcsMessageTransaction(client, topic, message) {
    
    const transaction = new TopicMessageSubmitTransaction({
        topicId: topic,
        message: message
    });
    
    const txResponse = await transaction.execute(client);

    return txResponse;
}

let accounts = {};

async function createNewAccount(client, hbarAmount) {
    //Create new keys
    const newAccountPrivateKey = PrivateKey.generateED25519(); 
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    //Create new account and assign the public key
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(100_000_000*hbarAmount))
        .execute(client);
        
        // Get the new account ID
        const getReceipt = await newAccount.getReceipt(client);
        const newAccountId = getReceipt.accountId;
        
        //console.log("The new account ID is: " +newAccountId);
        const accountDetails = { privateKey: newAccountPrivateKey, publicKey: newAccountPublicKey, accountId: newAccountId };
        accounts[newAccountId] = accountDetails;
        return accountDetails;
}

async function createNewEcAccount(client, hbarAmount) {
    //Create new keys
    const newAccountPrivateKey = PrivateKey.generateECDSA(); 
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    //Create new account and assign the public key
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(100_000_000*hbarAmount))
        .execute(client);
        
        // Get the new account ID
        const getReceipt = await newAccount.getReceipt(client);
        const newAccountId = getReceipt.accountId;
        
        //console.log("The new account ID is: " +newAccountId);
        const accountDetails = { privateKey: newAccountPrivateKey, publicKey: newAccountPublicKey, accountId: newAccountId };
        accounts[newAccountId] = accountDetails;
        return accountDetails;
}

async function hbarTransferTransaction(client, recipient, amount) {
    const transaction = new TransferTransaction()
        .addHbarTransfer(client.operatorAccountId, Hbar.fromTinybars(-amount))
        .addHbarTransfer(recipient, Hbar.fromTinybars(amount));

    const txResponse = await transaction.execute(client);

    return txResponse;    
}

async function createFungibleToken(client, tokenName, tokenSymbol, initialSupply) {
    const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(0)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(client.operatorAccountId)
        .setTokenType(TokenType.FungibleCommon)
        .setAdminKey(client.operatorPublicKey);
        

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.tokenId;
}


async function createNFTToken(client, tokenName, tokenSymbol) {
    const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(client.operatorAccountId)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyKey(client.operatorPublicKey)
        .setAdminKey(client.operatorPublicKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.tokenId;
}

async function mintNFTToken(client, tokenId) {
    const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from("metadata1"), Buffer.from("metadata2")]);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);    

    return receipt.serials[0].low;
}


async function associateTokenToAccount(client, tokenId, accountId) {
    const transaction = new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId]);

    const txResponse = await transaction.execute(client);

    return txResponse;
}

async function transferToken(client, tokenId, senderId, recipientId, amount) {
    const transaction = new TransferTransaction()
        .addTokenTransfer(tokenId, senderId, -amount)
        .addTokenTransfer(tokenId, recipientId, amount);

    const txResponse = await transaction.execute(client);

    return txResponse;
}

async function transferNFTToken(client, tokenId, recipientId, serialId) {
    const transaction = new TransferTransaction()
        .addNftTransfer(tokenId, serialId, client.operatorAccountId, recipientId);

    const txResponse = await transaction.execute(client);

    return txResponse;
}

export {
    createHCSTopic,
    hcsMessageTransaction,
    hbarTransferTransaction,
    createNewAccount,
    createNewEcAccount,
    createFungibleToken,
    associateTokenToAccount,
    transferToken,
    createNFTToken,
    mintNFTToken,
    transferNFTToken
};
