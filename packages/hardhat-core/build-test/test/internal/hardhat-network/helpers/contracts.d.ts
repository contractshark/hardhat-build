export declare const EXAMPLE_READ_CONTRACT: {
    sourceCode: string;
    bytecode: {
        linkReferences: {};
        object: string;
        opcodes: string;
        sourceMap: string;
    };
    abi: {
        constant: boolean;
        inputs: never[];
        name: string;
        outputs: {
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
    }[];
    selectors: {
        blockNumber: string;
        blockTimestamp: string;
    };
    topics: {};
};
export declare const EXAMPLE_CONTRACT: {
    sourceCode: string;
    bytecode: {
        linkReferences: {};
        object: string;
        opcodes: string;
        sourceMap: string;
    };
    abi: ({
        constant: boolean;
        inputs: {
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        payable: boolean;
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    } | {
        constant: boolean;
        inputs: never[];
        name: string;
        outputs: {
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    } | {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        constant?: undefined;
        outputs?: undefined;
        payable?: undefined;
        stateMutability?: undefined;
    })[];
    selectors: {
        i: string;
        j: string;
        modifiesState: string;
    };
    topics: {
        StateModified: string[];
    };
};
export declare const EXAMPLE_BLOCKHASH_CONTRACT: {
    sourceCode: string;
    bytecode: {
        linkReferences: {};
        object: string;
        opcodes: string;
        sourceMap: string;
    };
    abi: {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    selectors: {
        test0: string;
        test1: string;
        test1m: string;
    };
    topics: {};
};
export declare const EXAMPLE_SETTER_CONTRACT: {
    sourceCode: string;
    bytecode: {
        linkReferences: {};
        object: string;
        opcodes: string;
        sourceMap: string;
    };
    abi: ({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    } | {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    })[];
    selectors: {
        value: string;
        setValue: string;
    };
    topics: {};
};
//# sourceMappingURL=contracts.d.ts.map