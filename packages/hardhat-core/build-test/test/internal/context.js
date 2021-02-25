"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const context_1 = require("../../src/internal/context");
const errors_list_1 = require("../../src/internal/core/errors-list");
const reset_1 = require("../../src/internal/reset");
const environment_1 = require("../helpers/environment");
const errors_1 = require("../helpers/errors");
const project_1 = require("../helpers/project");
describe("Hardhat context", async function () {
    describe("no context", () => {
        it("context is not defined", async function () {
            chai_1.assert.isFalse(context_1.HardhatContext.isCreated());
        });
        it("should throw when context isn't created", async function () {
            errors_1.expectHardhatError(() => context_1.HardhatContext.getHardhatContext(), errors_list_1.ERRORS.GENERAL.CONTEXT_NOT_CREATED);
        });
    });
    describe("create context but no environment", async function () {
        afterEach("reset context", function () {
            reset_1.resetHardhatContext();
        });
        it("context is defined", async function () {
            context_1.HardhatContext.createHardhatContext();
            chai_1.assert.isTrue(context_1.HardhatContext.isCreated());
        });
        it("context initialize properly", async function () {
            const ctx = context_1.HardhatContext.createHardhatContext();
            chai_1.assert.isDefined(ctx.extendersManager);
            chai_1.assert.isDefined(ctx.tasksDSL);
            chai_1.assert.isUndefined(ctx.environment);
        });
        it("should throw when recreating hardhat context", async function () {
            context_1.HardhatContext.createHardhatContext();
            errors_1.expectHardhatError(() => context_1.HardhatContext.createHardhatContext(), errors_list_1.ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
        });
        it("should delete context", async function () {
            chai_1.assert.isFalse(context_1.HardhatContext.isCreated());
            context_1.HardhatContext.createHardhatContext();
            chai_1.assert.isTrue(context_1.HardhatContext.isCreated());
            context_1.HardhatContext.deleteHardhatContext();
            chai_1.assert.isFalse(context_1.HardhatContext.isCreated());
        });
        it("should throw when HRE is not defined", async function () {
            const ctx = context_1.HardhatContext.createHardhatContext();
            errors_1.expectHardhatError(() => ctx.getHardhatRuntimeEnvironment(), errors_list_1.ERRORS.GENERAL.CONTEXT_HRE_NOT_DEFINED);
        });
    });
    describe("environment creates context", async function () {
        project_1.useFixtureProject("config-project");
        environment_1.useEnvironment();
        it("should create context and set HRE into context", async function () {
            chai_1.assert.equal(context_1.HardhatContext.getHardhatContext().getHardhatRuntimeEnvironment(), this.env);
        });
        it("should throw when trying to set HRE", async function () {
            errors_1.expectHardhatError(() => context_1.HardhatContext.getHardhatContext().setHardhatRuntimeEnvironment(this.env), errors_list_1.ERRORS.GENERAL.CONTEXT_HRE_ALREADY_DEFINED);
        });
    });
});
//# sourceMappingURL=context.js.map