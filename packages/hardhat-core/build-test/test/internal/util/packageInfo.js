"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const packageInfo_1 = require("../../../src/internal/util/packageInfo");
describe("packageInfo", () => {
    it("Should give the right package.json", async () => {
        const packageJson = await packageInfo_1.getPackageJson();
        chai_1.assert.equal(packageJson.name, "hardhat");
        // We don't test the version number because that would be hard to maintain
        chai_1.assert.isString(packageJson.version);
    });
    it("should give the right package root", async () => {
        const root = await fs_extra_1.default.realpath(path_1.default.join(__dirname, "..", "..", ".."));
        chai_1.assert.equal(packageInfo_1.getPackageRoot(), root);
    });
});
//# sourceMappingURL=packageInfo.js.map