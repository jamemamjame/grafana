import Utils from './utils';
declare class WfQuery {
    _json: any;
    _originalStartTime: any;
    utils: Utils;
    getStartTime(): any;
    getQueryStartTime(): any;
    getEndTime(): any;
    getGranularity(): any;
    getTagValues(tag: any): any;
    getGroups(): any;
    getPercentiles(): any;
    getNoCache(): any;
    getFillZeros(): any;
    getCacheKey(url: any): string;
    getJson(): any;
    addToQueryStartTimeSec(deltaSec: any): void;
    constructor(json: any);
}
export default WfQuery;
