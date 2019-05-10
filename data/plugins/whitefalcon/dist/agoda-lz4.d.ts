export declare function calcUncompressedLen(src: Uint8Array): number;
export declare function uncompressBlock(src: Uint8Array, dest: Uint8Array): number;
export declare function compressBlockBound(n: number): number;
export declare function compressBlock(src: Uint8Array, dest: Uint8Array, soffset: number): number;
export declare function compressBlockHC(src: Uint8Array, dest: Uint8Array, soffset: number): number;
