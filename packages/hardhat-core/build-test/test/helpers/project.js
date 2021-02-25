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
exports.getFixtureProjectPath = exports.useFixtureProject = void 0;
const fsExtra = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * This helper adds mocha hooks to run the tests inside one of the projects
 * from test/fixture-projects.
 *
 * @param projectName The base name of the folder with the project to use.
 */
function useFixtureProject(projectName) {
    let projectPath;
    let prevWorkingDir;
    before(async () => {
        projectPath = await getFixtureProjectPath(projectName);
    });
    before(() => {
        prevWorkingDir = process.cwd();
        process.chdir(projectPath);
    });
    after(() => {
        process.chdir(prevWorkingDir);
    });
}
exports.useFixtureProject = useFixtureProject;
async function getFixtureProjectPath(projectName) {
    const projectPath = path_1.default.join(__dirname, "..", "fixture-projects", projectName);
    if (!(await fsExtra.pathExists(projectPath))) {
        throw new Error(`Fixture project ${projectName} doesn't exist`);
    }
    return fsExtra.realpath(projectPath);
}
exports.getFixtureProjectPath = getFixtureProjectPath;
//# sourceMappingURL=project.js.map