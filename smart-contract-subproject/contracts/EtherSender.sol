// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract EtherSender {
    // Event to log when ether is sent
    event EtherSent(address indexed to, uint256 amount);

    // Method to send ether to a specified address
    function sendEther(address payable _to) public payable {
        require(_to != address(0), "Invalid address");
        require(msg.value > 0, "Send some ether");

        _to.transfer(msg.value);
        emit EtherSent(_to, msg.value);
    }
}
