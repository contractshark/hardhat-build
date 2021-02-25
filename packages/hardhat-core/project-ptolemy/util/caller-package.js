"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.getClosestCallerPackage = void 0;
var find_up_1 = __importDefault(require("find-up"));
var path_1 = __importDefault(require("path"));
function findClosestPackageJson(file) {
    return find_up_1["default"].sync("package.json", { cwd: path_1["default"].dirname(file) });
}
/**
 * Returns the name of the closest package in the callstack that isn't this.
 */
function getClosestCallerPackage() {
    var previousPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (e, s) { return s; };
    var error = new Error();
    var stack = error.stack;
    Error.prepareStackTrace = previousPrepareStackTrace;
    var currentPackage = findClosestPackageJson(__filename);
    for (var _i = 0, stack_1 = stack; _i < stack_1.length; _i++) {
        var callSite = stack_1[_i];
        var fileName = callSite.getFileName();
        if (fileName !== null && path_1["default"].isAbsolute(fileName)) {
            var callerPackage = findClosestPackageJson(fileName);
            if (callerPackage === currentPackage) {
                continue;
            }
            if (callerPackage === null) {
                return undefined;
            }
            return require(callerPackage).name;
        }
    }
    return undefined;
}
exports.getClosestCallerPackage = getClosestCallerPackage;
