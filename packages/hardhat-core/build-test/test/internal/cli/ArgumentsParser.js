"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-string-literal */ // TODO this is for unit testing priv methods. We shouldn't test these at all?
const chai_1 = require("chai");
const ArgumentsParser_1 = require("../../../src/internal/cli/ArgumentsParser");
const errors_list_1 = require("../../../src/internal/core/errors-list");
const argumentTypes_1 = require("../../../src/internal/core/params/argumentTypes");
const hardhat_params_1 = require("../../../src/internal/core/params/hardhat-params");
const task_definitions_1 = require("../../../src/internal/core/tasks/task-definitions");
const errors_1 = require("../../helpers/errors");
describe("ArgumentsParser", () => {
    let argumentsParser;
    let envArgs;
    let taskDefinition;
    let overridenTaskDefinition;
    beforeEach(() => {
        argumentsParser = new ArgumentsParser_1.ArgumentsParser();
        envArgs = {
            network: "test",
            showStackTraces: false,
            version: false,
            help: false,
            emoji: false,
            verbose: false,
        };
        taskDefinition = new task_definitions_1.SimpleTaskDefinition("compile", true)
            .addParam("param", "just a param", "a default value", argumentTypes_1.string)
            .addParam("bleep", "useless param", 1602, argumentTypes_1.int, true);
        const baseTaskDefinition = new task_definitions_1.SimpleTaskDefinition("overriddenTask")
            .addParam("strParam", "a str param", "defaultValue", argumentTypes_1.string)
            .addFlag("aFlag", "a flag param");
        overridenTaskDefinition = new task_definitions_1.OverriddenTaskDefinition(baseTaskDefinition)
            .addFlag("overriddenFlag", "added flag param")
            .addOptionalParam("overriddenOptParam", "added opt param");
    });
    it("should transform a param name into CLA", () => {
        chai_1.assert.equal(ArgumentsParser_1.ArgumentsParser.paramNameToCLA("showStackTraces"), "--show-stack-traces");
        chai_1.assert.equal(ArgumentsParser_1.ArgumentsParser.paramNameToCLA("version"), "--version");
    });
    it("Should throw if a param name CLA isn't all lowercase", () => {
        errors_1.expectHardhatError(() => ArgumentsParser_1.ArgumentsParser.cLAToParamName("--showStackTraces"), errors_list_1.ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING);
        errors_1.expectHardhatError(() => ArgumentsParser_1.ArgumentsParser.cLAToParamName("--showstackTraces"), errors_list_1.ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING);
        errors_1.expectHardhatError(() => ArgumentsParser_1.ArgumentsParser.cLAToParamName("--show-stack-Traces"), errors_list_1.ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING);
    });
    it("should transform CLA into a param name", () => {
        chai_1.assert.equal(ArgumentsParser_1.ArgumentsParser.cLAToParamName("--run"), "run");
        chai_1.assert.equal(ArgumentsParser_1.ArgumentsParser.cLAToParamName("--show-stack-traces"), "showStackTraces");
    });
    it("should detect param name format", () => {
        chai_1.assert.isTrue(argumentsParser["_hasCLAParamNameFormat"]("--run"));
        chai_1.assert.isFalse(argumentsParser["_hasCLAParamNameFormat"]("run"));
    });
    it("should detect parameter names", () => {
        chai_1.assert.isTrue(argumentsParser["_isCLAParamName"]("--show-stack-traces", hardhat_params_1.HARDHAT_PARAM_DEFINITIONS));
        chai_1.assert.isFalse(argumentsParser["_isCLAParamName"]("sarasa", hardhat_params_1.HARDHAT_PARAM_DEFINITIONS));
        chai_1.assert.isFalse(argumentsParser["_isCLAParamName"]("--sarasa", hardhat_params_1.HARDHAT_PARAM_DEFINITIONS));
    });
    describe("hardhat arguments", () => {
        it("should parse hardhat arguments with task", () => {
            const rawCLAs = [
                "--show-stack-traces",
                "--network",
                "local",
                "compile",
                "--task-param",
            ];
            const { hardhatArguments, taskName, unparsedCLAs, } = argumentsParser.parseHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, rawCLAs);
            chai_1.assert.equal(taskName, "compile");
            chai_1.assert.equal(hardhatArguments.showStackTraces, true);
            chai_1.assert.equal(hardhatArguments.network, "local");
            chai_1.assert.equal(hardhatArguments.emoji, false);
            chai_1.assert.equal(unparsedCLAs.length, 1);
            chai_1.assert.equal("--task-param", unparsedCLAs[0]);
        });
        it("should parse hardhat arguments after taskname", () => {
            const rawCLAs = [
                "compile",
                "--task-param",
                "--show-stack-traces",
                "--network",
                "local",
            ];
            const { hardhatArguments, taskName, unparsedCLAs, } = argumentsParser.parseHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, rawCLAs);
            chai_1.assert.equal(taskName, "compile");
            chai_1.assert.equal(hardhatArguments.showStackTraces, true);
            chai_1.assert.equal(hardhatArguments.network, "local");
            chai_1.assert.equal(hardhatArguments.emoji, false);
            chai_1.assert.equal(unparsedCLAs.length, 1);
            chai_1.assert.equal("--task-param", unparsedCLAs[0]);
        });
        it("should fail trying to parse task arguments before taskname", () => {
            const rawCLAs = [
                "--task-param",
                "compile",
                "--show-stack-traces",
                "--network",
                "local",
            ];
            errors_1.expectHardhatError(() => argumentsParser.parseHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, rawCLAs), errors_list_1.ERRORS.ARGUMENTS.UNRECOGNIZED_COMMAND_LINE_ARG);
        });
        it("should parse a hardhat argument", () => {
            const rawCLAs = [
                "--show-stack-traces",
                "--network",
                "local",
                "compile",
            ];
            const hardhatArguments = {};
            chai_1.assert.equal(0, argumentsParser["_parseArgumentAt"](rawCLAs, 0, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, hardhatArguments));
            chai_1.assert.equal(hardhatArguments.showStackTraces, true);
            chai_1.assert.equal(2, argumentsParser["_parseArgumentAt"](rawCLAs, 1, hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, hardhatArguments));
            chai_1.assert.equal(hardhatArguments.network, "local");
        });
        it("should fail trying to parse hardhat with invalid argument", () => {
            const rawCLAs = [
                "--show-stack-traces",
                "--network",
                "local",
                "--invalid-param",
            ];
            errors_1.expectHardhatError(() => argumentsParser.parseHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, rawCLAs), errors_list_1.ERRORS.ARGUMENTS.UNRECOGNIZED_COMMAND_LINE_ARG);
        });
        it("should fail trying to parse a repeated argument", () => {
            const rawCLAs = [
                "--show-stack-traces",
                "--network",
                "local",
                "--network",
                "local",
                "compile",
            ];
            errors_1.expectHardhatError(() => argumentsParser.parseHardhatArguments(hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, rawCLAs), errors_list_1.ERRORS.ARGUMENTS.REPEATED_PARAM);
        });
        it("should only add non-present arguments", () => {
            const hardhatArguments = argumentsParser["_addHardhatDefaultArguments"](hardhat_params_1.HARDHAT_PARAM_DEFINITIONS, envArgs, {
                showStackTraces: true,
            });
            chai_1.assert.isTrue(hardhatArguments.showStackTraces);
            chai_1.assert.isFalse(hardhatArguments.emoji);
        });
    });
    describe("tasks arguments", () => {
        it("should parse tasks arguments", () => {
            const rawCLAs = ["--param", "testing", "--bleep", "1337"];
            const { paramArguments, rawPositionalArguments } = argumentsParser["_parseTaskParamArguments"](taskDefinition, rawCLAs);
            chai_1.assert.deepEqual(paramArguments, { param: "testing", bleep: 1337 });
            chai_1.assert.equal(rawPositionalArguments.length, 0);
        });
        it("should parse overridden tasks arguments", () => {
            const rawCLAs = [
                "--str-param",
                "testing",
                "--a-flag",
                "--overridden-flag",
                "--overridden-opt-param",
                "optValue",
            ];
            const { paramArguments, rawPositionalArguments } = argumentsParser["_parseTaskParamArguments"](overridenTaskDefinition, rawCLAs);
            chai_1.assert.deepEqual(paramArguments, {
                strParam: "testing",
                aFlag: true,
                overriddenFlag: true,
                overriddenOptParam: "optValue",
            });
            chai_1.assert.equal(rawPositionalArguments.length, 0);
        });
        it("should parse task with variadic arguments", () => {
            taskDefinition.addVariadicPositionalParam("variadic", "a variadic params", [], argumentTypes_1.int);
            const rawPositionalArguments = ["16", "02"];
            const positionalArguments = argumentsParser["_parsePositionalParamArgs"](rawPositionalArguments, taskDefinition.positionalParamDefinitions);
            chai_1.assert.deepEqual(positionalArguments.variadic, [16, 2]);
        });
        it("should parse task with default variadic arguments", () => {
            taskDefinition.addVariadicPositionalParam("variadic", "a variadic params", [1729], argumentTypes_1.int);
            const rawPositionalArguments = [];
            // tslint:disable-next-line:no-string-literal
            const positionalArguments = argumentsParser["_parsePositionalParamArgs"](rawPositionalArguments, taskDefinition.positionalParamDefinitions);
            chai_1.assert.deepEqual(positionalArguments.variadic, [1729]);
        });
        it("should fail when passing invalid parameter", () => {
            const rawCLAs = ["--invalid-parameter", "not_valid"];
            errors_1.expectHardhatError(() => {
                argumentsParser.parseTaskArguments(taskDefinition, rawCLAs);
            }, errors_list_1.ERRORS.ARGUMENTS.UNRECOGNIZED_PARAM_NAME);
        });
        it("should fail to parse task without non optional variadic arguments", () => {
            const rawCLAs = ["--param", "testing", "--bleep", "1337"];
            taskDefinition.addVariadicPositionalParam("variadic", "a variadic params");
            errors_1.expectHardhatError(() => {
                argumentsParser.parseTaskArguments(taskDefinition, rawCLAs);
            }, errors_list_1.ERRORS.ARGUMENTS.MISSING_POSITIONAL_ARG);
        });
        it("should fail to parse task without non optional argument", () => {
            const rawCLAs = [];
            const definition = new task_definitions_1.SimpleTaskDefinition("compile", true);
            definition.addParam("param", "just a param");
            definition.addParam("bleep", "useless param", 1602, argumentTypes_1.int, true);
            errors_1.expectHardhatError(() => {
                argumentsParser.parseTaskArguments(definition, rawCLAs);
            }, errors_list_1.ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT);
        });
        it("should fail trying to parse unrecognized positional argument", () => {
            const rawCLAs = [];
            const definition = new task_definitions_1.SimpleTaskDefinition("compile", true);
            definition.addParam("param", "just a param");
            definition.addParam("bleep", "useless param", 1602, argumentTypes_1.int, true);
            errors_1.expectHardhatError(() => {
                argumentsParser.parseTaskArguments(definition, rawCLAs);
            }, errors_list_1.ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT);
        });
        it("should fail when passing unneeded arguments", () => {
            const rawCLAs = ["more", "arguments"];
            errors_1.expectHardhatError(() => {
                argumentsParser.parseTaskArguments(taskDefinition, rawCLAs);
            }, errors_list_1.ERRORS.ARGUMENTS.UNRECOGNIZED_POSITIONAL_ARG);
        });
        it("should parse task with positional arguments", () => {
            const rawCLAs = [
                "--param",
                "testing",
                "--bleep",
                "1337",
                "foobar",
            ];
            taskDefinition.addPositionalParam("positional", "a posititon param");
            const args = argumentsParser.parseTaskArguments(taskDefinition, rawCLAs);
            chai_1.assert.deepEqual(args, {
                param: "testing",
                bleep: 1337,
                positional: "foobar",
            });
        });
        it("Should throw the right error if the last CLA is a non-flag --param", () => {
            const rawCLAs = ["--b"];
            taskDefinition = new task_definitions_1.SimpleTaskDefinition("t", false)
                .addOptionalParam("b", "A boolean", true, argumentTypes_1.boolean)
                .setAction(async () => { });
            errors_1.expectHardhatError(() => argumentsParser.parseTaskArguments(taskDefinition, rawCLAs), errors_list_1.ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT);
        });
    });
});
//# sourceMappingURL=ArgumentsParser.js.map