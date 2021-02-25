"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const events_1 = require("events");
const event_emitter_1 = require("../../../src/internal/util/event-emitter");
describe("EventEmitterWrapper", function () {
    it("Should have all the members of EventEmitter except private ones and 'domain'", function () {
        const emitter = new events_1.EventEmitter();
        const wrapper = new event_emitter_1.EventEmitterWrapper(emitter);
        for (const key in emitter) {
            if (key.startsWith("_") || key === "domain") {
                continue;
            }
            chai_1.assert.typeOf(wrapper[key], typeof emitter[key]);
        }
    });
    describe("Event emitter methods", function () {
        let emitter;
        let wrapper;
        let accessedMembers;
        beforeEach(function () {
            accessedMembers = [];
            emitter = new events_1.EventEmitter();
            wrapper = new event_emitter_1.EventEmitterWrapper(new Proxy(emitter, {
                get(target, p, receiver) {
                    chai_1.assert.typeOf(p, "string");
                    accessedMembers.push(p);
                    return Reflect.get(target, p, receiver);
                },
            }));
        });
        function assertForwardAndReturnThis(call, func) {
            const ret = call();
            // The emitter may call other things internally, but we want to make sure
            // that the first thing called is our function under test
            chai_1.assert.equal(accessedMembers[0], func);
            chai_1.assert.equal(ret, wrapper);
        }
        describe("Method addListener", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.addListener("asd", () => { }), "addListener");
            });
        });
        describe("Method on", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.on("asd", () => { }), "on");
            });
        });
        describe("Method once", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.once("asd", () => { }), "once");
            });
        });
        describe("Method prependListener", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.prependListener("asd", () => { }), "prependListener");
            });
        });
        describe("Method prependOnceListener", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.prependOnceListener("asd", () => { }), "prependOnceListener");
            });
        });
        describe("Method removeListener", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.removeListener("asd", () => { }), "removeListener");
            });
        });
        describe("Method off", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.off("asd", () => { }), "off");
            });
        });
        describe("Method removeAllListeners", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.removeAllListeners("asd"), "removeAllListeners");
            });
        });
        describe("Method setMaxListeners", function () {
            it("Should forward it to the emitter and return the wrapper", function () {
                assertForwardAndReturnThis(() => wrapper.setMaxListeners(123), "setMaxListeners");
                chai_1.assert.equal(emitter.getMaxListeners(), 123);
            });
        });
        describe("Method getMaxListeners", function () {
            it("Should return the same value as the emitter", function () {
                emitter.setMaxListeners(12);
                chai_1.assert.equal(emitter.getMaxListeners(), 12);
                chai_1.assert.equal(wrapper.getMaxListeners(), emitter.getMaxListeners());
            });
        });
        describe("Method listeners", function () {
            it("Should return the same value as the emitter", function () {
                const listener1 = () => { };
                emitter.on("a", listener1);
                const listeners = wrapper.listeners("a");
                chai_1.assert.lengthOf(listeners, 1);
                chai_1.assert.equal(listeners[0], listener1);
            });
        });
        describe("Method rawListeners", function () {
            it("Should return the same value as the emitter", function () {
                const listener1 = () => { };
                emitter.once("a", listener1);
                emitter.on("a", listener1);
                const rawListeners = wrapper.rawListeners("a");
                chai_1.assert.lengthOf(rawListeners, 2);
                chai_1.assert.notEqual(rawListeners[0], listener1);
                chai_1.assert.equal(rawListeners[1], listener1);
            });
        });
        describe("Method emit", function () {
            it("Should emit if the wrapped object emits", function () {
                let emitted = false;
                wrapper.on("e", () => {
                    emitted = true;
                });
                emitter.emit("e");
                chai_1.assert.isTrue(emitted);
            });
            it("The wrapped object should emit if the wrapper does", function () {
                let emitted = false;
                emitter.on("e", () => {
                    emitted = true;
                });
                wrapper.emit("e");
                chai_1.assert.isTrue(emitted);
            });
        });
        describe("Method eventNames", function () {
            it("Should return the same value as the emitter", function () {
                emitter.on("a", () => { });
                emitter.on("b", () => { });
                const names = wrapper.eventNames();
                chai_1.assert.deepEqual(names, ["a", "b"]);
            });
        });
        describe("Method listenerCount", function () {
            it("Should return the same value as the emitter", function () {
                emitter.on("a", () => { });
                emitter.on("b", () => { });
                emitter.on("b", () => { });
                chai_1.assert.equal(emitter.listenerCount("a"), 1);
                chai_1.assert.equal(emitter.listenerCount("b"), 2);
                chai_1.assert.equal(wrapper.listenerCount("a"), emitter.listenerCount("a"));
                chai_1.assert.equal(wrapper.listenerCount("b"), emitter.listenerCount("b"));
            });
        });
    });
});
//# sourceMappingURL=event-emitter.js.map