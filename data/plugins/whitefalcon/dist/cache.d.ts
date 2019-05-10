import Utils from './utils';
declare class Cache {
    localStorageKey: string;
    _cache: any;
    cacheStats: any;
    useCache: any;
    utils: Utils;
    constructor();
    isInteger(value: any): boolean;
    set(key: any, startTime: any, endTime: any, data: any): void;
    /**
     * get data from CACHE using String as a key
     * @param key {"url":"http://hkg-wf-qa.agoda.local/v2/rest/discovery/metrics","method":"POST","data":{"query":"FE-PAGELOADTIME","from":"2019-04-29T23:00:00.000Z","to":"2019-04-30T05:59:59.999Z"},"timeout":30000,"headers":{"Content-Type":"application/json"}}
     */
    get(key: any): {
        startTime: any;
        endTime: any;
        data: any;
    };
    hit(n: any): void;
    miss(n: any): void;
    countset(ds: any): any;
    loadCache(): void;
    bufferToString(buf: any): any;
    stringToBuffer(s: any): ArrayBuffer;
    encodeString(s: any): any;
    decodeString(a: any): any;
    compress(o: any): any;
    decompress(s: any): any;
    if(): void;
}
export default Cache;
