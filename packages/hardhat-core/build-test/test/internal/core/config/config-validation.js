"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const constants_1 = require("../../../../src/internal/constants");
const config_validation_1 = require("../../../../src/internal/core/config/config-validation");
const errors_list_1 = require("../../../../src/internal/core/errors-list");
const errors_1 = require("../../../helpers/errors");
describe("Config validation", function () {
    describe("default network config", function () {
        it("Should fail if the wrong type is used", function () {
            errors_1.expectHardhatError(() => config_validation_1.validateConfig({ defaultNetwork: 123 }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
        });
    });
    describe("Solidity config", function () {
        const invalidSolidityType = {
            solidity: 123,
        };
        const invalidVersionType = {
            solidity: {
                version: 123,
            },
        };
        const invalidOptimizerType = {
            solidity: {
                optimizer: 123,
            },
        };
        const invalidOptimizerEnabledType = {
            solidity: {
                optimizer: {
                    enabled: 123,
                },
            },
        };
        const invalidOptimizerRunsType = {
            solidity: {
                optimizer: {
                    runs: "",
                },
            },
        };
        const invalidEvmVersionType = {
            solidity: {
                evmVersion: 123,
            },
        };
        it("Should fail with invalid types", function () {
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidSolidityType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidVersionType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidOptimizerType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidOptimizerEnabledType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidOptimizerRunsType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidEvmVersionType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
        });
        it("Shouldn't fail with an empty solc config", function () {
            const errors = config_validation_1.getValidationErrors({
                solc: {},
            });
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail without a solc config", function () {
            const errors = config_validation_1.getValidationErrors({});
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail with valid configs", function () {
            const errors = config_validation_1.getValidationErrors({
                solc: {
                    version: "123",
                    optimizer: {
                        enabled: true,
                        runs: 123,
                    },
                    evmVersion: "asd",
                },
            });
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail with unrecognized params", function () {
            const errors = config_validation_1.getValidationErrors({
                solc: {
                    unrecognized: 123,
                },
            });
            chai_1.assert.isEmpty(errors);
        });
    });
    describe("paths config", function () {
        const invalidPathsType = {
            paths: 123,
        };
        const invalidCacheType = {
            paths: {
                cache: 123,
            },
        };
        const invalidArtifactsType = {
            paths: {
                artifacts: 123,
            },
        };
        const invalidSourcesType = {
            paths: {
                sources: 123,
            },
        };
        const invalidTestsType = {
            paths: {
                tests: 123,
            },
        };
        const invalidRootType = {
            paths: {
                root: 123,
            },
        };
        it("Should fail with invalid types", function () {
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidPathsType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidCacheType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidArtifactsType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidRootType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidSourcesType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
            errors_1.expectHardhatError(() => config_validation_1.validateConfig(invalidTestsType), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
        });
        it("Shouldn't fail with an empty paths config", function () {
            const errors = config_validation_1.getValidationErrors({
                paths: {},
            });
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail without a paths config", function () {
            const errors = config_validation_1.getValidationErrors({});
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail with valid paths configs", function () {
            const errors = config_validation_1.getValidationErrors({
                paths: {
                    root: "root",
                    cache: "cache",
                    artifacts: "artifacts",
                    sources: "sources",
                    tests: "tests",
                },
            });
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail with unrecognized params", function () {
            const errors = config_validation_1.getValidationErrors({
                paths: {
                    unrecognized: 123,
                },
            });
            chai_1.assert.isEmpty(errors);
        });
    });
    describe("networks config", function () {
        describe("Invalid types", function () {
            describe("Networks object", function () {
                it("Should fail with invalid types", function () {
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({ networks: 123 }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            asd: 123,
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                });
            });
            describe("Hardhat Network config", function () {
                it("Should fail with invalid types", function () {
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: 123,
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                chainId: "asd",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                hardfork: "not-supported",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                throwOnCallFailures: "a",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                throwOnTransactionFailures: "a",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                from: 123,
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                gas: "asdasd",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                gasPrice: "6789",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                gasMultiplier: "123",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                blockGasLimit: "asd",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: 123,
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: [{}],
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: [{ privateKey: "" }],
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: [{ balance: "" }],
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: [{ privateKey: 123 }],
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                accounts: [{ balance: 213 }],
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                loggingEnabled: 123,
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                loggingEnabled: "a",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    // Non boolean allowUnlimitedContractSize
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                allowUnlimitedContractSize: "a",
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    // Non string initialDate
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                initialDate: 123,
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    // Invalid forking settings
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                forking: 123,
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                forking: {},
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                forking: { url: 123 },
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                forking: { url: "asd", blockNumber: "asd" },
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                        networks: {
                            [constants_1.HARDHAT_NETWORK_NAME]: {
                                forking: { url: "asd", blockNumber: 123, enabled: 123 },
                            },
                        },
                    }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                });
                describe("HardhatNetworkHDAccounstConfig", function () {
                    it("Should accept a valid HD config", function () {
                        let hdConfig = {
                            mnemonic: "asd",
                        };
                        config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: hdConfig,
                                },
                            },
                        });
                        hdConfig = {
                            mnemonic: "asd",
                            accountsBalance: "123",
                            count: 123,
                            initialIndex: 1,
                            path: "m/1/2",
                        };
                        config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: hdConfig,
                                },
                            },
                        });
                        config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {},
                                },
                            },
                        });
                    });
                    it("Should fail with invalid types", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {
                                        mnemonic: 123,
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {
                                        initialIndex: "asd",
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {
                                        count: "asd",
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {
                                        path: 123,
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                [constants_1.HARDHAT_NETWORK_NAME]: {
                                    accounts: {
                                        mnemonic: "asd",
                                        accountsBalance: {},
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                });
            });
            describe("HTTP network config", function () {
                describe("Url field", function () {
                    it("Should fail if no url is set for custom networks", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({ networks: { custom: {} } }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                    it("Shouldn't fail if no url is set for localhost network", function () {
                        const errors = config_validation_1.getValidationErrors({ networks: { localhost: {} } });
                        chai_1.assert.isEmpty(errors);
                    });
                    it("Should fail if url is set for hardhat network (undefined)", function () {
                        const errors = config_validation_1.getValidationErrors({
                            networks: { [constants_1.HARDHAT_NETWORK_NAME]: { url: undefined } },
                        });
                        chai_1.assert.isNotEmpty(errors);
                    });
                    it("Should fail if url is set for hardhat network", function () {
                        const errors = config_validation_1.getValidationErrors({
                            networks: { [constants_1.HARDHAT_NETWORK_NAME]: { url: "anyurl" } },
                        });
                        chai_1.assert.isNotEmpty(errors);
                    });
                    it("Shouldn't fail if no url is set for hardhat network", function () {
                        const errors = config_validation_1.getValidationErrors({
                            networks: { [constants_1.HARDHAT_NETWORK_NAME]: {} },
                        });
                        chai_1.assert.isEmpty(errors);
                    });
                });
                describe("HttpHeaders", function () {
                    it("Should be optional", function () {
                        const errors = config_validation_1.getValidationErrors({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                },
                            },
                        });
                        chai_1.assert.isEmpty(errors);
                    });
                    it("Should accept a mapping of strings to strings", function () {
                        const errors = config_validation_1.getValidationErrors({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                    httpHeaders: {
                                        a: "asd",
                                        b: "a",
                                    },
                                },
                            },
                        });
                        chai_1.assert.isEmpty(errors);
                    });
                    it("Should reject other types", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                    httpHeaders: 123,
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                    httpHeaders: "123",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                    it("Should reject non-string values", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                    httpHeaders: {
                                        a: "a",
                                        b: 123,
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                custom: {
                                    url: "http://localhost",
                                    httpHeaders: {
                                        a: "a",
                                        b: false,
                                    },
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                });
                describe("Accounts field", function () {
                    it("Shouldn't work with invalid types", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    accounts: 123,
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    accounts: {},
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    accounts: { asd: 123 },
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                    describe("HDAccounstConfig", function () {
                        it("Should fail with invalid types", function () {
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: {
                                            mnemonic: 123,
                                        },
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: {
                                            initialIndex: "asd",
                                        },
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: {
                                            count: "asd",
                                        },
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: {
                                            path: 123,
                                        },
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        });
                    });
                    describe("OtherAccountsConfig", function () {
                        it("Should fail with invalid types", function () {
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: {
                                            type: 123,
                                        },
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        });
                    });
                    describe("List of private keys", function () {
                        it("Shouldn't work with invalid types", function () {
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: [123],
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        });
                    });
                    describe("Remote accounts", function () {
                        it("Should work with accounts: remote", function () {
                            chai_1.assert.isEmpty(config_validation_1.getValidationErrors({
                                networks: {
                                    asd: {
                                        accounts: "remote",
                                        url: "",
                                    },
                                },
                            }));
                        });
                        it("Shouldn't work with other strings", function () {
                            errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                                networks: {
                                    asd: {
                                        accounts: "asd",
                                        url: "",
                                    },
                                },
                            }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        });
                    });
                });
                describe("Other fields", function () {
                    it("Shouldn't accept invalid types", function () {
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    url: "",
                                    timeout: "asd",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    chainId: "",
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    from: 123,
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    gas: "asdsad",
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    gasPrice: "asdsad",
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    gasMultiplier: "asdsad",
                                    url: "",
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                        errors_1.expectHardhatError(() => config_validation_1.validateConfig({
                            networks: {
                                asd: {
                                    url: false,
                                },
                            },
                        }), errors_list_1.ERRORS.GENERAL.INVALID_CONFIG);
                    });
                });
            });
        });
        it("Shouldn't fail with an empty networks config", function () {
            const errors = config_validation_1.getValidationErrors({
                networks: {},
            });
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail without a networks config", function () {
            const errors = config_validation_1.getValidationErrors({});
            chai_1.assert.isEmpty(errors);
        });
        it("Shouldn't fail with valid networks configs", function () {
            const errors = config_validation_1.getValidationErrors({
                networks: {
                    commonThings: {
                        chainId: 1,
                        from: "0x0001",
                        gas: "auto",
                        gasPrice: "auto",
                        gasMultiplier: 123,
                        url: "",
                    },
                    [constants_1.HARDHAT_NETWORK_NAME]: {
                        gas: 678,
                        gasPrice: 123,
                        blockGasLimit: 8000,
                        accounts: [{ privateKey: "0xaaaa", balance: "123" }],
                        forking: {
                            url: "asd",
                            blockNumber: 123,
                        },
                    },
                    localhost: {
                        gas: 678,
                        gasPrice: 123,
                        url: "",
                    },
                    withRemoteAccounts: {
                        accounts: "remote",
                        url: "",
                    },
                    withPrivateKeys: {
                        accounts: ["0x00", "0x11"],
                        url: "",
                    },
                    withHdKeys: {
                        accounts: {
                            mnemonic: "asd asd asd",
                            initialIndex: 0,
                            count: 123,
                            path: "m/123",
                        },
                        url: "",
                    },
                },
            });
            chai_1.assert.deepEqual(errors, []);
            chai_1.assert.deepEqual(config_validation_1.getValidationErrors({
                networks: {
                    custom: {
                        url: "http://localhost:8545",
                    },
                    localhost: {
                        accounts: [
                            "0xa95f9e3e7ae4e4865c5968828fe7c03fffa8a9f3bb52d36d26243f4c868ee166",
                        ],
                    },
                },
                unknown: {
                    asd: 123,
                    url: "",
                },
            }), []);
        });
        it("Shouldn't fail with unrecognized params", function () {
            const errors = config_validation_1.getValidationErrors({
                networks: {
                    localhost: {
                        asd: 1232,
                    },
                    [constants_1.HARDHAT_NETWORK_NAME]: {
                        asdasd: "123",
                    },
                },
            });
            chai_1.assert.isEmpty(errors);
        });
    });
});
//# sourceMappingURL=config-validation.js.map