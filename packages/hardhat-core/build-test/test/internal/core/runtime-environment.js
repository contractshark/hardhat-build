"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const config_1 = require("../../../src/config");
const context_1 = require("../../../src/internal/context");
const default_config_1 = require("../../../src/internal/core/config/default-config");
const errors_list_1 = require("../../../src/internal/core/errors-list");
const runtime_environment_1 = require("../../../src/internal/core/runtime-environment");
const reset_1 = require("../../../src/internal/reset");
const errors_1 = require("../../helpers/errors");
const project_1 = require("../../helpers/project");
describe("Environment", () => {
    const config = {
        defaultNetwork: "default",
        networks: {
            localhost: Object.assign({ url: "http://localhosthost:8545" }, default_config_1.defaultHttpNetworkParams),
            hardhat: Object.assign(Object.assign({}, default_config_1.defaultHardhatNetworkParams), { accounts: [] }),
            default: Object.assign({ url: "http://localhost:8545" }, default_config_1.defaultHttpNetworkParams),
        },
        paths: {
            root: "",
            configFile: "",
            cache: "",
            artifacts: "",
            sources: "",
            tests: "",
        },
        solidity: {
            compilers: [
                {
                    version: "0.5.0",
                    settings: {
                        evmVersion: "byzantium",
                        optimizer: {
                            enabled: false,
                            runs: 0,
                        },
                    },
                },
            ],
            overrides: {},
        },
        mocha: {},
    };
    const args = {
        network: "localhost",
        showStackTraces: false,
        version: false,
        help: false,
        emoji: false,
        verbose: false,
    };
    let tasks;
    let env;
    let dsl;
    beforeEach(() => {
        const ctx = context_1.HardhatContext.createHardhatContext();
        dsl = ctx.tasksDSL;
        dsl.task("example", async (ret) => {
            return 27;
        });
        dsl
            .task("complexExampleTask", "a complex example task")
            .addPositionalParam("positionalRequiredStringParam", "a positional required type 'string' param", undefined, config_1.types.string, false)
            .addOptionalPositionalParam("posOptJsonParamWithDefault", "a positional optional type 'json' param", { a: 1 }, config_1.types.json)
            .setAction(async () => 42);
        dsl
            .task("taskWithMultipleTypesParams", "a task with many types params")
            .addFlag("flagParam", "some flag")
            .addOptionalParam("optIntParam", "an opt int param", 123, config_1.types.int)
            .addOptionalParam("optFloatParam", "an opt float param", 2.5, config_1.types.float)
            .addOptionalParam("optFileParam", "an opt file param", undefined, config_1.types.inputFile)
            .addOptionalParam("optStringParam", "an opt string param", "some default", config_1.types.string)
            .addOptionalVariadicPositionalParam("variadicOptStrParam", "an opt variadic 'str' param", [], config_1.types.string)
            .setAction(async () => 42);
        tasks = ctx.tasksDSL.getTaskDefinitions();
        env = new runtime_environment_1.Environment(config, args, tasks);
        ctx.setHardhatRuntimeEnvironment(env);
    });
    afterEach(() => reset_1.resetHardhatContext());
    describe("Environment", () => {
        it("should create an environment", () => {
            chai_1.assert.deepEqual(env.config, config);
            chai_1.assert.isDefined(env.tasks);
            chai_1.assert.isDefined(env.network);
        });
        it("should run a task correctly", async () => {
            const ret = await env.run("example");
            chai_1.assert.equal(ret, 27);
        });
        describe("run task arguments validation", () => {
            it("should throw on missing required argument", async () => {
                const taskName = "complexExampleTask";
                const requiredParamName = "positionalRequiredStringParam";
                const task = env.tasks[taskName];
                const param = task.positionalParamDefinitions.find(({ name }) => name === requiredParamName);
                chai_1.assert.isDefined(param);
                // task runs with required param present
                const taskResult = await env.run(taskName, {
                    [requiredParamName]: "some value",
                });
                chai_1.assert.isDefined(taskResult);
                // same task throws with required param missing
                await errors_1.expectHardhatErrorAsync(async () => {
                    await env.run("complexExampleTask", {});
                }, errors_list_1.ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT);
            });
            it("should use default value on missing optional argument with default param", async () => {
                const taskName = "complexExampleTask";
                const optParamName = "posOptJsonParamWithDefault";
                const task = env.tasks[taskName];
                const param = task.positionalParamDefinitions.find(({ name }) => name === optParamName);
                chai_1.assert.isDefined(param);
                // specified arg value, should be different from the default for this test
                const paramValue = { value: 20 };
                const { defaultValue } = param;
                chai_1.assert.notEqual(defaultValue, paramValue);
                const taskMinimalArgs = {
                    positionalRequiredStringParam: "a string value",
                };
                const taskArgumentsSpecified = Object.assign(Object.assign({}, taskMinimalArgs), { [optParamName]: paramValue });
                // setup task action spy
                const taskActionSpy = sinon_1.default.spy(task, "action");
                // task should run with *specified* value on defined param argument
                await env.run(taskName, taskArgumentsSpecified);
                // task should run with *default* value on empty param argument
                await env.run(taskName, taskMinimalArgs);
                // assertions
                const [taskWithSpecifiedArgsCall, taskWithDefaultArgsCall,] = taskActionSpy.getCalls();
                chai_1.assert.equal(taskWithSpecifiedArgsCall.args[0][optParamName], paramValue, "should include specified param value in task action call");
                chai_1.assert.equal(taskWithDefaultArgsCall.args[0][optParamName], defaultValue, "should include default param value in task action call");
            });
            it("should validate argument type matches the param type", async () => {
                const taskName = "taskWithMultipleTypesParams";
                const typesValidationTestCases = {
                    flagParam: { valid: true, invalid: 1 },
                    optIntParam: { valid: 10, invalid: 1.2 },
                    optFloatParam: { valid: 1.2, invalid: NaN },
                    optStringParam: { valid: "a string", invalid: 123 },
                    optFileParam: { valid: __filename, invalid: __dirname },
                    variadicOptStrParam: { valid: ["a", "b"], invalid: ["a", 1] },
                };
                const expectTaskRunsSuccesfully = async (taskNameToRun, taskArguments) => {
                    const argsString = JSON.stringify(taskArguments);
                    try {
                        await env.run(taskNameToRun, taskArguments);
                    }
                    catch (error) {
                        chai_1.assert.fail(error, undefined, `Should not throw error task ${taskNameToRun} with args ${argsString}. Error message: ${error.message || error}`);
                    }
                };
                const expectTaskRunsWithError = async (taskNameToRun, taskArguments) => {
                    await errors_1.expectHardhatErrorAsync(async () => {
                        await env.run(taskNameToRun, taskArguments);
                        console.error(`should have thrown task run: '${taskNameToRun}' with arguments: `, taskArguments);
                    }, errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
                };
                for (const [paramName, { valid, invalid }] of Object.entries(typesValidationTestCases)) {
                    // should run task successfully with valid type arguments
                    const validTaskArguments = { [paramName]: valid };
                    await expectTaskRunsSuccesfully(taskName, validTaskArguments);
                    // should throw error with argument of type not same type as the param type
                    const invalidTaskArguments = { [paramName]: invalid };
                    await expectTaskRunsWithError(taskName, invalidTaskArguments);
                }
            });
        });
        it("should fail trying to run a non existent task", () => {
            env.run("invalid").catch((err) => {
                chai_1.assert.equal(err.number, errors_list_1.ERRORS.ARGUMENTS.UNRECOGNIZED_TASK.number);
            });
        });
        it("should clean global state after task execution", async () => {
            chai_1.assert.equal(await env.run("example"), 27);
            const globalAsAny = global;
            chai_1.assert.isUndefined(globalAsAny.hre);
            chai_1.assert.isUndefined(globalAsAny.runSuper);
            chai_1.assert.isUndefined(globalAsAny.env);
        });
        it("should run overridden task correctly", async () => {
            dsl.task("example", "description", async (ret) => {
                return 28;
            });
            tasks = dsl.getTaskDefinitions();
            const localEnv = new runtime_environment_1.Environment(config, args, tasks);
            chai_1.assert.equal(await localEnv.run("example"), 28);
        });
        it("Should preserve the injected env after running a sub-task", async () => {
            dsl.task("with-subtask", "description", async ({}, hre, runSuper) => {
                const { run, config: theConfig, network } = hre;
                const globalAsAny = global;
                chai_1.assert.equal(globalAsAny.hre, hre);
                chai_1.assert.equal(globalAsAny.config, theConfig);
                chai_1.assert.isDefined(globalAsAny.config);
                chai_1.assert.equal(globalAsAny.runSuper, runSuper);
                chai_1.assert.isDefined(globalAsAny.network);
                await run("example");
                chai_1.assert.equal(globalAsAny.config, theConfig);
                chai_1.assert.equal(globalAsAny.runSuper, runSuper);
                chai_1.assert.equal(globalAsAny.network, network);
            });
            await env.run("with-subtask");
        });
        it("Should define the network field correctly", () => {
            chai_1.assert.isDefined(env.network);
            chai_1.assert.equal(env.network.name, "localhost");
            chai_1.assert.equal(env.network.config, config.networks.localhost);
        });
        it("Should throw if the chosen network doesn't exist", () => {
            errors_1.expectHardhatError(() => {
                const ctx = context_1.HardhatContext.getHardhatContext();
                env = new runtime_environment_1.Environment(config, Object.assign(Object.assign({}, args), { network: "NOPE" }), tasks, ctx.extendersManager.getExtenders());
            }, errors_list_1.ERRORS.NETWORK.CONFIG_NOT_FOUND);
        });
        it("Should choose the default network if none is selected", () => {
            const ctx = context_1.HardhatContext.getHardhatContext();
            env = new runtime_environment_1.Environment(config, Object.assign(Object.assign({}, args), { network: undefined }), tasks, ctx.extendersManager.getExtenders());
            chai_1.assert.equal(env.network.name, "default");
            chai_1.assert.equal(env.network.config, config.networks.default);
        });
    });
    describe("Plugin system", () => {
        project_1.useFixtureProject("plugin-project");
        it("environment should contains plugin extensions", async () => {
            require(path_1.default.join(process.cwd(), "plugins", "example"));
            const ctx = context_1.HardhatContext.getHardhatContext();
            env = new runtime_environment_1.Environment(config, args, tasks, ctx.extendersManager.getExtenders());
            chai_1.assert.equal(env.__test_key, "a value");
            chai_1.assert.equal(env.__test_bleep(2), 4);
        });
    });
});
//# sourceMappingURL=runtime-environment.js.map