/// <reference types="bn.js" />
/**
 * Transforms a QUANTITY to a number. It should only be used if you are 100% sure that the value
 * fits in a number.
 */
import { BN } from "ethereumjs-util";
export declare function quantityToNumber(quantity: string): number;
export declare function quantityToBN(quantity: string): BN;
export declare const dataToNumber: typeof quantityToNumber;
export declare function dataToBN(data: string): BN;
//# sourceMappingURL=conversions.d.ts.map