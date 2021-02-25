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
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const types = __importStar(require("../../../../src/internal/core/params/argumentTypes"));
const task_definitions_1 = require("../../../../src/internal/core/tasks/task-definitions");
const unsafe_1 = require("../../../../src/internal/util/unsafe");
const errors_1 = require("../../../helpers/errors");
function expectThrowParamAlreadyDefinedError(f) {
    errors_1.expectHardhatError(f, errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_ALREADY_DEFINED);
}
function getLastPositionalParam(taskDefinition) {
    chai_1.assert.isNotEmpty(taskDefinition.positionalParamDefinitions);
    return taskDefinition.positionalParamDefinitions[taskDefinition.positionalParamDefinitions.length - 1];
}
function assertParamDefinition(actual, expected) {
    for (const key of unsafe_1.unsafeObjectKeys(actual)) {
        if (expected[key] !== undefined) {
            chai_1.assert.deepEqual(actual[key], expected[key]);
        }
    }
}
const runSuperNop = async () => { };
runSuperNop.isDefined = false;
describe("SimpleTaskDefinition", () => {
    describe("construction", () => {
        let taskDefinition;
        before("init taskDefinition", () => {
            taskDefinition = new task_definitions_1.SimpleTaskDefinition("name", true);
        });
        it("gets the right name", () => {
            chai_1.assert.equal(taskDefinition.name, "name");
        });
        it("gets the right isSubtask flag", () => {
            chai_1.assert.isTrue(taskDefinition.isSubtask);
        });
        it("starts without any param defined", () => {
            chai_1.assert.deepEqual(taskDefinition.paramDefinitions, {});
            chai_1.assert.isEmpty(taskDefinition.positionalParamDefinitions);
        });
        it("starts without any description", () => {
            chai_1.assert.isUndefined(taskDefinition.description);
        });
        it("starts with an action that throws", () => {
            errors_1.expectHardhatError(() => taskDefinition.action({}, {}, runSuperNop), errors_list_1.ERRORS.TASK_DEFINITIONS.ACTION_NOT_SET);
        });
    });
    describe("setDescription", () => {
        it("Should change the description", () => {
            const taskDefinition = new task_definitions_1.SimpleTaskDefinition("name");
            chai_1.assert.isUndefined(taskDefinition.description);
            taskDefinition.setDescription("A");
            chai_1.assert.equal(taskDefinition.description, "A");
            taskDefinition.setDescription("B");
            chai_1.assert.equal(taskDefinition.description, "B");
        });
    });
    describe("setAction", () => {
        it("Should change the action", async () => {
            const taskDefinition = new task_definitions_1.SimpleTaskDefinition("name");
            taskDefinition.setAction(async () => 1);
            let result = await taskDefinition.action({}, {}, runSuperNop);
            chai_1.assert.equal(result, 1);
            const obj = {};
            taskDefinition.setAction(async () => obj);
            result = await taskDefinition.action({}, {}, runSuperNop);
            chai_1.assert.equal(result, obj);
        });
    });
    describe("param definition rules", () => {
        let taskDefinition;
        beforeEach("init taskDefinition", () => {
            taskDefinition = new task_definitions_1.SimpleTaskDefinition("name", true);
        });
        describe("param name repetitions", () => {
            beforeEach("set param with name 'name'", () => {
                taskDefinition.addParam("name", "a description", "asd");
            });
            it("should throw if addParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addParam("name", "another desc"));
            });
            it("should throw if addOptionalParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addOptionalParam("name", "another desc"));
            });
            it("should throw if addFlag repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addFlag("name", "another desc"));
            });
            it("should throw if addPositionalParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addPositionalParam("name", "another desc"));
            });
            it("should throw if addOptionalPositionalParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addOptionalPositionalParam("name", "another desc"));
            });
            it("should throw if addVariadicPositionalParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addVariadicPositionalParam("name", "another desc"));
            });
            it("should throw if addOptionalVariadicPositionalParam repeats a param name", () => {
                expectThrowParamAlreadyDefinedError(() => taskDefinition.addOptionalVariadicPositionalParam("name", "another desc"));
            });
        });
        describe("param name clashes with Hardhat's ones", () => {
            function testClashWith(name) {
                errors_1.expectHardhatError(() => taskDefinition.addParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addOptionalParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addFlag(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addPositionalParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addOptionalPositionalParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addOptionalVariadicPositionalParam(name), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_CLASHES_WITH_HARDHAT_PARAM);
            }
            it("Should throw if a param clashes", () => {
                // This is constructed to force a type error here if a Hardhat arg is
                // added and not tested.
                const hardhatArgs = {
                    showStackTraces: true,
                    network: "",
                    version: false,
                    emoji: false,
                    help: false,
                    verbose: false,
                };
                Object.keys(hardhatArgs).forEach((name) => testClashWith(name));
            });
        });
        describe("positional param rules", () => {
            describe("no mandatory positional param after an optional one", () => {
                beforeEach("add optional positional", () => {
                    taskDefinition.addOptionalPositionalParam("asd");
                });
                it("throws when trying to add a new positional param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addPositionalParam("asd2"), errors_list_1.ERRORS.TASK_DEFINITIONS.MANDATORY_PARAM_AFTER_OPTIONAL);
                });
                it("throws when trying to add a new variadic positional param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("asd2"), errors_list_1.ERRORS.TASK_DEFINITIONS.MANDATORY_PARAM_AFTER_OPTIONAL);
                });
                describe("should still accept non-positional ones", () => {
                    it("should accept a common param", () => {
                        taskDefinition.addParam("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                    it("should accept an optional param", () => {
                        taskDefinition.addOptionalParam("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                    it("should accept a flag", () => {
                        taskDefinition.addFlag("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                });
            });
            describe("accepts multiple optional params", () => {
                beforeEach("add optional positional", () => {
                    taskDefinition.addOptionalPositionalParam("asd");
                });
                it("should accept an optional positional param", () => {
                    taskDefinition.addOptionalPositionalParam("asd2");
                    const last = getLastPositionalParam(taskDefinition);
                    chai_1.assert.equal(last.name, "asd2");
                    chai_1.assert.isTrue(last.isOptional);
                });
                it("should accept an optional variadic positional param", () => {
                    taskDefinition.addOptionalVariadicPositionalParam("asd2");
                    const last = getLastPositionalParam(taskDefinition);
                    chai_1.assert.equal(last.name, "asd2");
                    chai_1.assert.isTrue(last.isOptional);
                    chai_1.assert.isTrue(last.isVariadic);
                });
            });
            describe("no positional params after a variadic positional param", () => {
                beforeEach("add variadic param", () => {
                    taskDefinition.addVariadicPositionalParam("asd");
                });
                it("should throw on adding a positional param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_AFTER_VARIADIC);
                });
                it("should throw on adding an optional positional param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addOptionalPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_AFTER_VARIADIC);
                });
                it("should throw on adding another variadic param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_AFTER_VARIADIC);
                });
                it("should throw on adding an optional variadic param", () => {
                    errors_1.expectHardhatError(() => taskDefinition.addOptionalVariadicPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_AFTER_VARIADIC);
                });
                describe("should still accept non-positional ones", () => {
                    it("should accept a common param", () => {
                        taskDefinition.addParam("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                    it("should accept an optional param", () => {
                        taskDefinition.addOptionalParam("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                    it("should accept a flag", () => {
                        taskDefinition.addFlag("p");
                        chai_1.assert.notEqual(taskDefinition.paramDefinitions.p, undefined);
                    });
                });
            });
        });
    });
    describe("Setting params", () => {
        let taskDefinition;
        beforeEach("init taskDefinition", () => {
            taskDefinition = new task_definitions_1.SimpleTaskDefinition("name", true);
        });
        describe("addParam", () => {
            it("Should fail if the param name isn't camelCase", function () {
                errors_1.expectHardhatError(() => taskDefinition.addParam("A"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("Aa"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("0"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("0a"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("a "), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("a-1"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("a_"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
                errors_1.expectHardhatError(() => taskDefinition.addParam("a_b"), errors_list_1.ERRORS.TASK_DEFINITIONS.INVALID_PARAM_NAME_CASING);
            });
            it("should add the param correctly", () => {
                taskDefinition.addParam("p", "desc", 123, types.int, true);
                assertParamDefinition(taskDefinition.paramDefinitions.p, {
                    name: "p",
                    description: "desc",
                    defaultValue: 123,
                    type: types.int,
                    isOptional: true,
                    isVariadic: false,
                    isFlag: false,
                });
            });
            it("should set isOptional if a default value is provided", () => {
                taskDefinition.addParam("p", "desc", 123, types.int);
                assertParamDefinition(taskDefinition.paramDefinitions.p, {
                    defaultValue: 123,
                    isOptional: true,
                });
            });
            it("should accept an optional parm with undefined as default vlaue", () => {
                taskDefinition.addParam("p", "desc", undefined, types.int, true);
                assertParamDefinition(taskDefinition.paramDefinitions.p, {
                    defaultValue: undefined,
                    isOptional: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addParam("p");
                chai_1.assert.equal(taskDefinition.paramDefinitions.p.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
            it("should throw if a default value is set to a mandatory param", () => {
                errors_1.expectHardhatError(() => taskDefinition.addParam("p", "desc", 123, types.int, false), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_IN_MANDATORY_PARAM);
            });
        });
        describe("addOptionalParam", () => {
            it("should set the param correctly", () => {
                taskDefinition.addOptionalParam("p", "desc", 123, types.int);
                assertParamDefinition(taskDefinition.paramDefinitions.p, {
                    name: "p",
                    description: "desc",
                    defaultValue: 123,
                    type: types.int,
                    isOptional: true,
                    isVariadic: false,
                    isFlag: false,
                });
            });
            it("should work with undefined as default value", () => {
                taskDefinition.addOptionalParam("p", "desc", undefined);
                assertParamDefinition(taskDefinition.paramDefinitions.p, {
                    defaultValue: undefined,
                    isOptional: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addOptionalParam("p");
                chai_1.assert.equal(taskDefinition.paramDefinitions.p.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addOptionalParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
        });
        describe("addFlag", () => {
            it("should set an optional boolean param", () => {
                taskDefinition.addFlag("f", "d");
                assertParamDefinition(taskDefinition.paramDefinitions.f, {
                    name: "f",
                    description: "d",
                    defaultValue: false,
                    type: types.boolean,
                    isOptional: true,
                    isVariadic: false,
                    isFlag: true,
                });
            });
        });
        describe("addPositionalParam", () => {
            it("shouldn't add the param definition to paramDefinitions", () => {
                taskDefinition.addPositionalParam("p", "desc");
                chai_1.assert.isUndefined(taskDefinition.paramDefinitions.p);
            });
            it("should add the param definition to positionalParamDefinitions", () => {
                taskDefinition.addPositionalParam("p", "desc", 123, types.int, true);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    name: "p",
                    description: "desc",
                    defaultValue: 123,
                    type: types.int,
                    isOptional: true,
                    isVariadic: false,
                    isFlag: false,
                });
            });
            it("should work with undefined as default value", () => {
                taskDefinition.addPositionalParam("p", "desc", undefined, types.int, true);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: undefined,
                    isOptional: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addPositionalParam("p", "desc");
                const last = getLastPositionalParam(taskDefinition);
                chai_1.assert.equal(last.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addPositionalParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
            it("should throw if a default value is set to a mandatory param", () => {
                errors_1.expectHardhatError(() => taskDefinition.addPositionalParam("p", "desc", 123, types.int, false), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_IN_MANDATORY_PARAM);
            });
            it("should set isOptional if default value is provided", () => {
                taskDefinition.addPositionalParam("p", "desc", "A");
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: "A",
                    isOptional: true,
                });
            });
        });
        describe("addOptionalPositionalParam", () => {
            it("shouldn't add the param definition to paramDefinitions", () => {
                taskDefinition.addOptionalPositionalParam("p", "desc");
                chai_1.assert.isUndefined(taskDefinition.paramDefinitions.p);
            });
            it("should add the param definition to positionalParamDefinitions", () => {
                taskDefinition.addOptionalPositionalParam("p", "desc", 123, types.int);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    name: "p",
                    description: "desc",
                    defaultValue: 123,
                    type: types.int,
                    isOptional: true,
                    isVariadic: false,
                    isFlag: false,
                });
            });
            it("should work with undefined as default value", () => {
                taskDefinition.addOptionalPositionalParam("p", "desc", undefined, types.int);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: undefined,
                    isOptional: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addOptionalPositionalParam("p", "desc");
                const last = getLastPositionalParam(taskDefinition);
                chai_1.assert.equal(last.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addOptionalPositionalParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
        });
        describe("addVariadicPositionalParam", () => {
            it("shouldn't add the param definition to paramDefinitions", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc");
                chai_1.assert.isUndefined(taskDefinition.paramDefinitions.p);
            });
            it("should add the param definition to positionalParamDefinitions", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc", [123], types.int, true);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    name: "p",
                    description: "desc",
                    defaultValue: [123],
                    type: types.int,
                    isOptional: true,
                    isVariadic: true,
                    isFlag: false,
                });
            });
            it("should convert the default value into an array if necessary", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc", 123, types.int, true);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: [123],
                    isVariadic: true,
                });
            });
            it("should work with undefined as default value", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc", undefined, types.int, true);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: undefined,
                    isOptional: true,
                    isVariadic: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc");
                const last = getLastPositionalParam(taskDefinition);
                chai_1.assert.equal(last.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
                errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("p", "desc", [123]), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
            it("should throw if a default value is set to a mandatory param", () => {
                errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("p", "desc", 123, types.int, false), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_IN_MANDATORY_PARAM);
                errors_1.expectHardhatError(() => taskDefinition.addVariadicPositionalParam("p", "desc", [123], types.int, false), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_IN_MANDATORY_PARAM);
            });
            it("should set isOptional if default value is provided", () => {
                taskDefinition.addVariadicPositionalParam("p", "desc", "A");
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: ["A"],
                    isOptional: true,
                    isVariadic: true,
                });
            });
        });
        describe("addOptionalVariadicPositionalParam", () => {
            it("shouldn't add the param definition to paramDefinitions", () => {
                taskDefinition.addOptionalVariadicPositionalParam("p", "desc");
                chai_1.assert.isUndefined(taskDefinition.paramDefinitions.p);
            });
            it("should add the param definition to positionalParamDefinitions", () => {
                taskDefinition.addOptionalVariadicPositionalParam("p", "desc", [123], types.int);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    name: "p",
                    description: "desc",
                    defaultValue: [123],
                    type: types.int,
                    isOptional: true,
                    isVariadic: true,
                    isFlag: false,
                });
            });
            it("should convert the default value into an array if necessary", () => {
                taskDefinition.addOptionalVariadicPositionalParam("p", "desc", 123, types.int);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: [123],
                    isVariadic: true,
                });
            });
            it("should work with undefined as default value", () => {
                taskDefinition.addOptionalVariadicPositionalParam("p", "desc", undefined, types.int);
                assertParamDefinition(getLastPositionalParam(taskDefinition), {
                    defaultValue: undefined,
                    isOptional: true,
                    isVariadic: true,
                });
            });
            it("should use types.string as if non type is given", () => {
                taskDefinition.addOptionalVariadicPositionalParam("p", "desc");
                const last = getLastPositionalParam(taskDefinition);
                chai_1.assert.equal(last.type, types.string);
            });
            it("should throw if a non-string default value is given but its type isn't set", () => {
                errors_1.expectHardhatError(() => taskDefinition.addOptionalVariadicPositionalParam("p", "desc", 123), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
                errors_1.expectHardhatError(() => taskDefinition.addOptionalVariadicPositionalParam("p", "desc", [
                    123,
                ]), errors_list_1.ERRORS.TASK_DEFINITIONS.DEFAULT_VALUE_WRONG_TYPE);
            });
        });
        describe("CLI argument types", () => {
            describe("tasks", () => {
                let task;
                beforeEach(() => {
                    task = new task_definitions_1.SimpleTaskDefinition("t", false);
                });
                describe("When using non-cli argument types", () => {
                    it("Should throw on addParam", () => {
                        errors_1.expectHardhatError(() => task.addParam("p", "p", undefined, types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                    it("Should  throw on addOptionalParam", () => {
                        errors_1.expectHardhatError(() => task.addOptionalParam("p", "p", "asd", types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                    it("Should  throw on addPositionalParam", () => {
                        errors_1.expectHardhatError(() => task.addPositionalParam("p", "p", undefined, types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                    it("Should  throw on addOptionalPositionalParam", () => {
                        errors_1.expectHardhatError(() => task.addOptionalPositionalParam("p", "p", "asd", types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                    it("Should  throw on addVariadicPositionalParam", () => {
                        errors_1.expectHardhatError(() => task.addVariadicPositionalParam("p", "p", undefined, types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                    it("Should  throw on addVariadicPositionalParam", () => {
                        errors_1.expectHardhatError(() => task.addOptionalVariadicPositionalParam("p", "p", "asd", types.any), errors_list_1.ERRORS.TASK_DEFINITIONS.CLI_ARGUMENT_TYPE_REQUIRED);
                    });
                });
            });
            describe("subtasks", () => {
                describe("When using non-cli argument types", () => {
                    let task;
                    beforeEach(() => {
                        task = new task_definitions_1.SimpleTaskDefinition("t", true);
                    });
                    it("Should not throw on addParam", () => {
                        task.addParam("p", "p", undefined, types.any);
                        chai_1.assert.isDefined(task.paramDefinitions.p);
                    });
                    it("Should not throw on addOptionalParam", () => {
                        task.addOptionalParam("p", "p", "asd", types.any);
                        chai_1.assert.isDefined(task.paramDefinitions.p);
                    });
                    it("Should not throw on addPositionalParam", () => {
                        task.addPositionalParam("p", "p", undefined, types.any);
                        chai_1.assert.lengthOf(task.positionalParamDefinitions, 1);
                    });
                    it("Should not throw on addOptionalPositionalParam", () => {
                        task.addOptionalPositionalParam("p", "p", "asd", types.any);
                        chai_1.assert.lengthOf(task.positionalParamDefinitions, 1);
                    });
                    it("Should not throw on addVariadicPositionalParam", () => {
                        task.addVariadicPositionalParam("p", "p", undefined, types.any);
                        chai_1.assert.lengthOf(task.positionalParamDefinitions, 1);
                    });
                    it("Should not throw on addVariadicPositionalParam", () => {
                        task.addOptionalVariadicPositionalParam("p", "p", "asd", types.any);
                        chai_1.assert.lengthOf(task.positionalParamDefinitions, 1);
                    });
                });
            });
        });
    });
});
describe("OverriddenTaskDefinition", () => {
    let parentTask;
    let overriddenTask;
    beforeEach("init tasks", () => {
        parentTask = new task_definitions_1.SimpleTaskDefinition("t")
            .addParam("p", "desc")
            .addFlag("f")
            .addPositionalParam("pp", "positional param");
        overriddenTask = new task_definitions_1.OverriddenTaskDefinition(parentTask, true);
    });
    describe("construction", () => {
        it("should have the right name", () => {
            chai_1.assert.equal(overriddenTask.name, "t");
        });
        it("should set isSubtask", () => {
            chai_1.assert.isTrue(overriddenTask.isSubtask);
        });
        it("should set the parent task", () => {
            chai_1.assert.equal(overriddenTask.parentTaskDefinition, parentTask);
        });
    });
    describe("inherited properties", () => {
        it("should return the parent's name", () => {
            chai_1.assert.equal(overriddenTask.name, parentTask.name);
        });
        it("should return the parent's action", () => {
            chai_1.assert.equal(overriddenTask.action, parentTask.action);
        });
        it("should return the parent's description", () => {
            chai_1.assert.equal(overriddenTask.description, parentTask.description);
        });
        it("should return the parent's param definitions", () => {
            chai_1.assert.equal(overriddenTask.paramDefinitions, parentTask.paramDefinitions);
        });
        it("should return the parent's positional param definitions", () => {
            chai_1.assert.equal(overriddenTask.positionalParamDefinitions, parentTask.positionalParamDefinitions);
        });
        it("should work with more than one level of chaining", () => {
            const overriddenAgain = new task_definitions_1.OverriddenTaskDefinition(overriddenTask, false);
            chai_1.assert.equal(overriddenAgain.isSubtask, false);
            chai_1.assert.equal(overriddenAgain.name, parentTask.name);
            chai_1.assert.equal(overriddenAgain.action, parentTask.action);
            chai_1.assert.equal(overriddenAgain.description, parentTask.description);
            chai_1.assert.equal(overriddenAgain.paramDefinitions, parentTask.paramDefinitions);
            chai_1.assert.equal(overriddenAgain.positionalParamDefinitions, parentTask.positionalParamDefinitions);
        });
        it("should return overridden actions", () => {
            chai_1.assert.equal(overriddenTask.action, parentTask.action);
            const action2 = async () => 1;
            overriddenTask.setAction(action2);
            chai_1.assert.equal(overriddenTask.action, action2);
            const action3 = async () => 1;
            overriddenTask.setAction(action3);
            chai_1.assert.equal(overriddenTask.action, action3);
            const overriddenAgain = new task_definitions_1.OverriddenTaskDefinition(overriddenTask);
            chai_1.assert.equal(overriddenAgain.action, action3);
            const action4 = async () => 1;
            overriddenAgain.setAction(action4);
            chai_1.assert.equal(overriddenTask.action, action3);
            chai_1.assert.equal(overriddenAgain.action, action4);
        });
        it("should return overridden descriptions", () => {
            chai_1.assert.equal(overriddenTask.description, parentTask.description);
            overriddenTask.setDescription("d2");
            chai_1.assert.equal(overriddenTask.description, "d2");
            overriddenTask.setDescription("d3");
            chai_1.assert.equal(overriddenTask.description, "d3");
            const overriddenAgain = new task_definitions_1.OverriddenTaskDefinition(overriddenTask);
            chai_1.assert.equal(overriddenTask.description, "d3");
            overriddenAgain.setDescription("d4");
            chai_1.assert.equal(overriddenTask.description, "d3");
            chai_1.assert.equal(overriddenAgain.description, "d4");
        });
    });
    describe("Param definitions can be added only in compatible cases", () => {
        it("should add a flag param if addFlag is called", () => {
            overriddenTask.addFlag("flagParam", "flag in overriden task");
            assertParamDefinition(overriddenTask.paramDefinitions.flagParam, {
                name: "flagParam",
                description: "flag in overriden task",
                defaultValue: false,
                type: types.boolean,
                isOptional: true,
                isVariadic: false,
                isFlag: true,
            });
        });
        it("should throw if adding a param of same name that was already defined in parent task", () => {
            const definedParamName = "f";
            // a param definition in an overridenTask is present in the parentTask ref as well
            chai_1.assert.isDefined(overriddenTask.paramDefinitions[definedParamName]);
            chai_1.assert.isDefined(parentTask.paramDefinitions[definedParamName]);
            // expect PARAM_ALREADY_DEFINED for add flag param
            errors_1.expectHardhatError(() => overriddenTask.addFlag(definedParamName), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_ALREADY_DEFINED);
            // expect PARAM_ALREADY_DEFINED for add optional param using addParam method
            errors_1.expectHardhatError(() => overriddenTask.addParam(definedParamName, undefined, undefined, undefined, true), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_ALREADY_DEFINED);
            // expect PARAM_ALREADY_DEFINED for add optional param using addParam method
            errors_1.expectHardhatError(() => overriddenTask.addOptionalParam(definedParamName, undefined, undefined, undefined), errors_list_1.ERRORS.TASK_DEFINITIONS.PARAM_ALREADY_DEFINED);
        });
        it("should throw if addParam is called with isOptional = false", () => {
            errors_1.expectHardhatError(() => overriddenTask.addParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.OVERRIDE_NO_MANDATORY_PARAMS);
        });
        it("should add an optional param if addParam is called with isOptional = true", () => {
            const optParamName = "optParam";
            chai_1.assert.isUndefined(overriddenTask.paramDefinitions[optParamName], "");
            overriddenTask.addParam(optParamName, undefined, undefined, undefined, true);
            chai_1.assert.isDefined(overriddenTask.paramDefinitions[optParamName]);
        });
        it("should add an optional param if addOptionalParam is called", () => {
            const optParamName = "optParam";
            chai_1.assert.isUndefined(overriddenTask.paramDefinitions[optParamName], "");
            overriddenTask.addOptionalParam(optParamName);
            chai_1.assert.isDefined(overriddenTask.paramDefinitions[optParamName]);
        });
        it("should throw if addPositionalParam is called", () => {
            errors_1.expectHardhatError(() => overriddenTask.addPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.OVERRIDE_NO_POSITIONAL_PARAMS);
        });
        it("should throw if addOptionalPositionalParam is called", () => {
            errors_1.expectHardhatError(() => overriddenTask.addOptionalPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.OVERRIDE_NO_POSITIONAL_PARAMS);
        });
        it("should throw if addVariadicPositionalParam is called", () => {
            errors_1.expectHardhatError(() => overriddenTask.addVariadicPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.OVERRIDE_NO_VARIADIC_PARAMS);
        });
        it("should throw if addOptionalVariadicPositionalParam is called", () => {
            errors_1.expectHardhatError(() => overriddenTask.addOptionalVariadicPositionalParam("p"), errors_list_1.ERRORS.TASK_DEFINITIONS.OVERRIDE_NO_VARIADIC_PARAMS);
        });
    });
});
//# sourceMappingURL=task-definitions.js.map