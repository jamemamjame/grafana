import Utils from './utils';
import WfQuery from './wf_query';
declare class WfQueryBuilder {
    utils: Utils;
    options: any;
    MAX_DATA_POINTS: number;
    constructor(options: any);
    build(params: any): WfQuery;
    _convertToSeconds(value: any, type: any): any;
    roundTo(n: any, k: any, down?: any): any;
    _calcGranularityByDataPoints(start: any, end: any, dataPoints: any, limitedGranularity: any): any;
    _limitGranularity: (start: any, end: any, granularity: any, limitedGranularity: any) => any;
    _addTagFilter: (query: any, func: any) => void;
    _addExcludeTagFilter: (query: any, func: any) => void;
    translateTime(date: any, rounding: any, timeShift: any, granularity: any): any;
    _modifyRawQuery: () => string[];
}
export default WfQueryBuilder;
