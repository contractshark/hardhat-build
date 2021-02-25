import { CompilerInput, CompilerOutput } from "../../../../src/types";
export interface CompilerOptions {
    solidityVersion: string;
    compilerPath: string;
    runs?: number;
}
export declare const COMPILER_DOWNLOAD_TIMEOUT = 10000;
export declare function downloadSolc(compilerPath: string): Promise<void>;
export declare function compile(sources: string[], compilerOptions: CompilerOptions): Promise<[CompilerInput, CompilerOutput]>;
//# sourceMappingURL=compilation.d.ts.map