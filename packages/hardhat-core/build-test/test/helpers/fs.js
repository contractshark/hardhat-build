"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTmpDir = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const os = __importStar(require("os"));
const path_1 = __importDefault(require("path"));
async function getEmptyTmpDir(nameHint) {
    const tmpDirContainer = os.tmpdir();
    const tmpDir = path_1.default.join(tmpDirContainer, `hardhat-tests-${nameHint}`);
    await fs_extra_1.default.ensureDir(tmpDir);
    await fs_extra_1.default.emptyDir(tmpDir);
    return tmpDir;
}
function useTmpDir(nameHint) {
    nameHint = nameHint.replace(/\s+/, "-");
    beforeEach("Creating tmp dir", async function () {
        this.tmpDir = await getEmptyTmpDir(nameHint);
    });
}
exports.useTmpDir = useTmpDir;
//# sourceMappingURL=fs.js.map