declare class WfSeries {
    percentile: any;
    granularity: any;
    params: any;
    templateSrv: any;
    scopedVars: any;
    groupObj: any;
    dataPoints: any;
    seriesList: any;
    alias: any;
    aggregates: {
        median: (arr: any) => any;
        sum: (arr: any) => any;
        avg: (arr: any) => number;
        mult: (arr: any) => any;
    };
    constructor(dp: any, params: any, templateSrv: any, scopedVars: any, granularity: any, groupObj?: any, percentile?: any);
    getPostCalc(name: any, params: any): any;
    show(): boolean;
    getAlias(): any;
    getTimeSeries(allSeries: any): {
        target: any;
        datapoints: any;
    };
    getSyncedDataPoints(): any;
    getYValues(allSeries: any): any;
    getFactor(per: any): any;
    differentiate: (yValues: any, per: any) => any;
    runningAvg: (yValues: any, duration: any, units: any) => any;
    cumSum(yValues: any): any;
    rate(yValues: any, per: any): any;
    truncate(yValues: any, minValue: any, maxValue: any, to: any): any;
    getTimeShiftParams: () => {
        timeShift: number;
        sync: boolean;
        lag: any;
    };
    getXValues(): any;
    _convertToSeconds: (value: any, type: any) => any;
    getRelativeCombiner: (func: any) => {
        f: (local: any, other: any) => any;
        aggregate: boolean;
    };
    cdf(x: any, g: any): number;
    erf(x: any): number;
    normalCdf(x: any, mean: any, variance: any): number;
    poissonCdf(x: any, g: any): number;
    applyRelativeFunction(func: any, yValues: any, allSeries: any): any;
    createRelatedYValues(id: any, allSeries: any, aggregate: any): any;
    getAnnotations(): any[];
    createNameForSeries(seriesName: any, groupByColValue: any): any;
}
export default WfSeries;
