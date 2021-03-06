"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidationErrors = exports.validateConfig = exports.hexString = exports.DotPathReporter = exports.success = exports.failure = void 0;
const t = __importStar(require("io-ts"));
const lib_1 = require("io-ts/lib");
const constants_1 = require("../../constants");
const lang_1 = require("../../util/lang");
const errors_1 = require("../errors");
const errors_list_1 = require("../errors-list");
function stringify(v) {
    if (typeof v === "function") {
        return lib_1.getFunctionName(v);
    }
    if (typeof v === "number" && !isFinite(v)) {
        if (isNaN(v)) {
            return "NaN";
        }
        return v > 0 ? "Infinity" : "-Infinity";
    }
    return JSON.stringify(v);
}
function getContextPath(context) {
    const keysPath = context
        .slice(1)
        .map((c) => c.key)
        .join(".");
    return `${context[0].type.name}.${keysPath}`;
}
function getMessage(e) {
    const lastContext = e.context[e.context.length - 1];
    return e.message !== undefined
        ? e.message
        : getErrorMessage(getContextPath(e.context), e.value, lastContext.type.name);
}
function getErrorMessage(path, value, expectedType) {
    return `Invalid value ${stringify(value)} for ${path} - Expected a value of type ${expectedType}.`;
}
function failure(es) {
    return es.map(getMessage);
}
exports.failure = failure;
function success() {
    return [];
}
exports.success = success;
exports.DotPathReporter = {
    report: (validation) => validation.fold(failure, success),
};
function optional(codec, name = `${codec.name} | undefined`) {
    return new t.Type(name, (u) => u === undefined || codec.is(u), (u, c) => (u === undefined ? t.success(u) : codec.validate(u, c)), (a) => (a === undefined ? undefined : codec.encode(a)));
}
const HEX_STRING_REGEX = /^(0x)?([0-9a-f]{2})+$/gi;
const HEX_PREFIX = "0x";
function isHexString(v) {
    if (typeof v !== "string") {
        return false;
    }
    return v.trim().match(HEX_STRING_REGEX) !== null;
}
exports.hexString = new t.Type("hex string", isHexString, (u, c) => (isHexString(u) ? t.success(u) : t.failure(u, c)), t.identity);
// TODO: These types have outdated name. They should match the UserConfig types.
// IMPORTANT: This t.types MUST be kept in sync with the actual types.
const HardhatNetworkAccount = t.type({
    privateKey: exports.hexString,
    balance: t.string,
});
const commonHDAccountsFields = {
    initialIndex: optional(t.number),
    count: optional(t.number),
    path: optional(t.string),
};
const HardhatNetworkHDAccountsConfig = t.type(Object.assign({ mnemonic: optional(t.string), accountsBalance: optional(t.string) }, commonHDAccountsFields));
const HardhatNetworkForkingConfig = t.type({
    enabled: optional(t.boolean),
    url: t.string,
    blockNumber: optional(t.number),
});
const commonNetworkConfigFields = {
    chainId: optional(t.number),
    from: optional(t.string),
    gas: optional(t.union([t.literal("auto"), t.number])),
    gasPrice: optional(t.union([t.literal("auto"), t.number])),
    gasMultiplier: optional(t.number),
};
const HardhatNetworkConfig = t.type(Object.assign(Object.assign({}, commonNetworkConfigFields), { hardfork: optional(t.keyof(lang_1.fromEntries(constants_1.HARDHAT_NETWORK_SUPPORTED_HARDFORKS.map((hf) => [hf, null])))), accounts: optional(t.union([t.array(HardhatNetworkAccount), HardhatNetworkHDAccountsConfig])), blockGasLimit: optional(t.number), throwOnTransactionFailures: optional(t.boolean), throwOnCallFailures: optional(t.boolean), allowUnlimitedContractSize: optional(t.boolean), initialDate: optional(t.string), loggingEnabled: optional(t.boolean), forking: optional(HardhatNetworkForkingConfig) }));
const HDAccountsConfig = t.type(Object.assign({ mnemonic: t.string }, commonHDAccountsFields));
const NetworkConfigAccounts = t.union([
    t.literal("remote"),
    t.array(exports.hexString),
    HDAccountsConfig,
]);
const HttpHeaders = t.record(t.string, t.string, "httpHeaders");
const HttpNetworkConfig = t.type(Object.assign(Object.assign({}, commonNetworkConfigFields), { url: optional(t.string), accounts: optional(NetworkConfigAccounts), httpHeaders: optional(HttpHeaders), timeout: optional(t.number) }));
const NetworkConfig = t.union([HardhatNetworkConfig, HttpNetworkConfig]);
const Networks = t.record(t.string, NetworkConfig);
const ProjectPaths = t.type({
    root: optional(t.string),
    cache: optional(t.string),
    artifacts: optional(t.string),
    sources: optional(t.string),
    tests: optional(t.string),
});
const SingleSolcConfig = t.type({
    version: t.string,
    settings: optional(t.any),
});
const MultiSolcConfig = t.type({
    compilers: t.array(SingleSolcConfig),
    overrides: optional(t.record(t.string, SingleSolcConfig)),
});
const SolidityConfig = t.union([t.string, SingleSolcConfig, MultiSolcConfig]);
const HardhatConfig = t.type({
    defaultNetwork: optional(t.string),
    networks: optional(Networks),
    paths: optional(ProjectPaths),
    solidity: optional(SolidityConfig),
}, "HardhatConfig");
/**
 * Validates the config, throwing a HardhatError if invalid.
 * @param config
 */
function validateConfig(config) {
    const errors = getValidationErrors(config);
    if (errors.length === 0) {
        return;
    }
    let errorList = errors.join("\n  * ");
    errorList = `  * ${errorList}`;
    throw new errors_1.HardhatError(errors_list_1.ERRORS.GENERAL.INVALID_CONFIG, { errors: errorList });
}
exports.validateConfig = validateConfig;
function getValidationErrors(config) {
    const errors = [];
    // These can't be validated with io-ts
    if (config !== undefined && typeof config.networks === "object") {
        const hardhatNetwork = config.networks[constants_1.HARDHAT_NETWORK_NAME];
        if (hardhatNetwork !== undefined && typeof hardhatNetwork === "object") {
            if ("url" in hardhatNetwork) {
                errors.push(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME} can't have an url`);
            }
            // Validating the accounts with io-ts leads to very confusing errors messages
            const configExceptAccounts = Object.assign({}, hardhatNetwork);
            delete configExceptAccounts.accounts;
            const netConfigResult = HardhatNetworkConfig.decode(configExceptAccounts);
            if (netConfigResult.isLeft()) {
                errors.push(getErrorMessage(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME}`, hardhatNetwork, "HardhatNetworkConfig"));
            }
            if (Array.isArray(hardhatNetwork.accounts)) {
                for (const account of hardhatNetwork.accounts) {
                    if (typeof account.privateKey !== "string") {
                        errors.push(getErrorMessage(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME}.accounts[].privateKey`, account.privateKey, "string"));
                    }
                    if (typeof account.balance !== "string") {
                        errors.push(getErrorMessage(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME}.accounts[].balance`, account.balance, "string"));
                    }
                }
            }
            else if (typeof hardhatNetwork.accounts === "object") {
                const hdConfigResult = HardhatNetworkHDAccountsConfig.decode(hardhatNetwork.accounts);
                if (hdConfigResult.isLeft()) {
                    errors.push(getErrorMessage(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME}.accounts`, hardhatNetwork.accounts, "[{privateKey: string, balance: string}] | HardhatNetworkHDAccountsConfig | undefined"));
                }
            }
            else if (hardhatNetwork.accounts !== undefined) {
                errors.push(getErrorMessage(`HardhatConfig.networks.${constants_1.HARDHAT_NETWORK_NAME}.accounts`, hardhatNetwork.accounts, "[{privateKey: string, balance: string}] | HardhatNetworkHDAccountsConfig | undefined"));
            }
        }
        for (const [networkName, netConfig] of Object.entries(config.networks)) {
            if (networkName === constants_1.HARDHAT_NETWORK_NAME) {
                continue;
            }
            if (networkName !== "localhost" || netConfig.url !== undefined) {
                if (typeof netConfig.url !== "string") {
                    errors.push(getErrorMessage(`HardhatConfig.networks.${networkName}.url`, netConfig.url, "string"));
                }
            }
            const netConfigResult = HttpNetworkConfig.decode(netConfig);
            if (netConfigResult.isLeft()) {
                errors.push(getErrorMessage(`HardhatConfig.networks.${networkName}`, netConfig, "HttpNetworkConfig"));
            }
        }
    }
    // io-ts can get confused if there are errors that it can't understand.
    // Especially around Hardhat Network's config. It will treat it as an HTTPConfig,
    // and may give a loot of errors.
    if (errors.length > 0) {
        return errors;
    }
    const result = HardhatConfig.decode(config);
    if (result.isRight()) {
        return errors;
    }
    const ioTsErrors = exports.DotPathReporter.report(result);
    return [...errors, ...ioTsErrors];
}
exports.getValidationErrors = getValidationErrors;
//# sourceMappingURL=config-validation.js.map