"use strict";
// extendConfig must be available
// extendConfig shouldn't let me modify th user config
// config extenders must run in order
// config extensions must be visible
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const context_1 = require("../../../../src/internal/context");
const config_loading_1 = require("../../../../src/internal/core/config/config-loading");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const reset_1 = require("../../../../src/internal/reset");
const environment_1 = require("../../../helpers/environment");
const errors_1 = require("../../../helpers/errors");
const project_1 = require("../../../helpers/project");
describe("Config extensions", function () {
    describe("Valid extenders", function () {
        project_1.useFixtureProject("config-extensions");
        environment_1.useEnvironment();
        it("Should expose the new values", function () {
            const config = this.env.config;
            chai_1.assert.isDefined(config.values);
        });
        it("Should execute extenders in order", function () {
            const config = this.env.config;
            chai_1.assert.deepEqual(config.values, [1, 2]);
        });
    });
    describe("Invalid extensions", function () {
        project_1.useFixtureProject("invalid-config-extension");
        beforeEach(function () {
            context_1.HardhatContext.createHardhatContext();
        });
        afterEach(function () {
            reset_1.resetHardhatContext();
        });
        it("Should throw the right error when trying to modify the user config", function () {
            errors_1.expectHardhatError(() => config_loading_1.loadConfigAndTasks(), errors_list_1.ERRORS.GENERAL.USER_CONFIG_MODIFIED);
        });
        it("Should have the right property path", function () {
            chai_1.assert.throws(() => config_loading_1.loadConfigAndTasks(), "userConfig.networks.asd");
        });
    });
});
//# sourceMappingURL=config-extensions.js.map