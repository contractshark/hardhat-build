"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indirectlyCallFromNestedpModule = exports.callFromTopModule = exports.callFromNestedModule = exports.call = void 0;
const caller_package_1 = require("../../../../src/internal/util/caller-package");
const top_caller_package_tester_1 = require("../top-caller-package-tester");
function call() {
    return caller_package_1.getClosestCallerPackage();
}
exports.call = call;
function callFromNestedModule() {
    return call();
}
exports.callFromNestedModule = callFromNestedModule;
function callFromTopModule() {
    return top_caller_package_tester_1.call();
}
exports.callFromTopModule = callFromTopModule;
function indirectlyCallFromNestedpModule() {
    return top_caller_package_tester_1.callFromNestedModule();
}
exports.indirectlyCallFromNestedpModule = indirectlyCallFromNestedpModule;
//# sourceMappingURL=nested-caller-package-tester.js.map