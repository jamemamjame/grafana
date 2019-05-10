declare class FuncInstance {
    private funcDef;
    private options;
    private self;
    def: any;
    params: any;
    text: any;
    added: any;
    constructor(funcDef: any, options: any, self?: any);
    _hasMultipleParamsInString(strValue: any, index: any): any;
    updateParamWithoutSelf(strValue: any, index: any): void;
    updateParam(strValue: any, index: any, self?: any): void;
    updateText(self: any): void;
    render(metricExp: any): string;
}
export default FuncInstance;
