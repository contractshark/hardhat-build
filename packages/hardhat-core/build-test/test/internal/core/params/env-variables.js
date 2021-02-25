"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const env_variables_1 = require("../../../../src/internal/core/params/env-variables");
const hardhat_params_1 = require("../../../../src/internal/core/params/hardhat-params");
const errors_1 = require("../../../helpers/errors");
// This is testing an internal function, which may seem weird, but its behaviour
// is 100% user facing.
describe("paramNameToEnvVariable", () => {
    it("should convert camelCase to UPPER_CASE and prepend HARDHAT_", () => {
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("a"), "HARDHAT_A");
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("B"), "HARDHAT_B");
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("AC"), "HARDHAT_A_C");
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("aC"), "HARDHAT_A_C");
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("camelCaseRight"), "HARDHAT_CAMEL_CASE_RIGHT");
        chai_1.assert.equal(env_variables_1.paramNameToEnvVariable("somethingAB"), "HARDHAT_SOMETHING_A_B");
    });
});
describe("Env vars arguments parsing", () => {
    it("Should use the default values if arguments are not defined", () => {
        const args = env_variables_1.getEnvHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, {
            IRRELEVANT_ENV_VAR: "123",
        });
        chai_1.assert.equal(args.help, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS.help.defaultValue);
        chai_1.assert.equal(args.network, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS.network.defaultValue);
        chai_1.assert.equal(args.emoji, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS.emoji.defaultValue);
        chai_1.assert.equal(args.showStackTraces, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS.showStackTraces.defaultValue);
        chai_1.assert.equal(args.version, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS.version.defaultValue);
    });
    it("Should accept values", () => {
        const args = env_variables_1.getEnvHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, {
            IRRELEVANT_ENV_VAR: "123",
            HARDHAT_NETWORK: "asd",
            HARDHAT_SHOW_STACK_TRACES: "true",
            HARDHAT_EMOJI: "true",
            HARDHAT_VERSION: "true",
            HARDHAT_HELP: "true",
        });
        chai_1.assert.equal(args.network, "asd");
        // These are not really useful, but we test them anyway
        chai_1.assert.equal(args.showStackTraces, true);
        chai_1.assert.equal(args.emoji, true);
        chai_1.assert.equal(args.version, true);
        chai_1.assert.equal(args.help, true);
    });
    it("should throw if an invalid value is passed", () => {
        errors_1.expectHardhatError(() => env_variables_1.getEnvHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, {
            HARDHAT_HELP: "123",
        }), errors_list_1.ERRORS.ARGUMENTS.INVALID_ENV_VAR_VALUE);
    });
});
describe("getEnvVariablesMap", () => {
    it("Should return the right map", () => {
        chai_1.assert.deepEqual(env_variables_1.getEnvVariablesMap({
            network: "asd",
            emoji: false,
            help: true,
            showStackTraces: true,
            version: false,
            verbose: true,
            config: undefined,
        }), {
            HARDHAT_NETWORK: "asd",
            HARDHAT_EMOJI: "false",
            HARDHAT_HELP: "true",
            HARDHAT_SHOW_STACK_TRACES: "true",
            HARDHAT_VERSION: "false",
            HARDHAT_VERBOSE: "true",
        });
    });
});
//# sourceMappingURL=env-variables.js.map