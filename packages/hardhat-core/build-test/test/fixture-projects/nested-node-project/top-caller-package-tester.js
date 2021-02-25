"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indirectlyCallFromTopModule = exports.callFromTopModule = exports.callFromNestedModule = exports.call = void 0;
const caller_package_1 = require("../../../src/internal/util/caller-package");
const nested_caller_package_tester_1 = require("./project/nested-caller-package-tester");
function call() {
    return caller_package_1.getClosestCallerPackage();
}
exports.call = call;
function callFromNestedModule() {
    return nested_caller_package_tester_1.call();
}
exports.callFromNestedModule = callFromNestedModule;
function callFromTopModule() {
    return call();
}
exports.callFromTopModule = callFromTopModule;
function indirectlyCallFromTopModule() {
    return nested_caller_package_tester_1.callFromTopModule();
}
exports.indirectlyCallFromTopModule = indirectlyCallFromTopModule;
//# sourceMappingURL=top-caller-package-tester.js.map