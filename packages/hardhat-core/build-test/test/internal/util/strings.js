"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const strings_1 = require("../../../src/internal/util/strings");
describe("String utils", function () {
    describe("pluralize", function () {
        it("Should return the singular form if n is 1", function () {
            chai_1.assert.equal(strings_1.pluralize(1, "asd"), "asd");
            chai_1.assert.equal(strings_1.pluralize(1, "asd", "qwe"), "asd");
        });
        it("Should return the given plural form if n is >1", function () {
            chai_1.assert.equal(strings_1.pluralize(2, "sing", "plur"), "plur");
            chai_1.assert.equal(strings_1.pluralize(0, "sing", "plur"), "plur");
            chai_1.assert.equal(strings_1.pluralize(123, "sing", "plur"), "plur");
        });
        it("Should construct the plural form if n is >1 and no plural form was given", function () {
            chai_1.assert.equal(strings_1.pluralize(2, "sing"), "sings");
            chai_1.assert.equal(strings_1.pluralize(0, "sing"), "sings");
            chai_1.assert.equal(strings_1.pluralize(123, "sing"), "sings");
        });
    });
});
describe("replaceAll", function () {
    it("Should work with empty strings", function () {
        chai_1.assert.equal(strings_1.replaceAll("", "asd", "123"), "");
    });
    it("Should work with no occurrence", function () {
        chai_1.assert.equal(strings_1.replaceAll("a", "b", "c"), "a");
    });
    it("Should work with a single occurrence", function () {
        chai_1.assert.equal(strings_1.replaceAll("ayguhi", "a", "c"), "cyguhi");
    });
    it("Should work with a multiple occurrences", function () {
        chai_1.assert.equal(strings_1.replaceAll("alakjahjkasd", "a", "c"), "clckjchjkcsd");
    });
    it("Should not replace occurrences present in the replacement string", function () {
        chai_1.assert.equal(strings_1.replaceAll("a b c d a", "a", "_a_"), "_a_ b c d _a_");
    });
});
//# sourceMappingURL=strings.js.map