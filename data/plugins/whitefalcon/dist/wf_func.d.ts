import FuncInstance from './func_instance';
declare class WfFunc {
    constructor();
    index: any[];
    categories: {
        Data: any[];
        Combine: any[];
        Transform: any[];
        TimeGrouping: any[];
        Calculate: any[];
        Filter: any[];
        Special: any[];
    };
    SERIES_IDS: string[];
    manySeries: ({
        name: string;
        type: string;
        options: string[];
    } | {
        name: string;
        type: string;
        options: string[];
        optional: boolean;
    })[];
    addFuncDef(funcDef: any): void;
    createFuncInstance(funcDef: any, options: any): FuncInstance;
    getFuncDef(name: any): any;
    getCategories(): {
        Data: any[];
        Combine: any[];
        Transform: any[];
        TimeGrouping: any[];
        Calculate: any[];
        Filter: any[];
        Special: any[];
    };
}
export default WfFunc;
