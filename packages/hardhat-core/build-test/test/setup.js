"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALCHEMY_URL = exports.INFURA_URL = void 0;
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const chalk_1 = __importDefault(require("chalk"));
chai_1.default.use(chai_as_promised_1.default);
function getEnv(key) {
    const variable = process.env[key];
    if (variable === undefined) {
        return undefined;
    }
    return variable.trim();
}
exports.INFURA_URL = getEnv("INFURA_URL");
exports.ALCHEMY_URL = getEnv("ALCHEMY_URL");
function printForkingLogicNotBeingTestedWarning(varName) {
    console.warn(chalk_1.default.yellow(`TEST RUN INCOMPLETE: You need to define the env variable ${varName}`));
}
if (exports.INFURA_URL === undefined || exports.INFURA_URL === "") {
    printForkingLogicNotBeingTestedWarning("INFURA_URL");
}
if (exports.ALCHEMY_URL === undefined || exports.ALCHEMY_URL === "") {
    printForkingLogicNotBeingTestedWarning("ALCHEMY_URL");
}
//# sourceMappingURL=setup.js.map