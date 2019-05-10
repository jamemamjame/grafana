System.register(['lodash', './everpolate'], function(exports_1) {
    var lodash_1, everpolate_1;
    var WfSeries;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (everpolate_1_1) {
                everpolate_1 = everpolate_1_1;
            }],
        execute: function() {
            WfSeries = (function () {
                function WfSeries(dp, params, templateSrv, scopedVars, granularity, groupObj, percentile) {
                    this.aggregates = {
                        median: function (arr) {
                            var sortedArr = arr.sort(function (num1, num2) {
                                return num1 - num2;
                            });
                            var medianIndex = Math.floor(sortedArr.length / 2);
                            if (arr.length % 2 === 0) {
                                return (sortedArr[medianIndex - 1] + sortedArr[medianIndex]) / 2;
                            }
                            else {
                                return sortedArr[medianIndex];
                            }
                        },
                        sum: function (arr) { return lodash_1.default.reduce(arr, function (a, b) { return a + b; }); },
                        avg: function (arr) { return this.aggregates.sum(arr) / arr.length; },
                        mult: function (arr) { return lodash_1.default.reduce(arr, function (a, b) { return a * b; }); }
                    };
                    this.differentiate = function (yValues, per) {
                        var factor = this.getFactor(per);
                        var xValues = this.getXValues();
                        return lodash_1.default.map(yValues, function (v, i) {
                            if (i === 0) {
                                return null;
                            } // First derivative is null
                            return (v - yValues[i - 1]) / (xValues[i] - xValues[i - 1]) * factor;
                        });
                    };
                    this.runningAvg = function (yValues, duration, units) {
                        var period = this._convertToSeconds(duration, units) * 1000;
                        var xValues = this.getXValues();
                        return lodash_1.default.map(yValues, function (v, i) {
                            var sum = v;
                            var start = xValues[i];
                            for (var j = i - 1; (j >= 0) && (start - xValues[j] <= period); j--) {
                                sum += yValues[j];
                            }
                            return sum / (i - j);
                        });
                    };
                    this.getTimeShiftParams = function () {
                        var timeShift = 0;
                        var self = this;
                        var sync = false;
                        var lag;
                        lodash_1.default.each(this.params.functions, function (func) {
                            if (func.def.shortName === 'timeShiftSec') {
                                timeShift = func.params[0] * 1000;
                            }
                            else if (func.def.shortName === 'timeShift') {
                                timeShift = self._convertToSeconds(func.params[0], func.params[1]) * 1000;
                                sync = func.params[2] !== "false";
                                lag = parseInt(func.params[2]);
                            }
                        });
                        return { timeShift: timeShift, sync: sync, lag: lodash_1.default.isFinite(lag) ? lag : 28 };
                    };
                    this._convertToSeconds = function (value, type) {
                        switch (type) {
                            case "Seconds": return value;
                            case "Minutes": return value * 60;
                            case "Hours": return value * 60 * 60;
                            case "Days": return value * 60 * 60 * 24;
                            case "Weeks": return value * 60 * 60 * 24 * 7;
                        }
                    };
                    this.getRelativeCombiner = function (func) {
                        function anyNull(a, b) { return lodash_1.default.some(Array.prototype.slice.call(arguments), function (arg) { return (arg === null); }); }
                        function multiSeriesAgg(aggregator) {
                            return {
                                f: function () {
                                    var args = Array.prototype.slice.call(arguments);
                                    return anyNull.apply(null, args) ? null : aggregator(args);
                                }, aggregate: false
                            };
                        }
                        switch (func.def.shortName) {
                            case 'asPercent': return {
                                f: function (local, other) {
                                    return anyNull(local, other) ? null : other > 0 ? 100 * local / other : null;
                                }, aggregate: false
                            };
                            case 'divSeries': return {
                                f: function (local, other) {
                                    return anyNull(local, other) ? null : other > 0 ? local / other : null;
                                }, aggregate: false
                            };
                            case 'diffSeries': return { f: function (local, other) {
                                    return anyNull(local, other) ? null : local - other;
                                }, aggregate: false };
                            case 'sumSeries': return multiSeriesAgg(this.aggregates.sum);
                            case 'avgSeries': return multiSeriesAgg(this.aggregates.avg);
                            case 'medianSeries': return multiSeriesAgg(this.aggregates.median);
                            case 'multSeries': return multiSeriesAgg(this.aggregates.mult);
                            case 'poissonCdf': return { f: function (local, other) {
                                    return anyNull(local, other) ? null : this.cdf(local, other);
                                }, aggregate: false };
                            case 'maxSeries': return { f: function (local, others) {
                                    return Math.max.apply(this, [local].concat(others));
                                }, aggregate: true };
                            default: throw new Error("Unknown relative combiner - '" + func.def.shortName + "'");
                        }
                    };
                    this.percentile = percentile;
                    this.granularity = granularity;
                    this.params = params;
                    this.templateSrv = templateSrv;
                    this.scopedVars = scopedVars;
                    this.groupObj = groupObj || {};
                    if (lodash_1.default.some(params.functions, function (f) { return f.def.name === 'withoutLast'; })) {
                        this.dataPoints = lodash_1.default.initial(dp);
                    }
                    else {
                        this.dataPoints = dp;
                    }
                }
                WfSeries.prototype.getPostCalc = function (name, params) {
                    switch (name) {
                        case 'sum': return function (cnt, sum) { return sum; };
                        case 'avg': return function (cnt, sum) { return (cnt > (params[0] || 0)) ? sum / cnt : null; };
                        case 'count': return function (cnt, sum) { return cnt; };
                        case 'countDistinct': return function (c, s, p, count_distinct) { return count_distinct; };
                        case 'percentile': return (this.percentile === 'count')
                            ? this.getPostCalc('count', params) : function (cnt, sum, percentile) { return percentile; };
                        case 'custom':
                            var f = new Function('o', params[0]);
                            return function (cnt, sum, percentile) { return f({ count: cnt, sum: sum, percentile: percentile }); };
                    }
                };
                /* jshint ignore:end */
                WfSeries.prototype.show = function () {
                    return !this.params.hidden;
                };
                WfSeries.prototype.getAlias = function () {
                    var seriesName = this.params.target;
                    lodash_1.default.each(this.params.functions, function (func) {
                        if (func.def.name === "alias") {
                            seriesName = func.params[0];
                        }
                    });
                    var baseName = seriesName ? this.templateSrv.replace(seriesName, this.scopedVars).replace("$0", this.percentile) : '';
                    // Add group values
                    var groupValues = lodash_1.default.map(this.params.groupby, lodash_1.default.bind(function (k) { return this.groupObj[k]; }, this));
                    var final = lodash_1.default.reduce([baseName].concat(groupValues), function (total, value, ind) { return total.replace("$" + ind, value); });
                    /* jshint ignore:start */
                    lodash_1.default.each(this.params.functions, function (func) {
                        if (func.def.name === "mapAlias") {
                            var f = new Function('a', func.params[0]);
                            final = f(final);
                        }
                    });
                    /* jshint ignore:end */
                    return final;
                };
                WfSeries.prototype.getTimeSeries = function (allSeries) {
                    var datapoints = lodash_1.default.zip(this.getYValues(allSeries), this.getXValues());
                    return { target: this.getAlias(), datapoints: datapoints };
                };
                WfSeries.prototype.getSyncedDataPoints = function () {
                    /* This method is supposed to handle a case where we have a timeshift (e.g. a week back) and then
                       the data from last week is too much "into the future", we want to simulate the values we would
                       have seen, have we really sampled the data in this point in time a week ago, i.e. simulate the incomplete data
                    */
                    var timeShiftParams = this.getTimeShiftParams();
                    // Check if sync is enabled and if the timeshift is back enough into the past to show a different bucket of results,
                    // which will already be complete
                    var granMs = this.granularity * 1000;
                    if (this.percentile != null || !timeShiftParams.sync
                        || granMs > -timeShiftParams.timeShift) {
                        return this.dataPoints;
                    }
                    var currentTime = new Date().getTime() + timeShiftParams.lag * 1000;
                    return lodash_1.default.map(lodash_1.default.zip(this.getXValues(), this.dataPoints), function (a) {
                        var timestamp = a[0];
                        var point = a[1];
                        // Calculate how much time we should be missing for this measurement
                        var factor = Math.max((currentTime - timestamp) / granMs, 0);
                        if (factor < 1) {
                            var newPoint = lodash_1.default.clone(point);
                            newPoint.sum = point.sum * factor;
                            newPoint.count = point.count * factor;
                            if (point.distinct_count) {
                                newPoint.distinct_count = point.distinct_count * factor;
                            }
                            return newPoint;
                        }
                        else {
                            return point;
                        }
                    });
                };
                WfSeries.prototype.getYValues = function (allSeries) {
                    var postCalc = null;
                    var postCalcParams = null;
                    lodash_1.default.each(this.params.functions, function (func) {
                        if (func.def.postCalc) {
                            if (postCalc) {
                                throw new Error("Post calculation already defined as '"
                                    + postCalc + "' cannot define also as '" + func.def.postCalc + "'");
                            }
                            postCalc = func.def.postCalc;
                            postCalcParams = func.params;
                        }
                    });
                    // Sync the datapoints to not show data from the future in case of a time shift
                    var syncedDataPoints = this.getSyncedDataPoints();
                    var calcFun = this.getPostCalc(postCalc || "sum", postCalcParams);
                    var yValues = lodash_1.default.map(syncedDataPoints, lodash_1.default.bind(function (p) {
                        return calcFun(p.count, p.sum, p.percentile
                            ? p.percentile[this.percentile] : null, p.distinct_count);
                    }, this));
                    // Relative function and derivative have to be performed in the right order
                    lodash_1.default.each(this.params.functions, lodash_1.default.bind(function (func) {
                        if (func.def.relative) {
                            yValues = this.applyRelativeFunction(func, yValues, allSeries);
                        }
                        switch (func.def.shortName) {
                            case "derivative":
                                yValues = this.differentiate(yValues, func.params[0]);
                                break;
                            case "rate":
                                yValues = this.rate(yValues, func.params[0]);
                                break;
                            case "truncate":
                                yValues = this.truncate.apply(this, [yValues].concat(func.params));
                                break;
                            case "map":
                                /* jshint ignore:start */
                                var f = new Function('x', 'y', func.params[0]);
                                yValues = lodash_1.default.map(lodash_1.default.zip(this.getXValues(), yValues), function (a) { return f(a[0], a[1]); });
                                /* jshint ignore:end */
                                break;
                            case "runningAvg":
                                yValues = this.runningAvg(yValues, func.params[0], func.params[1]);
                                break;
                            case "cumSum":
                                yValues = this.cumSum(yValues);
                                break;
                        }
                    }, this));
                    return yValues;
                };
                WfSeries.prototype.getFactor = function (per) {
                    switch (per) {
                        case "MilliSecond":
                            return 1;
                        case "Second":
                            return this.getFactor("MilliSecond") * 1000;
                        case "Minute":
                            return this.getFactor("Second") * 60;
                        case "Hour":
                            return this.getFactor("Minute") * 60;
                        case "Day":
                            return this.getFactor("Hour") * 24;
                        case "Week":
                            return this.getFactor("Day") * 7;
                    }
                };
                WfSeries.prototype.cumSum = function (yValues) {
                    var new_array = yValues.concat(); //Copy initial array
                    for (var i = 1; i < new_array.length; i++) {
                        new_array[i] = new_array[i - 1] + new_array[i];
                    }
                    return new_array;
                };
                WfSeries.prototype.rate = function (yValues, per) {
                    var factor = this.getFactor(per) / 1000;
                    return lodash_1.default.map(yValues, lodash_1.default.bind(function (v) {
                        return v * factor / this.granularity;
                    }, this));
                };
                WfSeries.prototype.truncate = function (yValues, minValue, maxValue, to) {
                    return lodash_1.default.map(yValues, function (v) {
                        if (v == null) {
                            return null;
                        }
                        else if (to === "null") {
                            return v > maxValue ? null : v < minValue ? null : v;
                        }
                        else {
                            return Math.min(Math.max(v, minValue), maxValue);
                        }
                    });
                };
                WfSeries.prototype.getXValues = function () {
                    var timeShift = this.getTimeShiftParams().timeShift;
                    // We UNDO the timeshift so it will result on the same window
                    return lodash_1.default.map(this.dataPoints, function (p) { return new Date(p.time).getTime() - timeShift; });
                };
                WfSeries.prototype.cdf = function (x, g) {
                    if (g <= 20) {
                        if (x >= 45) {
                            return 1;
                        }
                        return this.poissonCdf(x, g);
                    }
                    else {
                        return this.normalCdf(x, g, g);
                    }
                };
                WfSeries.prototype.erf = function (x) {
                    // save the sign of x
                    var sign = (x >= 0) ? 1 : -1;
                    x = Math.abs(x);
                    // constants
                    var a1 = 0.254829592;
                    var a2 = -0.284496736;
                    var a3 = 1.421413741;
                    var a4 = -1.453152027;
                    var a5 = 1.061405429;
                    var p = 0.3275911;
                    // A&S formula 7.1.26
                    var t = 1.0 / (1.0 + p * x);
                    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
                    return sign * y; // erf(-x) = -erf(x);
                };
                WfSeries.prototype.normalCdf = function (x, mean, variance) {
                    return 0.5 * (1 + this.erf((x - mean) / (Math.sqrt(2 * variance))));
                };
                WfSeries.prototype.poissonCdf = function (x, g) {
                    var s = 0;
                    for (var i = 0; i <= Math.floor(x); i++) {
                        var k = 1;
                        for (var j = 1; j <= i; j++) {
                            k *= g / j;
                        }
                        s += k;
                    }
                    return s * Math.pow(Math.E, -g);
                };
                WfSeries.prototype.applyRelativeFunction = function (func, yValues, allSeries) {
                    if (!func) {
                        return yValues;
                    } // Trivial case
                    // We assume the first parameter is the series id
                    // Calculate the Y values of the related series at the locations of this series
                    var combineFunc = this.getRelativeCombiner(func);
                    var relatedSeries = lodash_1.default.map(func.params, lodash_1.default.bind(function (s) {
                        return this.createRelatedYValues(s, allSeries, combineFunc.aggregate);
                    }, this));
                    return lodash_1.default.map(lodash_1.default.zip.apply(this, [yValues].concat(relatedSeries)), lodash_1.default.bind(function (arr) { return combineFunc.f.apply(this, arr); }, this));
                };
                WfSeries.prototype.createRelatedYValues = function (id, allSeries, aggregate) {
                    var matches = lodash_1.default.filter(allSeries, lodash_1.default.bind(function (s) { return s !== this && s.params.seriesId === id; }, this));
                    if (!aggregate && matches.length > 1) {
                        // If there is more than one data series on that logical series, then we need to match by alias as well
                        matches = lodash_1.default.filter(matches, lodash_1.default.bind(function (s) {
                            return s.getAlias() === this.getAlias();
                        }, this));
                    }
                    // Interpolate the other series to match the X values of this one.
                    var thisX = this.getXValues();
                    if (matches.length === 0) {
                        // Return an array of undefined
                        return Array.apply(null, new Array(thisX.length));
                    }
                    var values = lodash_1.default.map(matches, function (m) {
                        var otherX = m.getXValues();
                        if (otherX.length === 0) {
                            return Array.apply(null, new Array(thisX.length)).map(Number.prototype.valueOf, 0);
                        }
                        var otherY = m.getYValues(allSeries);
                        if (otherX.length === 1) {
                            return Array.apply(null, new Array(thisX.length)).map(Number.prototype.valueOf, otherY[0]);
                        }
                        return everpolate_1.default.linear(thisX, otherX, otherY);
                    });
                    if (values.length > 1) {
                        return lodash_1.default.zip.apply(null, values);
                    }
                    else {
                        return values[0];
                    }
                };
                WfSeries.prototype.getAnnotations = function () {
                    var list = [];
                    var self = this;
                    lodash_1.default.each(this.seriesList, function (series) {
                        var titleCol = null;
                        var timeCol = null;
                        var tagsCol = null;
                        var textCol = null;
                        lodash_1.default.each(series.columns, function (column, index) {
                            if (column === 'time') {
                                timeCol = index;
                                return;
                            }
                            if (column === 'sequence_number') {
                                return;
                            }
                            if (!titleCol) {
                                titleCol = index;
                            }
                            if (column === this.annotation.titleColumn) {
                                titleCol = index;
                                return;
                            }
                            if (column === this.annotation.tagsColumn) {
                                tagsCol = index;
                                return;
                            }
                            if (column === this.annotation.textColumn) {
                                textCol = index;
                                return;
                            }
                        });
                        lodash_1.default.each(series.points, function (point) {
                            var data = {
                                annotation: this.annotation,
                                time: point[timeCol],
                                title: point[titleCol],
                                tags: point[tagsCol],
                                text: point[textCol]
                            };
                            if (tagsCol) {
                                data.tags = point[tagsCol];
                            }
                            list.push(data);
                        });
                    });
                    return list;
                };
                WfSeries.prototype.createNameForSeries = function (seriesName, groupByColValue) {
                    var regex = /\$(\w+)/g;
                    var segments = seriesName.split('.');
                    return this.alias.replace(regex, function (match, group) {
                        if (group === 's') {
                            return seriesName;
                        }
                        else if (group === 'g') {
                            return groupByColValue;
                        }
                        var index = parseInt(group);
                        if (lodash_1.default.isNumber(index) && index < segments.length) {
                            return segments[index];
                        }
                        return match;
                    });
                };
                return WfSeries;
            })();
            exports_1("default",WfSeries);
        }
    }
});
//# sourceMappingURL=wf_series.js.map