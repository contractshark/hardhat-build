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
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fsExtra = __importStar(require("fs-extra"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const types = __importStar(require("../../../../src/internal/core/params/argumentTypes"));
const errors_1 = require("../../../helpers/errors");
function a(f) {
    errors_1.expectHardhatError(f, errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
}
describe("argumentTypes", () => {
    it("should set the right name to all the argument types", () => {
        for (const typeName of Object.keys(types)) {
            const argumentTypesMap = types;
            chai_1.assert.equal(argumentTypesMap[typeName].name, typeName);
        }
    });
    describe("string type", () => {
        it("should work with valid values", () => {
            chai_1.assert.equal(types.string.parse("arg", "asd"), "asd");
            chai_1.assert.equal(types.string.parse("arg", "asd1"), "asd1");
            chai_1.assert.equal(types.string.parse("arg", "asd 123"), "asd 123");
            chai_1.assert.equal(types.string.parse("arg", "1"), "1");
            chai_1.assert.equal(types.string.parse("arg", ""), "");
        });
    });
    describe("boolean type", () => {
        it("should work with valid values", () => {
            chai_1.assert.equal(types.boolean.parse("arg", "true"), true);
            chai_1.assert.equal(types.boolean.parse("arg", "false"), false);
        });
        it("should throw the right error on invalid values", () => {
            errors_1.expectHardhatError(() => types.boolean.parse("arg", "asd1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.boolean.parse("arg", "f"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.boolean.parse("arg", "t"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.boolean.parse("arg", "1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.boolean.parse("arg", "0"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.boolean.parse("arg", ""), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
        });
    });
    describe("int type", () => {
        it("should work with decimal values", () => {
            chai_1.assert.equal(types.int.parse("arg", "0"), 0);
            chai_1.assert.equal(types.int.parse("arg", "1"), 1);
            chai_1.assert.equal(types.int.parse("arg", "1123"), 1123);
            chai_1.assert.equal(types.int.parse("arg", "05678"), 5678);
        });
        it("should work with hex values", () => {
            chai_1.assert.equal(types.int.parse("arg", "0x0"), 0);
            chai_1.assert.equal(types.int.parse("arg", "0x1"), 1);
            chai_1.assert.equal(types.int.parse("arg", "0xA"), 0xa);
            chai_1.assert.equal(types.int.parse("arg", "0xa"), 0xa);
            chai_1.assert.equal(types.int.parse("arg", "0x0a"), 0x0a);
        });
        it("should work with decimal scientific notation", () => {
            chai_1.assert.equal(types.int.parse("arg", "1e0"), 1);
            chai_1.assert.equal(types.int.parse("arg", "1e123"), 1e123);
            chai_1.assert.equal(types.int.parse("arg", "12e0"), 12);
            chai_1.assert.equal(types.int.parse("arg", "012e1"), 120);
            chai_1.assert.equal(types.int.parse("arg", "0e12"), 0);
        });
        it("should fail with incorrect values", () => {
            errors_1.expectHardhatError(() => types.int.parse("arg", ""), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "1."), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", ".1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "0.1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "asdas"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "a1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "1a"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "1 1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.int.parse("arg", "x123"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
        });
    });
    describe("float type", () => {
        it("should work with integer decimal values", () => {
            chai_1.assert.equal(types.float.parse("arg", "0"), 0);
            chai_1.assert.equal(types.float.parse("arg", "1"), 1);
            chai_1.assert.equal(types.float.parse("arg", "1123"), 1123);
            chai_1.assert.equal(types.float.parse("arg", "05678"), 5678);
        });
        it("should work with non-integer decimal values", () => {
            chai_1.assert.equal(types.float.parse("arg", "0.1"), 0.1);
            chai_1.assert.equal(types.float.parse("arg", "123.123"), 123.123);
            chai_1.assert.equal(types.float.parse("arg", ".123"), 0.123);
            chai_1.assert.equal(types.float.parse("arg", "0."), 0);
        });
        it("should work with integer hex values", () => {
            chai_1.assert.equal(types.float.parse("arg", "0x0"), 0);
            chai_1.assert.equal(types.float.parse("arg", "0x1"), 1);
            chai_1.assert.equal(types.float.parse("arg", "0xA"), 0xa);
            chai_1.assert.equal(types.float.parse("arg", "0xa"), 0xa);
            chai_1.assert.equal(types.float.parse("arg", "0x0a"), 0x0a);
        });
        it("should work with decimal scientific notation", () => {
            chai_1.assert.equal(types.float.parse("arg", "1e0"), 1);
            chai_1.assert.equal(types.float.parse("arg", "1e123"), 1e123);
            chai_1.assert.equal(types.float.parse("arg", "12e0"), 12);
            chai_1.assert.equal(types.float.parse("arg", "012e1"), 120);
            chai_1.assert.equal(types.float.parse("arg", "0e12"), 0);
            chai_1.assert.equal(types.float.parse("arg", "1.e123"), 1e123);
            chai_1.assert.equal(types.float.parse("arg", "1.0e123"), 1e123);
            chai_1.assert.equal(types.float.parse("arg", "1.0123e123"), 1.0123e123);
        });
        it("should fail with incorrect values", () => {
            errors_1.expectHardhatError(() => types.float.parse("arg", ""), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "."), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", ".."), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "1..1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "1.asd"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "asd.123"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "asdas"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "a1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "1a"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "1 1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
            errors_1.expectHardhatError(() => types.float.parse("arg", "x123"), errors_list_1.ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE);
        });
    });
    describe("Input file type", () => {
        it("Should return the file path if the file exists and is readable", () => {
            const output = types.inputFile.parse("A file", __filename);
            chai_1.assert.equal(output, __filename);
        });
        it("Should work with a relative path", () => {
            const relative = path.relative(process.cwd(), __filename);
            const output = types.inputFile.parse("A file", relative);
            chai_1.assert.equal(output, relative);
        });
        it("Should work with an absolute path", async () => {
            const absolute = await fsExtra.realpath(__filename);
            const output = types.inputFile.parse("A file", absolute);
            chai_1.assert.equal(output, absolute);
        });
        it("Should throw if the file doesnt exist", () => {
            errors_1.expectHardhatError(() => types.inputFile.parse("A file", "NON_EXISTENT_FILE"), errors_list_1.ERRORS.ARGUMENTS.INVALID_INPUT_FILE);
        });
        it("Should throw if the file isn't readable", async function () {
            if (os.type() === "Windows_NT") {
                this.skip();
            }
            await fsExtra.createFile("A");
            await fsExtra.chmod("A", 0);
            errors_1.expectHardhatError(() => types.inputFile.parse("A file", "A"), errors_list_1.ERRORS.ARGUMENTS.INVALID_INPUT_FILE);
            await fsExtra.unlink("A");
        });
        it("Should throw if a directory is given", () => {
            errors_1.expectHardhatError(() => types.inputFile.parse("A file", __dirname), errors_list_1.ERRORS.ARGUMENTS.INVALID_INPUT_FILE);
        });
    });
    describe("JSON type", () => {
        it("Should fail if the argument isn't JSON", () => {
            errors_1.expectHardhatError(() => types.json.parse("j", "a"), errors_list_1.ERRORS.ARGUMENTS.INVALID_JSON_ARGUMENT);
            errors_1.expectHardhatError(() => types.json.parse("j", "{a:1"), errors_list_1.ERRORS.ARGUMENTS.INVALID_JSON_ARGUMENT);
            errors_1.expectHardhatError(() => types.json.parse("j", "[1],"), errors_list_1.ERRORS.ARGUMENTS.INVALID_JSON_ARGUMENT);
        });
        it("Should parse an object successfully", () => {
            chai_1.assert.deepEqual(types.json.parse("j", '{"a":1}'), { a: 1 });
        });
        it("Should parse a number", () => {
            chai_1.assert.deepEqual(types.json.parse("j", "123"), 123);
        });
        it("Should parse a list", () => {
            chai_1.assert.deepEqual(types.json.parse("j", "[1,2]"), [1, 2]);
        });
        it("Should parse a string", () => {
            chai_1.assert.deepEqual(types.json.parse("j", '"a"'), "a");
        });
        it("Should accept anything except undefined as valid", () => {
            chai_1.assert.doesNotThrow(() => types.json.validate("json", 1));
            chai_1.assert.doesNotThrow(() => types.json.validate("json", "asd"));
            chai_1.assert.doesNotThrow(() => types.json.validate("json", [1]));
            chai_1.assert.doesNotThrow(() => types.json.validate("json", { a: 123 }));
            chai_1.assert.doesNotThrow(() => types.json.validate("json", null));
            chai_1.assert.throws(() => types.json.validate("json", undefined));
        });
    });
    describe("any type", () => {
        it("Should not be a CLI argument type", () => {
            chai_1.assert.isUndefined(types.any.parse);
        });
        it("Should accept anything", () => {
            chai_1.assert.doesNotThrow(() => types.any.validate("a", "as"));
            chai_1.assert.doesNotThrow(() => types.any.validate("a", undefined));
            chai_1.assert.doesNotThrow(() => types.any.validate("a", null));
            chai_1.assert.doesNotThrow(() => types.any.validate("a", []));
            chai_1.assert.doesNotThrow(() => types.any.validate("a", {}));
            chai_1.assert.doesNotThrow(() => types.any.validate("a", function () { }));
        });
    });
});
//# sourceMappingURL=argumentTypes.js.map