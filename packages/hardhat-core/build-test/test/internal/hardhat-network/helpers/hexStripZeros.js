"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexStripZeros = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
function hexStripZeros(hexString) {
    return ethereumjs_util_1.addHexPrefix(ethereumjs_util_1.stripZeros(hexString));
}
exports.hexStripZeros = hexStripZeros;
//# sourceMappingURL=hexStripZeros.js.map