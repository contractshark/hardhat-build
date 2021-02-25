"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NULL_BYTES_32 = exports.LAST_TX_HASH_OF_10496585 = exports.FIRST_TX_HASH_OF_10496585 = exports.TOTAL_DIFFICULTY_OF_BLOCK_10496585 = exports.BLOCK_HASH_OF_10496585 = exports.BLOCK_NUMBER_OF_10496585 = exports.DAI_TOTAL_SUPPLY_STORAGE_POSITION = exports.BITFINEX_WALLET_ADDRESS = exports.EMPTY_ACCOUNT_ADDRESS = exports.UNISWAP_FACTORY_ADDRESS = exports.WETH_ADDRESS = exports.DAI_CONTRACT_LENGTH = exports.DAI_ADDRESS = void 0;
// reused from ethers.js
const ethereumjs_util_1 = require("ethereumjs-util");
exports.DAI_ADDRESS = ethereumjs_util_1.toBuffer("0x6b175474e89094c44da98b954eedeac495271d0f");
exports.DAI_CONTRACT_LENGTH = 7904;
exports.WETH_ADDRESS = ethereumjs_util_1.toBuffer("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
exports.UNISWAP_FACTORY_ADDRESS = ethereumjs_util_1.toBuffer("0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95");
exports.EMPTY_ACCOUNT_ADDRESS = ethereumjs_util_1.toBuffer("0x1234567890abcdef1234567890abcdef12345678");
// top Ether holder as of 24.08.2020
exports.BITFINEX_WALLET_ADDRESS = ethereumjs_util_1.toBuffer("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
exports.DAI_TOTAL_SUPPLY_STORAGE_POSITION = ethereumjs_util_1.toBuffer([1]);
// 10496585 block number was chosen for no particular reason
exports.BLOCK_NUMBER_OF_10496585 = new ethereumjs_util_1.BN(10496585);
exports.BLOCK_HASH_OF_10496585 = ethereumjs_util_1.toBuffer("0x71d5e7c8ff9ea737034c16e333a75575a4a94d29482e0c2b88f0a6a8369c1812");
exports.TOTAL_DIFFICULTY_OF_BLOCK_10496585 = new ethereumjs_util_1.BN("16430631039734293348166");
exports.FIRST_TX_HASH_OF_10496585 = ethereumjs_util_1.toBuffer("0xed0b0b132bd693ef34a72084f090df07c5c3a2ec019d76316da040d4222cdfb8");
exports.LAST_TX_HASH_OF_10496585 = ethereumjs_util_1.toBuffer("0xd809fb6f7060abc8de068c7a38e9b2b04530baf0cc4ce9a2420d59388be10ee7");
exports.NULL_BYTES_32 = ethereumjs_util_1.toBuffer(`0x${"0".repeat(64)}`);
//# sourceMappingURL=constants.js.map