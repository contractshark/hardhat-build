/// <reference types="node" />
import VM from "@nomiclabs/ethereumjs-vm";
import { TxData } from "ethereumjs-tx";
import { MessageTrace } from "../../../../src/internal/hardhat-network/stack-traces/message-trace";
export declare function instantiateVm(): Promise<VM>;
export declare function encodeConstructorParams(contractAbi: any[], params: any[]): Buffer;
export declare function encodeCall(contractAbi: any[], functionName: string, params: any[]): Buffer;
export declare function traceTransaction(vm: VM, txData: TxData): Promise<MessageTrace>;
//# sourceMappingURL=execution.d.ts.map