"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_env_1 = require("../../../../src/internal/core/config/config-env");
config_env_1.extendEnvironment((env) => {
    env.__test_key = "a value";
    env.__test_bleep = (x) => x * 2;
});
//# sourceMappingURL=example.js.map