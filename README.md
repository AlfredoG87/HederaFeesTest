This project aims at getting the actual fees charged for diffeent operations on the Hedera Network. The project uses the Hedera SDK to interact with the Hedera Network and get the actual fees charged for different operations.


## Running the Project

To run the project, follow these steps:

1. Fill in the environment variables by creating a file named `.env` in the root directory of the project.
2. Open the `.env` file and add the following variables:

    ```plaintext
        # ED Previewnet
        ED_PRIVATE_KEY=
        ED_ACCOUNT_ID=
        # EC Previewnet
        EC_PRIVATE_KEY=
        EC_ACCOUNT_ID=
        # For RPC Provider and Ether Wallet
        RPC_PROVIDER_URL=
        RPC_EC_PRIVATE_KEY=
    ```

3. Install the required dependencies by running the following command in the terminal:

    ```shell
    npm install
    ```

4. Compile the needed smart contracts
    ```shell
    cd smart-contract-subproject
    npm install
    npx hardhat compile
    ```

4. Run the tests by executing the following command:

    ```shell
    npm test
    ```

That's it! You should now be able to run the project and execute the tests successfully.