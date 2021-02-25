"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("../../../../src/internal/core/providers/http");
const setup_1 = require("../../../setup");
describe("HttpProvider", function () {
    describe("429 Too many requests - retries", function () {
        it("Retries are correctly handled for Alchemy", async function () {
            if (setup_1.ALCHEMY_URL === undefined || setup_1.ALCHEMY_URL === "") {
                this.skip();
                return;
            }
            const provider = new http_1.HttpProvider(setup_1.ALCHEMY_URL, "Alchemy");
            // We just make a bunch of requests that would otherwise fail
            const requests = [];
            for (let i = 0; i < 20; i++) {
                requests.push(provider.request({
                    method: "eth_getTransactionCount",
                    params: ["0x6b175474e89094c44da98b954eedeac495271d0f", "0x12"],
                }));
            }
            await Promise.all(requests);
        });
    });
});
//# sourceMappingURL=http.js.map