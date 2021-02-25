"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCWD = void 0;
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
function setCWD() {
    let previousWD;
    before("Setting CWD", function () {
        previousWD = process_1.default.cwd();
        process_1.default.chdir(path_1.default.join(__dirname, ".."));
    });
    after("Restoring CWD", function () {
        process_1.default.chdir(previousWD);
    });
}
exports.setCWD = setCWD;
//# sourceMappingURL=cwd.js.map