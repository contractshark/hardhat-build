"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const dsl_1 = require("../../../../src/internal/core/tasks/dsl");
const errors_1 = require("../../../helpers/errors");
describe("TasksDSL", () => {
    let dsl;
    beforeEach(() => {
        dsl = new dsl_1.TasksDSL();
    });
    it("should add a task", () => {
        const taskName = "compile";
        const description = "compiler task description";
        const action = async () => { };
        const task = dsl.task(taskName, description, action);
        chai_1.assert.equal(task.name, taskName);
        chai_1.assert.equal(task.description, description);
        chai_1.assert.equal(task.action, action);
        chai_1.assert.isFalse(task.isSubtask);
    });
    it("should add a subtask", () => {
        const action = async () => { };
        const task = dsl.subtask("compile", "compiler task description", action);
        chai_1.assert.isTrue(task.isSubtask);
    });
    it("should add a subtask through the internalTask alias", () => {
        const action = async () => { };
        const task = dsl.internalTask("compile", "compiler task description", action);
        chai_1.assert.isTrue(task.isSubtask);
    });
    it("should add a task without description", () => {
        const action = async () => { };
        const task = dsl.task("compile", action);
        chai_1.assert.isUndefined(task.description);
        chai_1.assert.equal(task.action, action);
    });
    it("should add a task with default action", async () => {
        const task = dsl.task("compile", "a description");
        chai_1.assert.isDefined(task.description);
        chai_1.assert.isDefined(task.action);
        const runSuperNop = async () => { };
        runSuperNop.isDefined = false;
        await errors_1.expectHardhatErrorAsync(() => task.action({}, {}, runSuperNop), errors_list_1.ERRORS.TASK_DEFINITIONS.ACTION_NOT_SET);
    });
    it("should override task", () => {
        const action = async () => { };
        const builtin = dsl.task("compile", "built-in", action);
        let tasks = dsl.getTaskDefinitions();
        chai_1.assert.equal(tasks.compile, builtin);
        const custom = dsl.task("compile", "custom", action);
        tasks = dsl.getTaskDefinitions();
        chai_1.assert.equal(tasks.compile, custom);
    });
    it("should return added tasks", () => {
        const task = dsl.task("compile", "built-in");
        const tasks = dsl.getTaskDefinitions();
        chai_1.assert.deepEqual(tasks, { compile: task });
    });
});
//# sourceMappingURL=dsl.js.map