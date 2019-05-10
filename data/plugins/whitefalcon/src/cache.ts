interface Window {
    TextEncoder?: any;
    Uint8Array?: any;
    TextDecoder?: any;
    performance?: any;
    localStorage?: any;
}

declare var window: Window;
import _ from 'lodash';
import $ from 'jquery';
import Utils from './utils';
import { compressBlock, uncompressBlock } from "./agoda-lz4";
// import LRUCache from 'lru-cache'
// import LRUCache from './agoda-lru';

class Cache {
    localStorageKey = "whitefalcon_cache_dump";
    _cache: any;   // this should be 'lru-cache' module
    cacheStats: any = {};
    useCache: any = {
        miss: 0,
        hit: 0,
        toString: function () {
            return "CacheStats - Ratio: " +
                ((this.hit + this.miss) > 0 ? (100 * this.hit / (this.miss + this.hit)).toFixed(2) + "%" : "N/A") +
                " Miss: " + this.miss + " Hit: " + this.hit + " Cache size: " + this._cache.length;
        }
    };
    utils = new Utils();

    constructor() {
        'use strict';
        // TODO: Prefilter unusable data for more efficient memory
        // TODO: Only serialize part of the cache if it takes too much room on local storage
        this.useCache = !this.utils.getUrlParams()["nocache"];
        if (this.useCache) {
            this.loadCache();
        }

        function countset(ds) {
            if (!ds)
                return 0;
            if (ds.dataPoints) // v1
                return ds.dataPoints.length;
            else // v2
                return _.reduce(_.map(ds.datasets, function (s) { return s.datapoints.length; }), function (total, n) { return total + n; }) || 0;
        }
        // this._cache = new LRUCache({
        //     max: 250 * 1000, // a datapoint takes from 70 to a 400 bytes, depends on how much they are packed so this is around 50MB
        //     length: function (item: any) { return countset(item.data); },
        //     dispose: function (key) { },
        //     maxAge: 1000 * 60 * 60 // Don't want more than one hour in any case
        // });
    }

    isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    }


    set(key, startTime, endTime, data) {
        if (!this.useCache || startTime >= endTime) { return; }
        console.log("Adding to cache key: " + key);
        this._cache.set(key, { startTime: startTime, endTime: endTime, data: data });
    }

    /**
     * get data from CACHE using String as a key
     * @param key {"url":"http://hkg-wf-qa.agoda.local/v2/rest/discovery/metrics","method":"POST","data":{"query":"FE-PAGELOADTIME","from":"2019-04-29T23:00:00.000Z","to":"2019-04-30T05:59:59.999Z"},"timeout":30000,"headers":{"Content-Type":"application/json"}}
     */
    get(key) {
        console.log(`[Test] cache.get()`)
        if (!this.useCache) { return; }
        var entry = this._cache.get(key);
        if (!entry) { return null; }
        console.log("Fetching from cache key: " + key);
        return {
            startTime: entry.startTime,
            endTime: entry.endTime,
            data: entry.data
        };
    }

    hit(n) {
        this.cacheStats.hit += this.isInteger(n) ? n : this.countset(n);
    }

    miss(n) {
        this.cacheStats.miss += this.isInteger(n) ? n : this.countset(n);
    }

    countset(ds) {
        if (!ds) {
            return 0;
        }
        if (ds.dataPoints) {
            return ds.dataPoints.length;
        } else {
            return _.reduce(_.map(ds.datasets, function (s) { return s.datapoints.length; })
                , function (total, n) { return total + n; }) || 0;
        }
    }

    // Initialize from local storage
    loadCache() {
        var localStorageCache = window.localStorage.getItem(this.localStorageKey);
        if (localStorageCache) {
            var decompressed = this.decompress(localStorageCache);
            if (decompressed) {
                this._cache.load(decompressed);
            }
        }
    }

    bufferToString(buf) {
        var odd = (buf.byteLength % 2 === 1);
        var a = new Uint16Array(buf, 0, Math.floor(buf.byteLength / 2));
        // If we have odd number, we cannot use this with Uint16, so we need to fix
        var res;
        // Keep the odd flag as the first character
        if (odd) { res = '1'; } else { res = '0'; }

        for (var i = 0, len = a.length; i < len; i++) {
            res += String.fromCharCode(a[i]);
        }
        // Append the last byte as char to the end if odd
        if (odd) { res += String.fromCharCode((new Uint8Array(buf))[buf.byteLength - 1]); }
        return res;
    }

    stringToBuffer(s) {
        var odd = (s[0] === '1');
        var bufLen = (s.length - 1) * 2 - (odd ? 1 : 0);
        var buf = new ArrayBuffer(bufLen);
        var bufView = new Uint16Array(buf, 0, Math.floor(bufLen / 2));
        for (var i = 0, l = bufView.length; i < l; i++) {
            bufView[i] = s.charCodeAt(i + 1);
        }
        if (odd) { // Append the last character as a Uint8
            (new Uint8Array(buf))[bufLen - 1] = s.charCodeAt(s.length - 1);
        }
        return bufView.buffer;
    }

    encodeString(s) {
        if (!window.Uint8Array) {
            throw new Error("UINT8 not supported");
        }
        if (window.TextEncoder && window.TextDecoder) { // Use encoding API if available
            return new window.TextEncoder('utf-8').encode(s);
        }

        var buf = new ArrayBuffer(s.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = s.length; i < strLen; i++) {
            var c = s.charCodeAt(i);
            if (c > 255) { throw new Error("Non-ASCII character"); }
            bufView[i] = c;
        }
        console.log("Using non-native encoder");
        return bufView;
    }

    decodeString(a) {
        if (!window.Uint8Array) {
            throw new Error("UINT8 not supported");
        }

        if (window.TextEncoder && window.TextDecoder) {// Use encoding API if available}
            return new window.TextDecoder('utf-8').decode(a);
        }

        console.log("Using non-native decoder");
        var res = '';
        for (var i = 0, bufLen = a.length; i < bufLen; i++) {
            res += String.fromCharCode(a[i]);
        }
        return res;
    }

    compress(o) { // Object -> String
        var s = JSON.stringify(o);
        var start = performance.now();
        var res = null;
        try { // If we have support for typed arrays, we can use much faster compression
            // Encode the string as byte array
            var data = this.encodeString(s);
            var compressed: any = compressBlock(data, new Uint8Array(10), 0); // Using LZ4 was the fastest by far
            res = this.bufferToString(compressed.buffer);
        } catch (err) {
            console.warn("Failed to compress cache with LZ4, err: " + err);
            try {
                res = '';
            } catch (e) {
                console.warn("Failed to compress cache with LZString, err: " + e);
            }
        }
        if (res != null) {
            console.log("Compress from: " + s.length + " to: " +
                res.length + " time: " + (performance.now() - start).toFixed() + "ms");
        }
        return res;
    }

    decompress(s) { // String -> Object
        var start = performance.now();
        var str = null;
        try { // If we have support for typed arrays, we can use much faster compression
            var compressedBytes = new window.Uint8Array(this.stringToBuffer(s));
            console.log(compressedBytes);
            var decompressedBytes: any = uncompressBlock(compressedBytes, new Uint8Array(10));
            console.log(decompressedBytes);
            // convert from array back to string
            str = this.decodeString(decompressedBytes);
        } catch (err) {
            console.warn("Failed to decompress cache with LZ4, err: " + err);
            try {
                str = "";
            } catch (e) {
                console.warn("Failed to decompress cache with LZString, err: " + e);
            }
        }
        if (str != null) {
            console.log("Decompress from: " + s.length + " to: " +
                str.length + " time: " + (performance.now() - start).toFixed() + "ms");
            try {
                return JSON.parse(str);
            } catch (err) {
                console.warn("Error while parsing JSON object, return no cache");
            }
        }
    }

    if() {
        $(window).on('unload', function () {
            try {
                var writeCacheStart = performance.now();
                var localStorageCache = this.compress(this._cache.dump());
                // Save the cache data in local storage for next time
                console.log("Local Storage Cache Size: " + localStorageCache.length);
                window.localStorage.setItem(this.localStorageKey, localStorageCache);
                console.log("Cache writing time: " + (performance.now() - writeCacheStart).toFixed() + "ms");
            } catch (err) {
                console.warn("Failed to store cache in local store: " + err);
                console.warn("Removing cache from localStore");
                window.localStorage.removeItem(this.localStorageKey);
            }

        });
    }
}

export default Cache;