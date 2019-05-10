declare class Parser {
    expression: any;
    index: any;
    lexer: any;
    tokens: any;
    getAst(): any;
    start(): any;
    curlyBraceSegment(): {
        type: string;
        value: string;
    };
    metricSegment(): {
        type: string;
        value: any;
    };
    metricExpression(): {
        type: string;
        segments: any[];
    };
    functionCall(): any;
    functionParameters(): any;
    seriesRefExpression(): {
        type: string;
        value: any;
    };
    numericLiteral(): {
        type: string;
        value: number;
    };
    stringLiteral(): {
        type: string;
        value: any;
    };
    errorMark(text: any): void;
    consumeToken(): any;
    matchToken(type: any, index: any): boolean;
    match(token1: any, token2?: any): boolean;
    constructor(expression: any, lexer: any);
}
export default Parser;
