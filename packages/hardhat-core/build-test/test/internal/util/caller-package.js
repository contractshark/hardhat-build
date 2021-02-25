"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nested = __importStar(require("../../fixture-projects/nested-node-project/project/nested-caller-package-tester"));
const top = __importStar(require("../../fixture-projects/nested-node-project/top-caller-package-tester"));
describe("getClosestCallerPackage", () => {
    top.callFromNestedModule();
    top.callFromTopModule();
    top.indirectlyCallFromTopModule();
    describe("When calling directly from a package", () => {
        it("Should return the package it was called from", () => {
            chai_1.assert.equal(top.callFromTopModule(), "top-level-node-project");
            chai_1.assert.equal(nested.callFromNestedModule(), "nested-node-project");
        });
    });
    describe("When calling indirectly", () => {
        it("Should return the closest package from where it was called", () => {
            chai_1.assert.equal(top.callFromNestedModule(), "nested-node-project");
            chai_1.assert.equal(top.indirectlyCallFromTopModule(), "top-level-node-project");
            chai_1.assert.equal(nested.callFromTopModule(), "top-level-node-project");
            chai_1.assert.equal(nested.indirectlyCallFromNestedpModule(), "nested-node-project");
        });
    });
});
//# sourceMappingURL=caller-package.js.map