"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../src/internal/core/errors-list");
const contract_names_1 = require("../../src/utils/contract-names");
const errors_1 = require("../helpers/errors");
describe("Solidity contract names utilities", function () {
    describe("getFullyQualifiedName", function () {
        it("Returns a fully qualified name", function () {
            chai_1.assert.equal(contract_names_1.getFullyQualifiedName("contract.sol", "C"), "contract.sol:C");
            chai_1.assert.equal(contract_names_1.getFullyQualifiedName("folder/contract.sol", "C"), "folder/contract.sol:C");
            chai_1.assert.equal(contract_names_1.getFullyQualifiedName("folder/a:b/contract.sol", "C"), "folder/a:b/contract.sol:C");
        });
    });
    describe("isFullyQualifiedName", function () {
        it("Correctly detects what's an FQN", function () {
            chai_1.assert.isTrue(contract_names_1.isFullyQualifiedName("contract.sol:C"));
            chai_1.assert.isTrue(contract_names_1.isFullyQualifiedName("folder/contract.sol:C"));
            chai_1.assert.isTrue(contract_names_1.isFullyQualifiedName("folder/a:b/contract.sol:C"));
        });
        it("Correctly detects what's not FQN", function () {
            chai_1.assert.isFalse(contract_names_1.isFullyQualifiedName("C"));
            chai_1.assert.isFalse(contract_names_1.isFullyQualifiedName("contract.sol"));
            chai_1.assert.isFalse(contract_names_1.isFullyQualifiedName("folder/contract.sol"));
        });
    });
    describe("parseFullyQualifiedName", function () {
        it("Parses valid FQNs correctly", function () {
            chai_1.assert.deepEqual(contract_names_1.parseFullyQualifiedName("contract.sol:C"), {
                sourceName: "contract.sol",
                contractName: "C",
            });
            chai_1.assert.deepEqual(contract_names_1.parseFullyQualifiedName("folder/contract.sol:C"), {
                sourceName: "folder/contract.sol",
                contractName: "C",
            });
            chai_1.assert.deepEqual(contract_names_1.parseFullyQualifiedName("folder/a:b/contract.sol:C"), {
                sourceName: "folder/a:b/contract.sol",
                contractName: "C",
            });
        });
        it("Throws if not a valid FQN", function () {
            errors_1.expectHardhatError(() => contract_names_1.parseFullyQualifiedName("C"), errors_list_1.ERRORS.CONTRACT_NAMES.INVALID_FULLY_QUALIFIED_NAME);
            errors_1.expectHardhatError(() => contract_names_1.parseFullyQualifiedName("contract.sol"), errors_list_1.ERRORS.CONTRACT_NAMES.INVALID_FULLY_QUALIFIED_NAME);
            errors_1.expectHardhatError(() => contract_names_1.parseFullyQualifiedName("folder/contract.sol"), errors_list_1.ERRORS.CONTRACT_NAMES.INVALID_FULLY_QUALIFIED_NAME);
        });
    });
    describe("parseName", function () {
        it("Parses valid FQNs correctly", function () {
            chai_1.assert.deepEqual(contract_names_1.parseName("contract.sol:C"), {
                sourceName: "contract.sol",
                contractName: "C",
            });
            chai_1.assert.deepEqual(contract_names_1.parseName("folder/contract.sol:C"), {
                sourceName: "folder/contract.sol",
                contractName: "C",
            });
            chai_1.assert.deepEqual(contract_names_1.parseName("folder/a:b/contract.sol:C"), {
                sourceName: "folder/a:b/contract.sol",
                contractName: "C",
            });
        });
        it("Parses bare contract names", function () {
            chai_1.assert.deepEqual(contract_names_1.parseName("C"), {
                contractName: "C",
            });
            chai_1.assert.deepEqual(contract_names_1.parseName("Hola"), {
                contractName: "Hola",
            });
        });
    });
});
//# sourceMappingURL=contract-names.js.map