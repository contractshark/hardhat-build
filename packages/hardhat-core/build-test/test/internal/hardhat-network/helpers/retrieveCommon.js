"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveCommon = void 0;
async function retrieveCommon(provider) {
    var _a;
    if (provider["_node"] === undefined) {
        await provider["_init"]();
    }
    const common = (_a = provider["_node"]) === null || _a === void 0 ? void 0 : _a["_vm"]._common;
    if (common === undefined) {
        throw new Error("Failed to retrieve common from HardhatNetworkProvider");
    }
    return common;
}
exports.retrieveCommon = retrieveCommon;
//# sourceMappingURL=retrieveCommon.js.map