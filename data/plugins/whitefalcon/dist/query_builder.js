System.register(['lodash', 'moment', './utils', './wf_query'], function(exports_1) {
    var lodash_1, moment_1, utils_1, wf_query_1;
    var WfQueryBuilder;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (moment_1_1) {
                moment_1 = moment_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (wf_query_1_1) {
                wf_query_1 = wf_query_1_1;
            }],
        execute: function() {
            WfQueryBuilder = (function () {
                function WfQueryBuilder(options) {
                    this.utils = new utils_1.default();
                    this.MAX_DATA_POINTS = 500;
                    this._limitGranularity = function (start, end, granularity, limitedGranularity) {
                        var points = Math.ceil((moment_1.default(end) - moment_1.default(start)) / granularity / 1000);
                        if (points <= this.MAX_DATA_POINTS) {
                            return granularity;
                        }
                        else {
                            return this._calcGranularityByDataPoints(start, end, this.MAX_DATA_POINTS, limitedGranularity);
                        }
                    };
                    this._addTagFilter = function (query, func) {
                        var key, val;
                        switch (func.def.shortName) {
                            case 'dc':
                                key = 'dc';
                                val = func.params[0];
                                break;
                            case 'tag':
                                key = func.params[0];
                                val = func.params[1];
                                break;
                            default:
                                throw new Error("Unknown tag filter method: " + func.def.name);
                        }
                        if (val && val.length > 0 && val[0] === '*') {
                            delete query.tags[key];
                        }
                        else {
                            query.tags[key] = val;
                        }
                    };
                    this._addExcludeTagFilter = function (query, func) {
                        var key, val;
                        key = func.params[0];
                        val = func.params[1];
                        if (val && val.length > 0 && val[0] === 'None') {
                            delete query.exclude_tags[key];
                        }
                        else {
                            query.exclude_tags[key] = val;
                        }
                    };
                    this._modifyRawQuery = function () {
                        return ['modquery'];
                    };
                    this.options = options;
                }
                WfQueryBuilder.prototype.build = function (params) {
                    var self = this;
                    var timeShift = 0;
                    lodash_1.default.each(params.functions, function (func) {
                        if (func.def.shortName === 'timeShiftSec') {
                            timeShift = func.params[0];
                        }
                        else if (func.def.shortName === 'timeShift') {
                            timeShift = self._convertToSeconds(func.params[0], func.params[1]);
                        }
                    });
                    var limitedGranularity = lodash_1.default.find(params.functions, function (f) {
                        if (lodash_1.default.includes(['percentile', 'countDistinct'], f.def.shortName)) {
                            return true;
                        }
                    }) || false;
                    var query = {
                        tags: {},
                        exclude_tags: {},
                        metric: params.metric,
                        noCache: false,
                        fillZeros: false
                    };
                    query.granularity = self._calcGranularityByDataPoints(this.options.range.from, this.options.range.to, this.options.maxDataPoints, limitedGranularity);
                    lodash_1.default.each(params.functions, lodash_1.default.bind(function (func) {
                        if (func.def.fxName) {
                            if (query.fx) {
                                throw new Error("Aggregation already defined as '" +
                                    query.fx + "' cannot define also as '" + func.def.fxName + "'");
                            }
                            query.fx = {
                                method: func.def.fxName,
                                params: lodash_1.default.zipObject(lodash_1.default.map(func.def.params, 'name'), func.params)
                            };
                        }
                        if (func.def.tagFilter) {
                            self._addTagFilter(query, func);
                        }
                        if (func.def.shortName === 'excludeTag') {
                            self._addExcludeTagFilter(query, func);
                        }
                        if (func.def.shortName === 'noCache') {
                            query.noCache = true;
                        }
                        if (func.def.shortName === 'percentile') {
                            query.percentile = lodash_1.default.map(func.params[0].split(','), function (p) { return p.trim(); });
                        }
                        if (func.def.shortName === 'granularity') {
                            query.granularity = self._convertToSeconds(func.params[0], func.params[1]);
                        }
                        if (func.def.shortName === 'dataPoints') {
                            query.granularity = self._calcGranularityByDataPoints(this.options.range.from, this.options.range.to, func.params[0], limitedGranularity);
                        }
                        if (func.def.shortName === 'groupBy') {
                            query.groupby = (query.groupby || []).concat(lodash_1.default.map(func.params[0], function (g) { return g.trim(); }));
                        }
                        if (func.def.shortName === 'fillZeros') {
                            query.fillZeros = true;
                        }
                        if (func.def.shortName === 'countDistinct') {
                            query.distinct_count = true;
                        }
                    }, this));
                    query.granularity = Math.max(self._limitGranularity(this.options.range.from, this.options.range.to, query.granularity, limitedGranularity), 1);
                    // Now that we have the final granularity, we can recalculate the optimal start and end time, to make sure we use
                    // full bins as much as possible and also apply the timeshift
                    query.start = this.translateTime(this.options.range.from, 'round-down', timeShift, query.granularity);
                    query.end = this.translateTime(this.options.range.to, 'round-up', timeShift, query.granularity);
                    return new wf_query_1.default(query);
                };
                WfQueryBuilder.prototype._convertToSeconds = function (value, type) {
                    switch (type) {
                        case "Seconds": return value;
                        case "Minutes": return value * 60;
                        case "Hours": return value * 60 * 60;
                        case "Days": return value * 60 * 60 * 24;
                        case "Weeks": return value * 60 * 60 * 24 * 7;
                    }
                };
                WfQueryBuilder.prototype.roundTo = function (n, k, down) {
                    // Round n to a multiplier of k
                    if (n % k === 0) {
                        return n;
                    }
                    n = n - (n % k);
                    if (!down) {
                        return n + k;
                    }
                    return n;
                };
                WfQueryBuilder.prototype._calcGranularityByDataPoints = function (start, end, dataPoints, limitedGranularity) {
                    var req = Math.ceil((moment_1.default(end) - moment_1.default(start)) / dataPoints / 1000);
                    var granArray;
                    if (limitedGranularity) {
                        granArray = [300, 3600, 86400, 1e9];
                    }
                    else {
                        granArray = [60, 600, 3600, 1e9];
                    }
                    return this.roundTo(req, lodash_1.default.find(granArray, function (v, i, a) {
                        if (req < a[i + 1]) {
                            return v;
                        }
                    }));
                };
                WfQueryBuilder.prototype.translateTime = function (date, rounding, timeShift, granularity) {
                    date = date.clone().utc();
                    // console.log("D -> " + date);
                    if (rounding && granularity) {
                        var down = rounding === 'round-down';
                        var totalSec = date.unix();
                        // We are forcing the start/end time be a multiplication of the granularity
                        // This way we get consistency over time and the grid as absolutely set as time progresses
                        // However this is limited to one day, so if we have really large granularity it doesn't become problematic
                        var adjusted = this.roundTo(totalSec, Math.min(granularity, 24 * 60 * 60), down);
                        date.add(adjusted - totalSec, 's');
                    }
                    // Add the timeshift in the end, after movements to make sure the timeshift is exactly what we intended it to be
                    date.add(timeShift || 0, 's');
                    return date.format('YYYY-MM-DDTHH:mm:ssZ'); //unix();
                };
                return WfQueryBuilder;
            })();
            exports_1("default",WfQueryBuilder);
        }
    }
});
//# sourceMappingURL=query_builder.js.map