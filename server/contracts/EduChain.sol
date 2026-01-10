// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EduChain {
    struct Record {
        string recordType;
        string recordId;
        string hash;
        uint256 timestamp;
        address submittedBy;
    }

    mapping(string => Record) public records;
    mapping(string => bool) public recordExists;
    
    event RecordStored(
        string indexed recordType,
        string indexed recordId,
        string hash,
        uint256 timestamp,
        address submittedBy
    );

    function storeRecord(
        string memory recordType,
        string memory recordId,
        string memory hash
    ) public {
        require(bytes(hash).length > 0, "Hash cannot be empty");
        require(!recordExists[hash], "Record already exists");

        records[hash] = Record({
            recordType: recordType,
            recordId: recordId,
            hash: hash,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        recordExists[hash] = true;

        emit RecordStored(
            recordType,
            recordId,
            hash,
            block.timestamp,
            msg.sender
        );
    }

    function getRecord(string memory hash) public view returns (
        string memory recordType,
        string memory recordId,
        uint256 timestamp
    ) {
        require(recordExists[hash], "Record does not exist");
        Record memory record = records[hash];
        return (record.recordType, record.recordId, record.timestamp);
    }

    function verifyRecord(string memory hash) public view returns (bool) {
        return recordExists[hash];
    }
}

