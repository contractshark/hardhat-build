"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnvironment = void 0;
const reset_1 = require("../../src/internal/reset");
function useEnvironment() {
    beforeEach("Load environment", function () {
        this.env = require("../../src/internal/lib/hardhat-lib");
    });
    afterEach("reset hardhat context", function () {
        reset_1.resetHardhatContext();
    });
}
exports.useEnvironment = useEnvironment;
//# sourceMappingURL=environment.js.map