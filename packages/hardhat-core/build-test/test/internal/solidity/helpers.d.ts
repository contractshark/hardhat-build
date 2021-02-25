import { ResolvedFile } from "../../../src/internal/solidity/resolver";
import * as taskTypes from "../../../src/types/builtin-tasks";
export declare class MockFile {
    name: string;
    versionPragmas: string[];
    libraryName?: string | undefined;
    readonly sourceName: string;
    readonly absolutePath: string;
    constructor(name: string, versionPragmas: string[], libraryName?: string | undefined);
}
export declare function createMockData(files: Array<{
    file: MockFile;
    dependencies?: MockFile[];
}>): Promise<[taskTypes.DependencyGraph, ResolvedFile[]]>;
//# sourceMappingURL=helpers.d.ts.map