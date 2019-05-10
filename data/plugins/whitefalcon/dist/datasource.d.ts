/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import WfFunc from './wf_func';
import Cache from './cache';
export default class WhiteFalconDatasource {
    private instanceSettings;
    private templateSrv;
    private $q;
    private $http;
    /** @ngInject */
    deferredMap: {};
    id: number;
    name: string;
    isV2: any;
    functions: any[];
    scopedVars: any;
    metric: any;
    cache: Cache;
    wfFunc: WfFunc;
    urls: any;
    queryStats: {
        totalQueries: number;
        outboundQueries: number;
        fullyCached: number;
        toString: () => string;
    };
    constructor(instanceSettings: any, templateSrv: any, $q: any, $http: any);
    /**
     * Query all metric name for show in dropdown list of panel-edit mode
     * @param query
     * @param from
     * @param to
     */
    queryMetric(query: any, from: any, to: any): any;
    retry(deferred: any, callback: any, delay: any, retries?: any): any;
    fixGranularity(dataset: any): any;
    _wfRequest(allQueries: any): any;
    handleWfQueryResponseV2(seriesParams: any, scopedVars: any, datasets: any, _this?: any): any;
    handleWfQueryResponse(seriesParams: any, scopedVars: any, datasets: any): {
        data: any;
    };
    parseRecursive(astNode: any, func?: any, index?: any): any;
    addFunctionParameter(func: any, value: any, index: any): void;
    ngOnInit(): void;
    mergeWithCache(dataset: any): any;
    _postQueries(queries: any): any;
    fillGaps(dataset: any, query: any): any;
    _expand(queryBuilder: any, params: any): any;
    httpWithCache(options: any): any;
    stripTz(s: any): any;
    updateDataset(newds: any, cachedds: any): any;
    _parseTarget(scopedVars: any, target: any): {
        functions: any[];
        metric: any;
        target: any;
        hidden: any;
        seriesId: any;
    };
    query(options: any): any;
    queryTagValues(query: any, metric: any, tag: any, from: any, to: any): any;
    metricFindQuery(query: any, options: any, excludeSelf: any): any;
    testDatasource(): any;
}
