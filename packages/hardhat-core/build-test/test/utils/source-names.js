"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const errors_list_1 = require("../../src/internal/core/errors-list");
const source_names_1 = require("../../src/utils/source-names");
const errors_1 = require("../helpers/errors");
describe("Source names utilities", function () {
    describe("validateSourceNameFormat", function () {
        it("Should fail with absolute paths", async function () {
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat(source_names_1.normalizeSourceName(__dirname)), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_ABSOLUTE_PATH);
        });
        it("Should fail with slash-based absolute paths, even on windows", async function () {
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("/asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_ABSOLUTE_PATH);
        });
        it("Should fail if it is a relative path", async function () {
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("./asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_RELATIVE_PATH);
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("../asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_RELATIVE_PATH);
        });
        it("Shouldn't fail if it is a dotfile", async function () {
            source_names_1.validateSourceNameFormat(".asd");
        });
        it("Shouldn't fail if it is a special dotfile", async function () {
            source_names_1.validateSourceNameFormat("..asd/");
        });
        it("Should fail if it uses backslash", async function () {
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("asd\\sd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NAME_BACKSLASHES);
        });
        it("Should fail if is not normalized", async function () {
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("asd/./asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NOT_NORMALIZED);
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("asd/../asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NOT_NORMALIZED);
            errors_1.expectHardhatError(() => source_names_1.validateSourceNameFormat("asd//asd"), errors_list_1.ERRORS.SOURCE_NAMES.INVALID_SOURCE_NOT_NORMALIZED);
        });
    });
    describe("isLocalSourceName", function () {
        it("Should return false if it includes node_modules", async function () {
            chai_1.assert.isFalse(await source_names_1.isLocalSourceName(__dirname, "asd/node_modules"));
        });
        it("Should return true if the first part/dir of the source name exists", async function () {
            chai_1.assert.isTrue(await source_names_1.isLocalSourceName(path_1.default.dirname(__dirname), "utils/asd"));
            chai_1.assert.isTrue(await source_names_1.isLocalSourceName(path_1.default.dirname(__dirname), "utils"));
        });
        it("Should return true if the first part/dir of the source name exists with a different casing", async function () {
            chai_1.assert.isTrue(await source_names_1.isLocalSourceName(path_1.default.dirname(__dirname), "utilS/asd"));
            chai_1.assert.isTrue(await source_names_1.isLocalSourceName(path_1.default.dirname(__dirname), "uTils"));
        });
        it("Should return false if the first part/dir of the source name doesn't exist", async function () {
            chai_1.assert.isFalse(await source_names_1.isLocalSourceName(path_1.default.dirname(__dirname), "no/asd"));
        });
        // This is a regression test for this issue: https://github.com/nomiclabs/hardhat/issues/998
        it("Should return false if the source name is 'hardhat/console.sol'", async function () {
            const projectPath = path_1.default.join(path_1.default.dirname(__dirname), "fixture-projects", "project-with-hardhat-directory");
            chai_1.assert.isFalse(await source_names_1.isLocalSourceName(projectPath, "hardhat/console.sol"));
        });
    });
    describe("validateSourceNameExistenceAndCasing", function () {
        it("Should throw if the file doesn't exist", async function () {
            await errors_1.expectHardhatErrorAsync(() => source_names_1.validateSourceNameExistenceAndCasing(__dirname, `asd`), errors_list_1.ERRORS.SOURCE_NAMES.FILE_NOT_FOUND);
        });
        it("Should throw if the casing is incorrect", async function () {
            await errors_1.expectHardhatErrorAsync(() => source_names_1.validateSourceNameExistenceAndCasing(__dirname, `source-Names.ts`), errors_list_1.ERRORS.SOURCE_NAMES.WRONG_CASING);
        });
    });
    describe("localPathToSourceName", function () {
        it("Shouldn't accept files outside the project", async function () {
            await errors_1.expectHardhatErrorAsync(() => source_names_1.localPathToSourceName(__dirname, path_1.default.normalize(`${__dirname}/../asd`)), errors_list_1.ERRORS.SOURCE_NAMES.EXTERNAL_AS_LOCAL);
        });
        it("Shouldn't accept files from node_modules", async function () {
            await errors_1.expectHardhatErrorAsync(() => source_names_1.localPathToSourceName(__dirname, `${__dirname}/node_modules/asd`), errors_list_1.ERRORS.SOURCE_NAMES.NODE_MODULES_AS_LOCAL);
        });
        it("Should throw if the file doesn't exist", async function () {
            await errors_1.expectHardhatErrorAsync(() => source_names_1.localPathToSourceName(__dirname, `${__dirname}/asd`), errors_list_1.ERRORS.SOURCE_NAMES.FILE_NOT_FOUND);
        });
        it("Should return the right casing of a file", async function () {
            chai_1.assert.equal(await source_names_1.localPathToSourceName(__dirname, `${__dirname}/source-NAMES.ts`), "source-names.ts");
        });
    });
    describe("localSourceNameToPath", function () {
        it("Should join the project root and the source name", function () {
            chai_1.assert.equal(source_names_1.localSourceNameToPath(__dirname, "asd/qwe"), path_1.default.join(__dirname, "asd/qwe"));
        });
    });
    describe("normalizeSourceName", function () {
        it("Should remove /./", function () {
            chai_1.assert.equal(source_names_1.normalizeSourceName("asd/./asd"), "asd/asd");
        });
        it("Should remove /../", function () {
            chai_1.assert.equal(source_names_1.normalizeSourceName("asd/a/../asd"), "asd/asd");
        });
        it("Should simplify //", function () {
            chai_1.assert.equal(source_names_1.normalizeSourceName("asd//asd"), "asd/asd");
        });
        it("Should use slashes and not backslashes", function () {
            chai_1.assert.equal(source_names_1.normalizeSourceName("asd\\asd"), "asd/asd");
        });
    });
    describe("isAbsolutePathSourceName", function () {
        it("Should return false for relative paths", function () {
            chai_1.assert.isFalse(source_names_1.isAbsolutePathSourceName("./asd"));
            chai_1.assert.isFalse(source_names_1.isAbsolutePathSourceName("asd"));
        });
        it("Should return true for absolute paths", function () {
            chai_1.assert.isTrue(source_names_1.isAbsolutePathSourceName(__filename));
        });
        it("Should return true for paths starting in /", function () {
            chai_1.assert.isTrue(source_names_1.isAbsolutePathSourceName("/asd"));
        });
    });
    describe("replaceBackslashes", function () {
        it("Should return the same string with / instead of \\", function () {
            chai_1.assert.equal(source_names_1.replaceBackslashes("\\a"), "/a");
            chai_1.assert.equal(source_names_1.replaceBackslashes("\\\\a"), "//a");
            chai_1.assert.equal(source_names_1.replaceBackslashes("/\\\\a"), "///a");
        });
    });
});
//# sourceMappingURL=source-names.js.map