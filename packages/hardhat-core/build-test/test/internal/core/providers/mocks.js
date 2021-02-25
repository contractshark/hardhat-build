"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockedProvider = void 0;
const events_1 = require("events");
class MockedProvider extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this._returnValues = {};
        this._latestParams = {};
        this._numberOfCalls = {};
    }
    // If a lambda is passed as value, it's return value is used.
    setReturnValue(method, value) {
        this._returnValues[method] = value;
    }
    getNumberOfCalls(method) {
        if (this._numberOfCalls[method] === undefined) {
            return 0;
        }
        return this._numberOfCalls[method];
    }
    getLatestParams(method) {
        return this._latestParams[method];
    }
    getTotalNumberOfCalls() {
        return Object.values(this._numberOfCalls).reduce((p, c) => p + c, 0);
    }
    async request({ method, params = [], }) {
        this._latestParams[method] = params;
        if (this._numberOfCalls[method] === undefined) {
            this._numberOfCalls[method] = 1;
        }
        else {
            this._numberOfCalls[method] += 1;
        }
        let ret = this._returnValues[method];
        if (ret instanceof Function) {
            ret = ret();
        }
        return ret;
    }
}
exports.MockedProvider = MockedProvider;
//# sourceMappingURL=mocks.js.map