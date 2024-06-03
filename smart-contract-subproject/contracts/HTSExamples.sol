// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./HederaResponseCodes.sol";
import "./IHederaTokenService.sol";
import "./ExpiryHelper.sol";
import "./KeyHelper.sol";

contract HTSExamples is HederaTokenService, ExpiryHelper, KeyHelper {

    event ResponseCode(int responseCode);
    event HbarTransferParams(address sender, address recipient, int64 amount);
    event TokenTransferParams(address sender, address recipient, int64 amount, address tokenId);

    function trasnsferHbar(address recipient, int64 amount) public returns (int responseCode) {

        emit HbarTransferParams(msg.sender, recipient, amount);

        IHederaTokenService.TransferList memory transferList = IHederaTokenService.TransferList(
            new IHederaTokenService.AccountAmount[](2)
        );

        // sender account
        transferList.transfers[0] = IHederaTokenService.AccountAmount(msg.sender, -amount, false);        
        transferList.transfers[1] = IHederaTokenService.AccountAmount(recipient, amount, false);        

        IHederaTokenService.TokenTransferList[] memory tokenTransferList = new IHederaTokenService.TokenTransferList[](0);

        responseCode = HederaTokenService.cryptoTransfer(transferList, tokenTransferList);
        
        emit ResponseCode(responseCode);
    }

    function transferHTS(address sender, address recipient, int64 amount, address tokenId) public returns (int responseCode) {
        
        emit TokenTransferParams(sender, recipient, amount, tokenId);

        // create transfer list for hbar empty
        IHederaTokenService.TransferList memory hbarTransferList = IHederaTokenService.TransferList(new IHederaTokenService.AccountAmount[](0));

        // empty nft transfer list
        IHederaTokenService.NftTransfer[] memory nftTransferList = new IHederaTokenService.NftTransfer[](0);

        // create account amount list
        IHederaTokenService.AccountAmount[] memory accountAmounts = new IHederaTokenService.AccountAmount[](2);
        accountAmounts[0] = IHederaTokenService.AccountAmount(sender, -amount, false);
        accountAmounts[1] = IHederaTokenService.AccountAmount(recipient, amount, false);

        // create token transfer list with token id, account amounts and nft transfer list
        IHederaTokenService.TokenTransferList[] memory tokenTransferList = new IHederaTokenService.TokenTransferList[](1);
        tokenTransferList[0] = IHederaTokenService.TokenTransferList(tokenId, accountAmounts, nftTransferList);

        // call crypto transfer
        responseCode = HederaTokenService.cryptoTransfer(hbarTransferList, tokenTransferList);

        emit ResponseCode(responseCode);
    }

}
