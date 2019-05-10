// lz4-ts @license BSD-3-Clause / Copyright (c) 2015, Pierre Curto / 2016, oov. All rights reserved.
System.register([], function(exports_1) {
    var errInvalidSource, errShortBuffer, minMatch, winSizeLog, winSize, winMask, hashSizeLog, hashSize, hashShift, mfLimit, skipStrength, hasher, imul;
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Math/imul#Polyfill
    function imulPolyfill(a, b) {
        // tslint:disable-next-line:no-bitwise
        var ah = (a >>> 16) & 0xffff;
        // tslint:disable-next-line:no-bitwise
        var al = a & 0xffff;
        // tslint:disable-next-line:no-bitwise
        var bh = (b >>> 16) & 0xffff;
        // tslint:disable-next-line:no-bitwise
        var bl = b & 0xffff;
        // the shift by 0 fixes the sign on the high part
        // the final |0 converts the unsigned value into a signed value
        return al * bl + (((ah * bl + al * bh) << 16) >>> 0) | 0;
    }
    function getUint32(a, i) {
        return (a[i + 3]) | (a[i + 2] << 8) | (a[i + 1] << 16) | (a[i] << 24);
    }
    function copy(dest, src, di, si, len) {
        for (var i = 0; i < len; ++i) {
            dest[di++] = src[si++];
        }
    }
    function calcUncompressedLen(src) {
        var sn = src.length;
        if (sn === 0) {
            return 0;
        }
        for (var si = 0, di = 0;;) {
            // literals and match lengths (token)
            var lLen = src[si] >> 4;
            var mLen = src[si] & 0xf;
            if (++si === sn) {
                throw errInvalidSource;
            }
            // literals
            if (lLen > 0) {
                if (lLen === 0xf) {
                    while (src[si] === 0xff) {
                        lLen += 0xff;
                        if (++si === sn) {
                            throw errInvalidSource;
                        }
                    }
                    lLen += src[si];
                    if (++si === sn) {
                        throw errInvalidSource;
                    }
                }
                di += lLen;
                si += lLen;
                if (si >= sn) {
                    return di;
                }
            }
            si += 2;
            if (si >= sn) {
                throw errInvalidSource;
            }
            var offset = src[si - 2] | (src[si - 1] << 8);
            if (di - offset < 0 || offset === 0) {
                throw errInvalidSource;
            }
            // match
            if (mLen === 0xf) {
                while (src[si] === 0xff) {
                    mLen += 0xff;
                    if (++si === sn) {
                        throw errInvalidSource;
                    }
                }
                mLen += src[si];
                if (++si === sn) {
                    throw errInvalidSource;
                }
            }
            // minimum match length is 4
            mLen += 4;
            // copy the match (NB. match is at least 4 bytes long)
            for (; mLen >= offset; mLen -= offset) {
                di += offset;
            }
            di += mLen;
        }
    }
    exports_1("calcUncompressedLen", calcUncompressedLen);
    function uncompressBlock(src, dest) {
        var sn = src.length;
        var dn = dest.length;
        if (sn === 0) {
            return 0;
        }
        for (var si = 0, di = 0;;) {
            // literals and match lengths (token)
            var lLen = src[si] >> 4;
            var mLen = src[si] & 0xf;
            if (++si === sn) {
                throw errInvalidSource;
            }
            // literals
            if (lLen > 0) {
                if (lLen === 0xf) {
                    while (src[si] === 0xff) {
                        lLen += 0xff;
                        if (++si === sn) {
                            throw errInvalidSource;
                        }
                    }
                    lLen += src[si];
                    if (++si === sn) {
                        throw errInvalidSource;
                    }
                }
                if (dn - di < lLen || si + lLen > sn) {
                    throw errShortBuffer;
                }
                copy(dest, src, di, si, lLen);
                di += lLen;
                si += lLen;
                if (si >= sn) {
                    return di;
                }
            }
            si += 2;
            if (si >= sn) {
                throw errInvalidSource;
            }
            // tslint:disable-next-line:no-bitwise
            var offset = src[si - 2] | (src[si - 1] << 8);
            if (di - offset < 0 || offset === 0) {
                throw errInvalidSource;
            }
            // match
            if (mLen === 0xf) {
                while (src[si] === 0xff) {
                    mLen += 0xff;
                    if (++si === sn) {
                        throw errInvalidSource;
                    }
                }
                mLen += src[si];
                if (++si === sn) {
                    throw errInvalidSource;
                }
            }
            // minimum match length is 4
            mLen += 4;
            if (dn - di <= mLen) {
                throw errShortBuffer;
            }
            // copy the match (NB. match is at least 4 bytes long)
            for (; mLen >= offset; mLen -= offset) {
                copy(dest, dest, di, di - offset, offset);
                di += offset;
            }
            copy(dest, dest, di, di - offset, mLen);
            di += mLen;
        }
    }
    exports_1("uncompressBlock", uncompressBlock);
    function compressBlockBound(n) {
        return n + (n / 255 | 0) + 16;
    }
    exports_1("compressBlockBound", compressBlockBound);
    function compressBlock(src, dest, soffset) {
        var sn = src.length - mfLimit;
        var dn = dest.length;
        if (sn <= 0 || dn === 0 || soffset >= sn) {
            return 0;
        }
        var si = 0, di = 0;
        // fast scan strategy:
        // we only need a hash table to store the last sequences (4 bytes)
        var hashTable = new Uint32Array(hashSize);
        // Initialise the hash table with the first 64Kb of the input buffer
        // (used when compressing dependent blocks)
        while (si < soffset) {
            var h = imul(getUint32(src, si), hasher) >>> hashShift;
            hashTable[h] = ++si;
        }
        var anchor = si;
        var fma = 1 << skipStrength;
        while (si < sn - minMatch) {
            // hash the next 4 bytes (sequence)...
            var h = imul(getUint32(src, si), hasher) >>> hashShift;
            // -1 to separate existing entries from new ones
            var ref = hashTable[h] - 1;
            // ...and store the position of the hash in the hash table (+1 to compensate the -1 upon saving)
            hashTable[h] = si + 1;
            // no need to check the last 3 bytes in the first literal 4 bytes as
            // this guarantees that the next match, if any, is compressed with
            // a lower size, since to have some compression we must have:
            // ll+ml-overlap > 1 + (ll-15)/255 + (ml-4-15)/255 + 2 (uncompressed size>compressed size)
            // => ll+ml>3+2*overlap => ll+ml>= 4+2*overlap
            // and by definition we do have:
            // ll >= 1, ml >= 4
            // => ll+ml >= 5
            // => so overlap must be 0
            // the sequence is new, out of bound (64kb) or not valid: try next sequence
            if (ref < 0 ||
                (si - ref) >> winSizeLog > 0 ||
                src[ref] !== src[si] ||
                src[ref + 1] !== src[si + 1] ||
                src[ref + 2] !== src[si + 2] ||
                src[ref + 3] !== src[si + 3]) {
                // variable step: improves performance on non-compressible data
                si += fma >> skipStrength;
                ++fma;
                continue;
            }
            // match found
            fma = 1 << skipStrength;
            var lLen_1 = si - anchor;
            var offset = si - ref;
            // encode match length part 1
            si += minMatch;
            var mLen = si; // match length has minMatch already
            while (si <= sn && src[si] === src[si - offset]) {
                si++;
            }
            mLen = si - mLen;
            if (mLen < 0xf) {
                dest[di] = mLen;
            }
            else {
                dest[di] = 0xf;
            }
            // encode literals length
            if (lLen_1 < 0xf) {
                dest[di] |= lLen_1 << 4;
            }
            else {
                dest[di] |= 0xf0;
                if (++di === dn) {
                    throw errShortBuffer;
                }
                var l = lLen_1 - 0xf;
                for (; l >= 0xff; l -= 0xff) {
                    dest[di] = 0xff;
                    if (++di === dn) {
                        throw errShortBuffer;
                    }
                }
                dest[di] = l & 0xff;
            }
            if (++di === dn) {
                throw errShortBuffer;
            }
            // literals
            if (di + lLen_1 >= dn) {
                throw errShortBuffer;
            }
            copy(dest, src, di, anchor, lLen_1);
            di += lLen_1;
            anchor = si;
            // encode offset
            di += 2;
            if (di >= dn) {
                throw errShortBuffer;
            }
            dest[di - 2] = offset;
            // tslint:disable-next-line:no-bitwise
            dest[di - 1] = offset >> 8;
            // encode match length part 2
            if (mLen >= 0xf) {
                for (mLen -= 0xf; mLen >= 0xff; mLen -= 0xff) {
                    dest[di] = 0xff;
                    if (++di === dn) {
                        throw errShortBuffer;
                    }
                }
                dest[di] = mLen;
                if (++di === dn) {
                    throw errShortBuffer;
                }
            }
        }
        if (anchor === 0) {
            // incompressible
            return 0;
        }
        // last literals
        var lLen = src.length - anchor;
        if (lLen < 0xf) {
            // tslint:disable-next-line:no-bitwise
            dest[di] = lLen << 4;
        }
        else {
            dest[di] = 0xf0;
            if (++di === dn) {
                throw errShortBuffer;
            }
            for (lLen -= 0xf; lLen >= 0xff; lLen -= 0xff) {
                dest[di] = 0xff;
                if (++di === dn) {
                    throw errShortBuffer;
                }
            }
            dest[di] = lLen;
        }
        if (++di === dn) {
            throw errShortBuffer;
        }
        // write literals
        var lastLen = src.length - anchor;
        var n = di + lastLen;
        if (n > dn) {
            throw errShortBuffer;
        }
        else if (n >= sn) {
            // incompressible
            return 0;
        }
        copy(dest, src, di, anchor, lastLen);
        di += lastLen;
        return di;
    }
    exports_1("compressBlock", compressBlock);
    function compressBlockHC(src, dest, soffset) {
        var sn = src.length - mfLimit;
        var dn = dest.length;
        if (sn <= 0 || dn === 0 || soffset >= sn) {
            return 0;
        }
        var si = 0, di = 0;
        // Hash Chain strategy:
        // we need a hash table and a chain table
        // the chain table cannot contain more entries than the window size (64Kb entries)
        var hashTable = new Uint32Array(hashSize);
        var chainTable = new Uint32Array(winSize);
        // Initialise the hash table with the first 64Kb of the input buffer
        // (used when compressing dependent blocks)
        while (si < soffset) {
            var h = imul(getUint32(src, si), hasher) >>> hashShift;
            chainTable[si & winMask] = hashTable[h];
            hashTable[h] = ++si;
        }
        var anchor = si;
        while (si < sn - minMatch) {
            // hash the next 4 bytes (sequence)...
            var h = imul(getUint32(src, si), hasher) >>> hashShift;
            // follow the chain until out of window and give the longest match
            var mLen = 0;
            var offset = 0;
            for (var next = hashTable[h] - 1; next > 0 && next > si - winSize; next = chainTable[next & winMask] - 1) {
                // the first (mLen==0) or next byte (mLen>=minMatch) at current match length must match to improve on the match length
                if (src[next + mLen] === src[si + mLen]) {
                    for (var ml = 0;; ++ml) {
                        if (src[next + ml] !== src[si + ml] || si + ml > sn) {
                            // found a longer match, keep its position and length
                            if (mLen < ml && ml >= minMatch) {
                                mLen = ml;
                                offset = si - next;
                            }
                            break;
                        }
                    }
                }
            }
            chainTable[si & winMask] = hashTable[h];
            hashTable[h] = si + 1;
            // no match found
            if (mLen === 0) {
                ++si;
                continue;
            }
            // match found
            // update hash/chain tables with overlaping bytes:
            // si already hashed, add everything from si+1 up to the match length
            for (var si2 = si + 1, ml = si + mLen; si2 < ml;) {
                var h_1 = imul(getUint32(src, si2), hasher) >>> hashShift;
                chainTable[si2 & winMask] = hashTable[h_1];
                hashTable[h_1] = ++si2;
            }
            var lLen_2 = si - anchor;
            si += mLen;
            mLen -= minMatch; // match length does not include minMatch
            if (mLen < 0xf) {
                dest[di] = mLen;
            }
            else {
                dest[di] = 0xf;
            }
            // encode literals length
            if (lLen_2 < 0xf) {
                dest[di] |= lLen_2 << 4;
            }
            else {
                dest[di] |= 0xf0;
                if (++di === dn) {
                    throw errShortBuffer;
                }
                var l = lLen_2 - 0xf;
                for (; l >= 0xff; l -= 0xff) {
                    dest[di] = 0xff;
                    if (++di === dn) {
                        throw errShortBuffer;
                    }
                }
                dest[di] = l & 0xff;
            }
            if (++di === dn) {
                throw errShortBuffer;
            }
            // literals
            if (di + lLen_2 >= dn) {
                throw errShortBuffer;
            }
            copy(dest, src, di, anchor, lLen_2);
            di += lLen_2;
            anchor = si;
            // encode offset
            di += 2;
            if (di >= dn) {
                throw errShortBuffer;
            }
            dest[di - 2] = offset;
            dest[di - 1] = offset >> 8;
            // encode match length part 2
            if (mLen >= 0xf) {
                for (mLen -= 0xf; mLen >= 0xff; mLen -= 0xff) {
                    dest[di] = 0xff;
                    if (++di === dn) {
                        throw errShortBuffer;
                    }
                }
                dest[di] = mLen;
                if (++di === dn) {
                    throw errShortBuffer;
                }
            }
        }
        if (anchor === 0) {
            // incompressible
            return 0;
        }
        // last literals
        var lLen = src.length - anchor;
        if (lLen < 0xf) {
            dest[di] = lLen << 4;
        }
        else {
            dest[di] = 0xf0;
            if (++di === dn) {
                throw errShortBuffer;
            }
            for (lLen -= 0xf; lLen >= 0xff; lLen -= 0xff) {
                dest[di] = 0xff;
                if (++di === dn) {
                    throw errShortBuffer;
                }
            }
            dest[di] = lLen;
        }
        if (++di === dn) {
            throw errShortBuffer;
        }
        // write literals
        var lastLen = src.length - anchor;
        var n = di + lastLen;
        if (n > dn) {
            throw errShortBuffer;
        }
        else if (n >= sn) {
            // incompressible
            return 0;
        }
        copy(dest, src, di, anchor, lastLen);
        di += lastLen;
        return di;
    }
    exports_1("compressBlockHC", compressBlockHC);
    return {
        setters:[],
        execute: function() {
            errInvalidSource = new Error('invalid source');
            errShortBuffer = new Error('short buffer');
            // The following constants are used to setup the compression algorithm.
            minMatch = 4; // the minimum size of the match sequence size (4 bytes)
            winSizeLog = 16; // LZ4 64Kb window size limit
            // tslint:disable-next-line:no-bitwise
            winSize = 1 << winSizeLog;
            winMask = winSize - 1; // 64Kb window of previous data for dependent blocks
            // hashSizeLog determines the size of the hash table used to quickly find a previous match position.
            // Its value influences the compression speed and memory usage, the lower the faster,
            // but at the expense of the compression ratio.
            // 16 seems to be the best compromise.
            hashSizeLog = 16;
            // tslint:disable-next-line:no-bitwise
            hashSize = 1 << hashSizeLog;
            hashShift = (minMatch * 8) - hashSizeLog;
            mfLimit = 8 + minMatch; // The last match cannot start within the last 12 bytes.
            skipStrength = 6; // variable step for fast scan
            // tslint:disable-next-line:no-bitwise
            hasher = 2654435761 | 0; // prime number used to hash minMatch
            ;
            imul = Math.imul ? Math.imul : imulPolyfill;
        }
    }
});
//# sourceMappingURL=agoda-lz4.js.map