"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_list_1 = require("../../../src/internal/core/errors-list");
const lazy_1 = require("../../../src/internal/util/lazy");
const errors_1 = require("../../helpers/errors");
// tslint:disable no-inferred-empty-object-type
describe("lazy module", () => {
    describe("lazyObject", () => {
        it("shouldn't call the initializer function eagerly", () => {
            let called = false;
            lazy_1.lazyObject(() => {
                called = true;
                return {};
            });
            chai_1.assert.isFalse(called);
        });
        it("should throw if the objectConstructor doesn't return an object", () => {
            const num = lazy_1.lazyObject(() => 123);
            chai_1.assert.throws(() => num.asd);
        });
        it("should call the initializer just once", () => {
            let numberOfCalls = 0;
            const obj = lazy_1.lazyObject(() => {
                numberOfCalls += 1;
                return {
                    a: 1,
                    b() {
                        return this.a;
                    },
                };
            });
            chai_1.assert.equal(numberOfCalls, 0);
            obj.a = 2;
            chai_1.assert.equal(numberOfCalls, 1);
            obj.b();
            chai_1.assert.equal(numberOfCalls, 1);
            delete obj.a;
            chai_1.assert.equal(numberOfCalls, 1);
            obj.asd = 123;
            chai_1.assert.equal(numberOfCalls, 1);
        });
        it("should be equivalent to the object returned by the initializer", () => {
            const expected = {
                a: 123,
                b: "asd",
                c: {
                    d: [1, 2, 3],
                    e: 1.3,
                },
                f: [3, { g: 1 }],
            };
            const obj = lazy_1.lazyObject(() => (Object.assign({}, expected)));
            chai_1.assert.deepEqual(obj, expected);
        });
        it("doesn't support classes", () => {
            const obj = lazy_1.lazyObject(() => class {
            });
            errors_1.expectHardhatError(() => (obj.asd = 123), errors_list_1.ERRORS.GENERAL.UNSUPPORTED_OPERATION);
            errors_1.expectHardhatError(() => obj.asd, errors_list_1.ERRORS.GENERAL.UNSUPPORTED_OPERATION);
            chai_1.assert.throws(() => new obj(), "obj is not a constructor");
        });
        it("doesn't support functions", () => {
            const obj = lazy_1.lazyObject(() => () => { });
            errors_1.expectHardhatError(() => (obj.asd = 123), errors_list_1.ERRORS.GENERAL.UNSUPPORTED_OPERATION);
            errors_1.expectHardhatError(() => obj.asd, errors_list_1.ERRORS.GENERAL.UNSUPPORTED_OPERATION);
            chai_1.assert.throws(() => obj(), "obj is not a function");
        });
        it("should trap defineProperty correctly", () => {
            const obj = lazy_1.lazyObject(() => ({}));
            obj.asd = 123;
            chai_1.assert.equal(obj.asd, 123);
        });
        it("should trap deleteProperty correctly", () => {
            const obj = lazy_1.lazyObject(() => ({ a: 1 }));
            delete obj.a;
            chai_1.assert.isUndefined(obj.a);
        });
        it("should trap get correctly", () => {
            const obj = lazy_1.lazyObject(() => ({ a: 1 }));
            chai_1.assert.equal(obj.a, 1);
        });
        it("should trap getOwnPropertyDescriptor correctly", () => {
            const obj = lazy_1.lazyObject(() => ({ a: 1 }));
            chai_1.assert.deepEqual(Object.getOwnPropertyDescriptor(obj, "a"), {
                value: 1,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        });
        it("should trap getPrototypeOf correctly", () => {
            const proto = {};
            const obj = lazy_1.lazyObject(() => Object.create(proto));
            chai_1.assert.equal(Object.getPrototypeOf(obj), proto);
        });
        it("should trap has correctly", () => {
            const proto = { a: 1 };
            const obj = lazy_1.lazyObject(() => {
                const v = Object.create(proto);
                v.b = 1;
                return v;
            });
            chai_1.assert.isTrue("a" in obj);
            chai_1.assert.isTrue("b" in obj);
            chai_1.assert.isFalse("c" in obj);
        });
        it("should trap isExtensible correctly", () => {
            const obj = lazy_1.lazyObject(() => {
                const v = {};
                Object.preventExtensions(v);
                return v;
            });
            chai_1.assert.isFalse(Object.isExtensible(obj));
            const obj2 = lazy_1.lazyObject(() => ({}));
            chai_1.assert.isTrue(Object.isExtensible(obj2));
        });
        it("should trap ownKeys correctly", () => {
            const proto = { a: 1 };
            const obj = lazy_1.lazyObject(() => {
                const v = Object.create(proto);
                v.b = 1;
                return v;
            });
            obj.c = 123;
            chai_1.assert.deepEqual(Object.getOwnPropertyNames(obj), ["b", "c"]);
        });
        it("should trap preventExtensions correctly", () => {
            const obj = lazy_1.lazyObject(() => ({}));
            Object.preventExtensions(obj);
            chai_1.assert.isFalse(Object.isExtensible(obj));
        });
        it("should trap set correctly", () => {
            const obj = lazy_1.lazyObject(() => ({}));
            obj.asd = 123;
            chai_1.assert.deepEqual(Object.getOwnPropertyNames(obj), ["asd"]);
            chai_1.assert.equal(obj.asd, 123);
        });
        it("should trap setPrototypeOf correctly", () => {
            const proto = Object.create(null);
            const obj = lazy_1.lazyObject(() => Object.create(proto));
            chai_1.assert.equal(Object.getPrototypeOf(obj), proto);
            chai_1.assert.isUndefined(obj.a);
            const newProto = { a: 123 };
            Object.setPrototypeOf(obj, newProto);
            chai_1.assert.equal(Object.getPrototypeOf(obj), newProto);
            chai_1.assert.equal(obj.a, 123);
        });
        it("should throw if it's used to create an object without prototype", () => {
            const obj = lazy_1.lazyObject(() => Object.create(null));
            errors_1.expectHardhatError(() => obj.asd, errors_list_1.ERRORS.GENERAL.UNSUPPORTED_OPERATION);
        });
    });
});
describe("lazy import", () => {
    it("should work with a function module", () => {
        const lazyF = lazy_1.lazyFunction(() => () => ({ a: 1, b: 2 }));
        chai_1.assert.deepEqual(lazyF(), { a: 1, b: 2 });
    });
    it("should work with a class module", () => {
        const lazyC = lazy_1.lazyFunction(() => class {
            constructor() {
                this.a = 1;
                this.b = 2;
            }
        });
        chai_1.assert.deepEqual(new lazyC(), { a: 1, b: 2 });
    });
});
//# sourceMappingURL=lazy.js.map