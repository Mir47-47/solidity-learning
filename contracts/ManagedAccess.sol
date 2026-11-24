// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    address public manager;

    address[] public managers;
    mapping(address => bool) public confirmed;

    function isManager(address account) public view returns (bool) {
        for (uint256 i = 0; i < managers.length; i++) {
            if (managers[i] == account) return true;
        }
        return false;
    }

    function addManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Manager cannot be zero address");
        require(!isManager(_manager), "Manager already registered");
        managers.push(_manager);
    }

    function confirm() external {
        require(isManager(msg.sender), "You are not a manager");
        confirmed[msg.sender] = true;
    }

    modifier onlyAllConfirmed() {
        require(isManager(msg.sender), "You are not a manager");
        require(managers.length >= 3, "Not all confirmed yet");
        for (uint256 i = 0; i < managers.length; i++) {
            require(confirmed[managers[i]], "Not all confirmed yet");
            confirmed[managers[i]] = false;
        }
        _;
    }

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;

    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "You are not authorized to manage this contract");
        _;
    }
}
