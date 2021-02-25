export declare enum Opcode {
    STOP = 0,
    ADD = 1,
    MUL = 2,
    SUB = 3,
    DIV = 4,
    SDIV = 5,
    MOD = 6,
    SMOD = 7,
    ADDMOD = 8,
    MULMOD = 9,
    EXP = 10,
    SIGNEXTEND = 11,
    UNRECOGNIZED_0C = 12,
    UNRECOGNIZED_0D = 13,
    UNRECOGNIZED_0E = 14,
    UNRECOGNIZED_0F = 15,
    LT = 16,
    GT = 17,
    SLT = 18,
    SGT = 19,
    EQ = 20,
    ISZERO = 21,
    AND = 22,
    OR = 23,
    XOR = 24,
    NOT = 25,
    BYTE = 26,
    SHL = 27,
    SHR = 28,
    SAR = 29,
    UNRECOGNIZED_1E = 30,
    UNRECOGNIZED_1F = 31,
    SHA3 = 32,
    UNRECOGNIZED_21 = 33,
    UNRECOGNIZED_22 = 34,
    UNRECOGNIZED_23 = 35,
    UNRECOGNIZED_24 = 36,
    UNRECOGNIZED_25 = 37,
    UNRECOGNIZED_26 = 38,
    UNRECOGNIZED_27 = 39,
    UNRECOGNIZED_28 = 40,
    UNRECOGNIZED_29 = 41,
    UNRECOGNIZED_2A = 42,
    UNRECOGNIZED_2B = 43,
    UNRECOGNIZED_2C = 44,
    UNRECOGNIZED_2D = 45,
    UNRECOGNIZED_2E = 46,
    UNRECOGNIZED_2F = 47,
    ADDRESS = 48,
    BALANCE = 49,
    ORIGIN = 50,
    CALLER = 51,
    CALLVALUE = 52,
    CALLDATALOAD = 53,
    CALLDATASIZE = 54,
    CALLDATACOPY = 55,
    CODESIZE = 56,
    CODECOPY = 57,
    GASPRICE = 58,
    EXTCODESIZE = 59,
    EXTCODECOPY = 60,
    RETURNDATASIZE = 61,
    RETURNDATACOPY = 62,
    EXTCODEHASH = 63,
    BLOCKHASH = 64,
    COINBASE = 65,
    TIMESTAMP = 66,
    NUMBER = 67,
    DIFFICULTY = 68,
    GASLIMIT = 69,
    CHAINID = 70,
    SELFBALANCE = 71,
    UNRECOGNIZED_48 = 72,
    UNRECOGNIZED_49 = 73,
    UNRECOGNIZED_4A = 74,
    UNRECOGNIZED_4B = 75,
    UNRECOGNIZED_4C = 76,
    UNRECOGNIZED_4D = 77,
    UNRECOGNIZED_4E = 78,
    UNRECOGNIZED_4F = 79,
    POP = 80,
    MLOAD = 81,
    MSTORE = 82,
    MSTORE8 = 83,
    SLOAD = 84,
    SSTORE = 85,
    JUMP = 86,
    JUMPI = 87,
    PC = 88,
    MSIZE = 89,
    GAS = 90,
    JUMPDEST = 91,
    UNRECOGNIZED_5C = 92,
    UNRECOGNIZED_5D = 93,
    UNRECOGNIZED_5E = 94,
    UNRECOGNIZED_5F = 95,
    PUSH1 = 96,
    PUSH2 = 97,
    PUSH3 = 98,
    PUSH4 = 99,
    PUSH5 = 100,
    PUSH6 = 101,
    PUSH7 = 102,
    PUSH8 = 103,
    PUSH9 = 104,
    PUSH10 = 105,
    PUSH11 = 106,
    PUSH12 = 107,
    PUSH13 = 108,
    PUSH14 = 109,
    PUSH15 = 110,
    PUSH16 = 111,
    PUSH17 = 112,
    PUSH18 = 113,
    PUSH19 = 114,
    PUSH20 = 115,
    PUSH21 = 116,
    PUSH22 = 117,
    PUSH23 = 118,
    PUSH24 = 119,
    PUSH25 = 120,
    PUSH26 = 121,
    PUSH27 = 122,
    PUSH28 = 123,
    PUSH29 = 124,
    PUSH30 = 125,
    PUSH31 = 126,
    PUSH32 = 127,
    DUP1 = 128,
    DUP2 = 129,
    DUP3 = 130,
    DUP4 = 131,
    DUP5 = 132,
    DUP6 = 133,
    DUP7 = 134,
    DUP8 = 135,
    DUP9 = 136,
    DUP10 = 137,
    DUP11 = 138,
    DUP12 = 139,
    DUP13 = 140,
    DUP14 = 141,
    DUP15 = 142,
    DUP16 = 143,
    SWAP1 = 144,
    SWAP2 = 145,
    SWAP3 = 146,
    SWAP4 = 147,
    SWAP5 = 148,
    SWAP6 = 149,
    SWAP7 = 150,
    SWAP8 = 151,
    SWAP9 = 152,
    SWAP10 = 153,
    SWAP11 = 154,
    SWAP12 = 155,
    SWAP13 = 156,
    SWAP14 = 157,
    SWAP15 = 158,
    SWAP16 = 159,
    LOG0 = 160,
    LOG1 = 161,
    LOG2 = 162,
    LOG3 = 163,
    LOG4 = 164,
    UNRECOGNIZED_A5 = 165,
    UNRECOGNIZED_A6 = 166,
    UNRECOGNIZED_A7 = 167,
    UNRECOGNIZED_A8 = 168,
    UNRECOGNIZED_A9 = 169,
    UNRECOGNIZED_AA = 170,
    UNRECOGNIZED_AB = 171,
    UNRECOGNIZED_AC = 172,
    UNRECOGNIZED_AD = 173,
    UNRECOGNIZED_AE = 174,
    UNRECOGNIZED_AF = 175,
    UNRECOGNIZED_B0 = 176,
    UNRECOGNIZED_B1 = 177,
    UNRECOGNIZED_B2 = 178,
    UNRECOGNIZED_B3 = 179,
    UNRECOGNIZED_B4 = 180,
    UNRECOGNIZED_B5 = 181,
    UNRECOGNIZED_B6 = 182,
    UNRECOGNIZED_B7 = 183,
    UNRECOGNIZED_B8 = 184,
    UNRECOGNIZED_B9 = 185,
    UNRECOGNIZED_BA = 186,
    UNRECOGNIZED_BB = 187,
    UNRECOGNIZED_BC = 188,
    UNRECOGNIZED_BD = 189,
    UNRECOGNIZED_BE = 190,
    UNRECOGNIZED_BF = 191,
    UNRECOGNIZED_C0 = 192,
    UNRECOGNIZED_C1 = 193,
    UNRECOGNIZED_C2 = 194,
    UNRECOGNIZED_C3 = 195,
    UNRECOGNIZED_C4 = 196,
    UNRECOGNIZED_C5 = 197,
    UNRECOGNIZED_C6 = 198,
    UNRECOGNIZED_C7 = 199,
    UNRECOGNIZED_C8 = 200,
    UNRECOGNIZED_C9 = 201,
    UNRECOGNIZED_CA = 202,
    UNRECOGNIZED_CB = 203,
    UNRECOGNIZED_CC = 204,
    UNRECOGNIZED_CD = 205,
    UNRECOGNIZED_CE = 206,
    UNRECOGNIZED_CF = 207,
    UNRECOGNIZED_D0 = 208,
    UNRECOGNIZED_D1 = 209,
    UNRECOGNIZED_D2 = 210,
    UNRECOGNIZED_D3 = 211,
    UNRECOGNIZED_D4 = 212,
    UNRECOGNIZED_D5 = 213,
    UNRECOGNIZED_D6 = 214,
    UNRECOGNIZED_D7 = 215,
    UNRECOGNIZED_D8 = 216,
    UNRECOGNIZED_D9 = 217,
    UNRECOGNIZED_DA = 218,
    UNRECOGNIZED_DB = 219,
    UNRECOGNIZED_DC = 220,
    UNRECOGNIZED_DD = 221,
    UNRECOGNIZED_DE = 222,
    UNRECOGNIZED_DF = 223,
    UNRECOGNIZED_E0 = 224,
    UNRECOGNIZED_E1 = 225,
    UNRECOGNIZED_E2 = 226,
    UNRECOGNIZED_E3 = 227,
    UNRECOGNIZED_E4 = 228,
    UNRECOGNIZED_E5 = 229,
    UNRECOGNIZED_E6 = 230,
    UNRECOGNIZED_E7 = 231,
    UNRECOGNIZED_E8 = 232,
    UNRECOGNIZED_E9 = 233,
    UNRECOGNIZED_EA = 234,
    UNRECOGNIZED_EB = 235,
    UNRECOGNIZED_EC = 236,
    UNRECOGNIZED_ED = 237,
    UNRECOGNIZED_EE = 238,
    UNRECOGNIZED_EF = 239,
    CREATE = 240,
    CALL = 241,
    CALLCODE = 242,
    RETURN = 243,
    DELEGATECALL = 244,
    CREATE2 = 245,
    UNRECOGNIZED_F6 = 246,
    UNRECOGNIZED_F7 = 247,
    UNRECOGNIZED_F8 = 248,
    UNRECOGNIZED_F9 = 249,
    STATICCALL = 250,
    UNRECOGNIZED_FB = 251,
    UNRECOGNIZED_FC = 252,
    REVERT = 253,
    INVALID = 254,
    SELFDESTRUCT = 255
}
export declare function isPush(opcode: Opcode): boolean;
export declare function isJump(opcode: Opcode): boolean;
export declare function getPushLength(opcode: Opcode): number;
export declare function getOpcodeLength(opcode: Opcode): number;
export declare function isCall(opcode: Opcode): boolean;
export declare function isCreate(opcode: Opcode): boolean;
//# sourceMappingURL=opcodes.d.ts.map