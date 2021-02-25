import { ErrorDescriptor } from "../../src/internal/core/errors-list";
export declare function expectErrorAsync(f: () => Promise<any>, errorMessage?: string | RegExp): Promise<void>;
export declare function expectHardhatError(f: () => any, errorDescriptor: ErrorDescriptor, errorMessage?: string | RegExp): void;
export declare function expectHardhatErrorAsync(f: () => Promise<any>, errorDescriptor: ErrorDescriptor, errorMessage?: string | RegExp): Promise<void>;
//# sourceMappingURL=errors.d.ts.map