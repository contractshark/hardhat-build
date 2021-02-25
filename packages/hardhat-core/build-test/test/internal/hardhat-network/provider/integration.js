"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const environment_1 = require("../../../helpers/environment");
const project_1 = require("../../../helpers/project");
describe("Provider integration tests", function () {
    describe("Solidity stack traces", function () {
        project_1.useFixtureProject("solidity-stack-traces-integration");
        environment_1.useEnvironment();
        it("Should compile", async function () {
            await this.env.run("compile");
            const artifact = await fs_extra_1.default.readJSON("artifacts/contracts/Contract.sol/Contract.json");
            try {
                await this.env.network.provider.send("eth_sendTransaction", [
                    {
                        data: artifact.bytecode,
                    },
                ]);
            }
            catch (error) {
                chai_1.assert.include(error.stack, "Contract.sol:");
                // These exceptions should not have a code property, or Ethereum libs
                // treat them as JSON-RPC responses, capturing them and loosing their
                // stack trace.
                chai_1.assert.isUndefined(error.code);
                return;
            }
            chai_1.assert.fail("Exception expected but not thrown");
        });
    });
});
//# sourceMappingURL=integration.js.map