declare class Lexer {
    input: any;
    char: any;
    from: any;
    identifierStartTable: any[];
    identifierPartTable: any[];
    unicodeLetterTable: number[];
    constructor(expression: any);
    peek(i?: any): any;
    skip(i?: any): void;
    tokenize(): any[];
    next(): any;
    scanTemplateSequence(): {
        type: string;
        value: string;
        pos: any;
    };
    getIdentifierStart(): any;
    getIdentifierPart(): any;
    isUnicodeLetter(code: any): boolean;
    isHexDigit(str: any): boolean;
    readUnicodeEscapeSequence(): string;
    scanIdentifier(): any;
    index: number;
    scanNumericLiteral(): any;
    isPunctuator(ch1: any): boolean;
    scanPunctuator(): {
        type: any;
        value: any;
        pos: any;
    };
    scanStringLiteral(): {
        type: string;
        value: string;
        isUnclosed: boolean;
        quote: any;
        pos: any;
    };
}
export default Lexer;
