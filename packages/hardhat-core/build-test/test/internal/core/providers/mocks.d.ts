/// <reference types="node" />
import { EventEmitter } from "events";
import { EIP1193Provider, RequestArguments } from "../../../../src/types";
export declare class MockedProvider extends EventEmitter implements EIP1193Provider {
    private _returnValues;
    private _latestParams;
    private _numberOfCalls;
    setReturnValue(method: string, value: any): void;
    getNumberOfCalls(method: string): number;
    getLatestParams(method: string): any;
    getTotalNumberOfCalls(): number;
    request({ method, params, }: RequestArguments): Promise<any>;
}
//# sourceMappingURL=mocks.d.ts.map