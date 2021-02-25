"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_1 = require("../../../src/internal/core/errors");
const reporter_1 = require("../../../src/internal/sentry/reporter");
const mockErrorDescriptor = {
    number: 123,
    message: "error message",
    title: "Mock error",
    description: "This is a mock error",
    shouldBeReported: false,
};
describe("Reporter", () => {
    let originalHasTelemetryConsent;
    beforeEach(() => {
        originalHasTelemetryConsent = reporter_1.Reporter._hasTelemetryConsent;
        reporter_1.Reporter._hasTelemetryConsent = () => true;
    });
    afterEach(() => {
        reporter_1.Reporter._hasTelemetryConsent = originalHasTelemetryConsent;
    });
    describe("shouldReport", () => {
        it("should report plain errors", () => {
            const result = reporter_1.Reporter.shouldReport(new Error("some message"));
            chai_1.assert.isTrue(result);
        });
        it("should report HardhatErrors that have the shouldBeReported flag", () => {
            const error = new errors_1.HardhatError(Object.assign(Object.assign({}, mockErrorDescriptor), { shouldBeReported: true }));
            const result = reporter_1.Reporter.shouldReport(error);
            chai_1.assert.isTrue(result);
        });
        it("should not report HardhatErrors that don't have the shouldBeReported flag", () => {
            const error = new errors_1.HardhatError(Object.assign(Object.assign({}, mockErrorDescriptor), { shouldBeReported: false }));
            const result = reporter_1.Reporter.shouldReport(error);
            chai_1.assert.isFalse(result);
        });
        it("should not report HardhatPluginErrors", () => {
            const result = reporter_1.Reporter.shouldReport(new errors_1.HardhatPluginError("asd", "asd"));
            chai_1.assert.isFalse(result);
        });
        it("should report NomicLabsHardhatPluginErrors that have the shouldBeReported flag", () => {
            const result = reporter_1.Reporter.shouldReport(new errors_1.NomicLabsHardhatPluginError("asd", "asd", new Error("some message"), true));
            chai_1.assert.isTrue(result);
        });
        it("should not report NomicLabsHardhatPluginErrors that don't have the shouldBeReported flag", () => {
            const result = reporter_1.Reporter.shouldReport(new errors_1.NomicLabsHardhatPluginError("asd", "asd", new Error("some message"), false));
            chai_1.assert.isFalse(result);
        });
        it("should not report if the user hasn't given telemetry consent", () => {
            reporter_1.Reporter._hasTelemetryConsent = () => false;
            const result = reporter_1.Reporter.shouldReport(new Error("some message"));
            chai_1.assert.isFalse(result);
        });
    });
});
//# sourceMappingURL=reporter.js.map