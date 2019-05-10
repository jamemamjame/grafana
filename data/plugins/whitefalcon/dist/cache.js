System.register(['lodash', 'jquery', './utils', "./agoda-lz4"], function(exports_1) {
    var lodash_1, jquery_1, utils_1, agoda_lz4_1;
    var Cache;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (agoda_lz4_1_1) {
                agoda_lz4_1 = agoda_lz4_1_1;
            }],
        execute: function() {
            // import LRUCache from 'lru-cache'
            // import LRUCache from './agoda-lru';
            Cache = (function () {
                function Cache() {
                    'use strict';
                    this.localStorageKey = "whitefalcon_cache_dump";
                    this.cacheStats = {};
                    this.useCache = {
                        miss: 0,
                        hit: 0,
                        toString: function () {
                            return "CacheStats - Ratio: " +
                                ((this.hit + this.miss) > 0 ? (100 * this.hit / (this.miss + this.hit)).toFixed(2) + "%" : "N/A") +
                                " Miss: " + this.miss + " Hit: " + this.hit + " Cache size: " + this._cache.length;
                        }
                    };
                    this.utils = new utils_1.default();
                    // TODO: Prefilter unusable data for more efficient memory
                    // TODO: Only serialize part of the cache if it takes too much room on local storage
                    this.useCache = !this.utils.getUrlParams()["nocache"];
                    if (this.useCache) {
                        this.loadCache();
                    }
                    function countset(ds) {
                        if (!ds)
                            return 0;
                        if (ds.dataPoints)
                            return ds.dataPoints.length;
                        else
                            return lodash_1.default.reduce(lodash_1.default.map(ds.datasets, function (s) { return s.datapoints.length; }), function (total, n) { return total + n; }) || 0;
                    }
                    // this._cache = new LRUCache({
                    //     max: 250 * 1000, // a datapoint takes from 70 to a 400 bytes, depends on how much they are packed so this is around 50MB
                    //     length: function (item: any) { return countset(item.data); },
                    //     dispose: function (key) { },
                    //     maxAge: 1000 * 60 * 60 // Don't want more than one hour in any case
                    // });
                }
                Cache.prototype.isInteger = function (value) {
                    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
                };
                Cache.prototype.set = function (key, startTime, endTime, data) {
                    if (!this.useCache || startTime >= endTime) {
                        return;
                    }
                    console.log("Adding to cache key: " + key);
                    this._cache.set(key, { startTime: startTime, endTime: endTime, data: data });
                };
                /**
                 * get data from CACHE using String as a key
                 * @param key {"url":"http://hkg-wf-qa.agoda.local/v2/rest/discovery/metrics","method":"POST","data":{"query":"FE-PAGELOADTIME","from":"2019-04-29T23:00:00.000Z","to":"2019-04-30T05:59:59.999Z"},"timeout":30000,"headers":{"Content-Type":"application/json"}}
                 */
                Cache.prototype.get = function (key) {
                    console.log("[Test] cache.get()");
                    if (!this.useCache) {
                        return;
                    }
                    var entry = this._cache.get(key);
                    if (!entry) {
                        return null;
                    }
                    console.log("Fetching from cache key: " + key);
                    return {
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        data: entry.data
                    };
                };
                Cache.prototype.hit = function (n) {
                    this.cacheStats.hit += this.isInteger(n) ? n : this.countset(n);
                };
                Cache.prototype.miss = function (n) {
                    this.cacheStats.miss += this.isInteger(n) ? n : this.countset(n);
                };
                Cache.prototype.countset = function (ds) {
                    if (!ds) {
                        return 0;
                    }
                    if (ds.dataPoints) {
                        return ds.dataPoints.length;
                    }
                    else {
                        return lodash_1.default.reduce(lodash_1.default.map(ds.datasets, function (s) { return s.datapoints.length; }), function (total, n) { return total + n; }) || 0;
                    }
                };
                // Initialize from local storage
                Cache.prototype.loadCache = function () {
                    var localStorageCache = window.localStorage.getItem(this.localStorageKey);
                    if (localStorageCache) {
                        var decompressed = this.decompress(localStorageCache);
                        if (decompressed) {
                            this._cache.load(decompressed);
                        }
                    }
                };
                Cache.prototype.bufferToString = function (buf) {
                    var odd = (buf.byteLength % 2 === 1);
                    var a = new Uint16Array(buf, 0, Math.floor(buf.byteLength / 2));
                    // If we have odd number, we cannot use this with Uint16, so we need to fix
                    var res;
                    // Keep the odd flag as the first character
                    if (odd) {
                        res = '1';
                    }
                    else {
                        res = '0';
                    }
                    for (var i = 0, len = a.length; i < len; i++) {
                        res += String.fromCharCode(a[i]);
                    }
                    // Append the last byte as char to the end if odd
                    if (odd) {
                        res += String.fromCharCode((new Uint8Array(buf))[buf.byteLength - 1]);
                    }
                    return res;
                };
                Cache.prototype.stringToBuffer = function (s) {
                    var odd = (s[0] === '1');
                    var bufLen = (s.length - 1) * 2 - (odd ? 1 : 0);
                    var buf = new ArrayBuffer(bufLen);
                    var bufView = new Uint16Array(buf, 0, Math.floor(bufLen / 2));
                    for (var i = 0, l = bufView.length; i < l; i++) {
                        bufView[i] = s.charCodeAt(i + 1);
                    }
                    if (odd) {
                        (new Uint8Array(buf))[bufLen - 1] = s.charCodeAt(s.length - 1);
                    }
                    return bufView.buffer;
                };
                Cache.prototype.encodeString = function (s) {
                    if (!window.Uint8Array) {
                        throw new Error("UINT8 not supported");
                    }
                    if (window.TextEncoder && window.TextDecoder) {
                        return new window.TextEncoder('utf-8').encode(s);
                    }
                    var buf = new ArrayBuffer(s.length);
                    var bufView = new Uint8Array(buf);
                    for (var i = 0, strLen = s.length; i < strLen; i++) {
                        var c = s.charCodeAt(i);
                        if (c > 255) {
                            throw new Error("Non-ASCII character");
                        }
                        bufView[i] = c;
                    }
                    console.log("Using non-native encoder");
                    return bufView;
                };
                Cache.prototype.decodeString = function (a) {
                    if (!window.Uint8Array) {
                        throw new Error("UINT8 not supported");
                    }
                    if (window.TextEncoder && window.TextDecoder) {
                        return new window.TextDecoder('utf-8').decode(a);
                    }
                    console.log("Using non-native decoder");
                    var res = '';
                    for (var i = 0, bufLen = a.length; i < bufLen; i++) {
                        res += String.fromCharCode(a[i]);
                    }
                    return res;
                };
                Cache.prototype.compress = function (o) {
                    var s = JSON.stringify(o);
                    var start = performance.now();
                    var res = null;
                    try {
                        // Encode the string as byte array
                        var data = this.encodeString(s);
                        var compressed = agoda_lz4_1.compressBlock(data, new Uint8Array(10), 0); // Using LZ4 was the fastest by far
                        res = this.bufferToString(compressed.buffer);
                    }
                    catch (err) {
                        console.warn("Failed to compress cache with LZ4, err: " + err);
                        try {
                            res = '';
                        }
                        catch (e) {
                            console.warn("Failed to compress cache with LZString, err: " + e);
                        }
                    }
                    if (res != null) {
                        console.log("Compress from: " + s.length + " to: " +
                            res.length + " time: " + (performance.now() - start).toFixed() + "ms");
                    }
                    return res;
                };
                Cache.prototype.decompress = function (s) {
                    var start = performance.now();
                    var str = null;
                    try {
                        var compressedBytes = new window.Uint8Array(this.stringToBuffer(s));
                        console.log(compressedBytes);
                        var decompressedBytes = agoda_lz4_1.uncompressBlock(compressedBytes, new Uint8Array(10));
                        console.log(decompressedBytes);
                        // convert from array back to string
                        str = this.decodeString(decompressedBytes);
                    }
                    catch (err) {
                        console.warn("Failed to decompress cache with LZ4, err: " + err);
                        try {
                            str = "";
                        }
                        catch (e) {
                            console.warn("Failed to decompress cache with LZString, err: " + e);
                        }
                    }
                    if (str != null) {
                        console.log("Decompress from: " + s.length + " to: " +
                            str.length + " time: " + (performance.now() - start).toFixed() + "ms");
                        try {
                            return JSON.parse(str);
                        }
                        catch (err) {
                            console.warn("Error while parsing JSON object, return no cache");
                        }
                    }
                };
                Cache.prototype.if = function () {
                    jquery_1.default(window).on('unload', function () {
                        try {
                            var writeCacheStart = performance.now();
                            var localStorageCache = this.compress(this._cache.dump());
                            // Save the cache data in local storage for next time
                            console.log("Local Storage Cache Size: " + localStorageCache.length);
                            window.localStorage.setItem(this.localStorageKey, localStorageCache);
                            console.log("Cache writing time: " + (performance.now() - writeCacheStart).toFixed() + "ms");
                        }
                        catch (err) {
                            console.warn("Failed to store cache in local store: " + err);
                            console.warn("Removing cache from localStore");
                            window.localStorage.removeItem(this.localStorageKey);
                        }
                    });
                };
                return Cache;
            })();
            exports_1("default",Cache);
        }
    }
});
//# sourceMappingURL=cache.js.map