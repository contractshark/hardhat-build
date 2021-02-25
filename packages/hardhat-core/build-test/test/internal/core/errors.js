"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_1 = require("../../../src/internal/core/errors");
const errors_list_1 = require("../../../src/internal/core/errors-list");
const unsafe_1 = require("../../../src/internal/util/unsafe");
const errors_2 = require("../../helpers/errors");
const mockErrorDescriptor = {
    number: 123,
    message: "error message",
    title: "Mock error",
    description: "This is a mock error",
    shouldBeReported: false,
};
describe("HardhatError", () => {
    describe("Type guard", () => {
        it("Should return true for HardhatErrors", () => {
            chai_1.assert.isTrue(errors_1.HardhatError.isHardhatError(new errors_1.HardhatError(mockErrorDescriptor)));
        });
        it("Should return false for everything else", () => {
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError(new Error()));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError(new errors_1.NomicLabsHardhatPluginError("asd", "asd")));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError(undefined));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError(null));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError(123));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError("123"));
            chai_1.assert.isFalse(errors_1.HardhatError.isHardhatError({ asd: 123 }));
        });
    });
    describe("Without parent error", () => {
        it("should have the right error number", () => {
            const error = new errors_1.HardhatError(mockErrorDescriptor);
            chai_1.assert.equal(error.number, mockErrorDescriptor.number);
        });
        it("should format the error code to 4 digits", () => {
            const error = new errors_1.HardhatError(mockErrorDescriptor);
            chai_1.assert.equal(error.message.substr(0, 7), "HH123: ");
            chai_1.assert.equal(new errors_1.HardhatError({
                number: 1,
                message: "",
                title: "Title",
                description: "Description",
                shouldBeReported: false,
            }).message.substr(0, 7), "HH1: ");
        });
        it("should have the right error message", () => {
            const error = new errors_1.HardhatError(mockErrorDescriptor);
            chai_1.assert.equal(error.message, `HH123: ${mockErrorDescriptor.message}`);
        });
        it("should format the error message with the template params", () => {
            const error = new errors_1.HardhatError({
                number: 12,
                message: "%a% %b% %c%",
                title: "Title",
                description: "Description",
                shouldBeReported: false,
            }, { a: "a", b: "b", c: 123 });
            chai_1.assert.equal(error.message, "HH12: a b 123");
        });
        it("shouldn't have a parent", () => {
            chai_1.assert.isUndefined(new errors_1.HardhatError(mockErrorDescriptor).parent);
        });
        it("Should work with instanceof", () => {
            const error = new errors_1.HardhatError(mockErrorDescriptor);
            chai_1.assert.instanceOf(error, errors_1.HardhatError);
        });
    });
    describe("With parent error", () => {
        it("should have the right parent error", () => {
            const parent = new Error();
            const error = new errors_1.HardhatError(mockErrorDescriptor, {}, parent);
            chai_1.assert.equal(error.parent, parent);
        });
        it("should format the error message with the template params", () => {
            const error = new errors_1.HardhatError({
                number: 12,
                message: "%a% %b% %c%",
                title: "Title",
                description: "Description",
                shouldBeReported: false,
            }, { a: "a", b: "b", c: 123 }, new Error());
            chai_1.assert.equal(error.message, "HH12: a b 123");
        });
        it("Should work with instanceof", () => {
            const parent = new Error();
            const error = new errors_1.HardhatError(mockErrorDescriptor, {}, parent);
            chai_1.assert.instanceOf(error, errors_1.HardhatError);
        });
    });
});
describe("Error ranges", () => {
    function inRange(n, min, max) {
        return n >= min && n <= max;
    }
    it("Should have max > min", () => {
        for (const errorGroup of unsafe_1.unsafeObjectKeys(errors_list_1.ERROR_RANGES)) {
            const range = errors_list_1.ERROR_RANGES[errorGroup];
            chai_1.assert.isBelow(range.min, range.max, `Range of ${errorGroup} is invalid`);
        }
    });
    it("Shouldn't overlap ranges", () => {
        for (const errorGroup of unsafe_1.unsafeObjectKeys(errors_list_1.ERROR_RANGES)) {
            const range = errors_list_1.ERROR_RANGES[errorGroup];
            for (const errorGroup2 of unsafe_1.unsafeObjectKeys(errors_list_1.ERROR_RANGES)) {
                const range2 = errors_list_1.ERROR_RANGES[errorGroup2];
                if (errorGroup === errorGroup2) {
                    continue;
                }
                chai_1.assert.isFalse(inRange(range2.min, range.min, range.max), `Ranges of ${errorGroup} and ${errorGroup2} overlap`);
                chai_1.assert.isFalse(inRange(range2.max, range.min, range.max), `Ranges of ${errorGroup} and ${errorGroup2} overlap`);
            }
        }
    });
});
describe("Error descriptors", () => {
    it("Should have all errors inside their ranges", () => {
        for (const errorGroup of unsafe_1.unsafeObjectKeys(errors_list_1.ERRORS)) {
            const range = errors_list_1.ERROR_RANGES[errorGroup];
            for (const [name, errorDescriptor] of Object.entries(errors_list_1.ERRORS[errorGroup])) {
                chai_1.assert.isAtLeast(errorDescriptor.number, range.min, `ERRORS.${errorGroup}.${name}'s number is out of range`);
                chai_1.assert.isAtMost(errorDescriptor.number, range.max - 1, `ERRORS.${errorGroup}.${name}'s number is out of range`);
            }
        }
    });
    it("Shouldn't repeat error numbers", () => {
        for (const errorGroup of unsafe_1.unsafeObjectKeys(errors_list_1.ERRORS)) {
            for (const [name, errorDescriptor] of Object.entries(errors_list_1.ERRORS[errorGroup])) {
                for (const [name2, errorDescriptor2] of Object.entries(errors_list_1.ERRORS[errorGroup])) {
                    if (name !== name2) {
                        chai_1.assert.notEqual(errorDescriptor.number, errorDescriptor2.number, `ERRORS.${errorGroup}.${name} and ${errorGroup}.${name2} have repeated numbers`);
                    }
                }
            }
        }
    });
    it("Should keep the numbers in order, without gaps", () => {
        for (const errorGroup of unsafe_1.unsafeObjectKeys(errors_list_1.ERRORS)) {
            const range = errors_list_1.ERROR_RANGES[errorGroup];
            let expectedErrorNumber = range.min;
            for (const [name, errorDescriptor] of Object.entries(errors_list_1.ERRORS[errorGroup])) {
                chai_1.assert.equal(errorDescriptor.number, expectedErrorNumber, `ERRORS.${errorGroup}.${name}'s number is out of range`);
                expectedErrorNumber += 1;
            }
        }
    });
});
describe("HardhatPluginError", () => {
    describe("Type guard", () => {
        it("Should return true for HardhatPluginError", () => {
            chai_1.assert.isTrue(errors_1.HardhatPluginError.isHardhatPluginError(new errors_1.HardhatPluginError("asd", "asd")));
        });
        it("Should return false for everything else", () => {
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError(new Error()));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError(new errors_1.HardhatError(errors_list_1.ERRORS.GENERAL.NOT_INSIDE_PROJECT)));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError(undefined));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError(null));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError(123));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError("123"));
            chai_1.assert.isFalse(errors_1.HardhatPluginError.isHardhatPluginError({ asd: 123 }));
        });
    });
    describe("constructors", () => {
        describe("automatic plugin name", () => {
            it("Should accept a parent error", () => {
                const message = "m";
                const parent = new Error();
                const error = new errors_1.HardhatPluginError(message, parent);
                chai_1.assert.equal(error.message, message);
                chai_1.assert.equal(error.parent, parent);
            });
            it("Should work without a parent error", () => {
                const message = "m2";
                const error = new errors_1.HardhatPluginError(message);
                chai_1.assert.equal(error.message, message);
                chai_1.assert.isUndefined(error.parent);
            });
            it("Should autodetect the plugin name", () => {
                const message = "m";
                const parent = new Error();
                const error = new errors_1.HardhatPluginError(message, parent);
                // This is being called from mocha, so that would be used as plugin name
                chai_1.assert.equal(error.pluginName, "mocha");
            });
            it("Should work with instanceof", () => {
                const message = "m";
                const parent = new Error();
                const error = new errors_1.HardhatPluginError(message, parent);
                chai_1.assert.instanceOf(error, errors_1.HardhatPluginError);
            });
        });
        describe("explicit plugin name", () => {
            it("Should accept a parent error", () => {
                const plugin = "p";
                const message = "m";
                const parent = new Error();
                const error = new errors_1.HardhatPluginError(plugin, message, parent);
                chai_1.assert.equal(error.pluginName, plugin);
                chai_1.assert.equal(error.message, message);
                chai_1.assert.equal(error.parent, parent);
            });
            it("Should work without a parent error", () => {
                const plugin = "p2";
                const message = "m2";
                const error = new errors_1.HardhatPluginError(plugin, message);
                chai_1.assert.equal(error.pluginName, plugin);
                chai_1.assert.equal(error.message, message);
                chai_1.assert.isUndefined(error.parent);
            });
            it("Should work with instanceof", () => {
                const plugin = "p";
                const message = "m";
                const parent = new Error();
                const error = new errors_1.HardhatPluginError(plugin, message, parent);
                chai_1.assert.instanceOf(error, errors_1.HardhatPluginError);
            });
        });
    });
});
describe("NomicLabsHardhatPluginError", () => {
    describe("Type guard", () => {
        it("Should return true for NomicLabsHardhatPluginError", () => {
            chai_1.assert.isTrue(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(new errors_1.NomicLabsHardhatPluginError("asd", "asd")));
        });
        it("Should also be a HardhatPluginError", () => {
            chai_1.assert.isTrue(errors_1.HardhatPluginError.isHardhatPluginError(new errors_1.NomicLabsHardhatPluginError("asd", "asd")));
        });
        it("Should return false for everything else", () => {
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(new Error()));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(new errors_1.HardhatError(errors_list_1.ERRORS.GENERAL.NOT_INSIDE_PROJECT)));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(new errors_1.HardhatPluginError("asd", "asd")));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(undefined));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(null));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError(123));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError("123"));
            chai_1.assert.isFalse(errors_1.NomicLabsHardhatPluginError.isNomicLabsHardhatPluginError({ asd: 123 }));
        });
    });
});
describe("applyErrorMessageTemplate", () => {
    describe("Variable names", () => {
        it("Should reject invalid variable names", () => {
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("", { "1": 1 }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME);
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("", { "asd%": 1 }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME);
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("", { "asd asd": 1 }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME);
        });
    });
    describe("Values", () => {
        it("shouldn't contain valid variable tags", () => {
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("%asd%", { asd: "%as%" }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG);
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("%asd%", { asd: "%a123%" }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG);
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("%asd%", {
                asd: { toString: () => "%asd%" },
            }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG);
        });
        it("Shouldn't contain the %% tag", () => {
            errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("%asd%", { asd: "%%" }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG);
        });
    });
    describe("Replacements", () => {
        describe("String values", () => {
            it("Should replace variable tags for the values", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd %asd% 123 %asd%", { asd: "r" }), "asd r 123 r");
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%asd% %asd% %fgh% 123", {
                    asd: "r",
                    fgh: "b",
                }), "asdr r b 123");
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%asd% %asd% %fgh% 123", {
                    asd: "r",
                    fgh: "",
                }), "asdr r  123");
            });
        });
        describe("Non-string values", () => {
            it("Should replace undefined values for undefined", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd %asd% 123 %asd%", { asd: undefined }), "asd undefined 123 undefined");
            });
            it("Should replace null values for null", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd %asd% 123 %asd%", { asd: null }), "asd null 123 null");
            });
            it("Should use their toString methods", () => {
                const toR = { toString: () => "r" };
                const toB = { toString: () => "b" };
                const toEmpty = { toString: () => "" };
                const toUndefined = { toString: () => undefined };
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd %asd% 123 %asd%", { asd: toR }), "asd r 123 r");
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%asd% %asd% %fgh% 123", {
                    asd: toR,
                    fgh: toB,
                }), "asdr r b 123");
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%asd% %asd% %fgh% 123", {
                    asd: toR,
                    fgh: toEmpty,
                }), "asdr r  123");
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%asd% %asd% %fgh% 123", {
                    asd: toR,
                    fgh: toUndefined,
                }), "asdr r undefined 123");
            });
        });
        describe("%% sign", () => {
            it("Should be replaced with %", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%%asd", {}), "asd%asd");
            });
            it("Shouldn't apply replacements if after this one a new variable tag appears", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("asd%%asd%% %asd%", { asd: "123" }), "asd%asd% 123");
            });
        });
        describe("Missing variable tag", () => {
            it("Should fail if a viable tag is missing and its value is not", () => {
                errors_2.expectHardhatError(() => errors_1.applyErrorMessageTemplate("", { asd: "123" }), errors_list_1.ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING);
            });
        });
        describe("Missing variable", () => {
            it("Should work, leaving the variable tag", () => {
                chai_1.assert.equal(errors_1.applyErrorMessageTemplate("%asd% %fgh%", { asd: "123" }), "123 %fgh%");
            });
        });
    });
});
//# sourceMappingURL=errors.js.map