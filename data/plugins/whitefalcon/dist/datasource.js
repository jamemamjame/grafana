///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', 'moment', './parser', './wf_func', './wf_series', './query_builder', './cache', './query_ctrl', './func_editor', './add_whitefalcon_func', './lexer'], function(exports_1) {
    var lodash_1, moment_1, parser_1, wf_func_1, wf_series_1, query_builder_1, cache_1, lexer_1;
    var WhiteFalconDatasource;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (moment_1_1) {
                moment_1 = moment_1_1;
            },
            function (parser_1_1) {
                parser_1 = parser_1_1;
            },
            function (wf_func_1_1) {
                wf_func_1 = wf_func_1_1;
            },
            function (wf_series_1_1) {
                wf_series_1 = wf_series_1_1;
            },
            function (query_builder_1_1) {
                query_builder_1 = query_builder_1_1;
            },
            function (cache_1_1) {
                cache_1 = cache_1_1;
            },
            function (_1) {},
            function (_2) {},
            function (_3) {},
            function (lexer_1_1) {
                lexer_1 = lexer_1_1;
            }],
        execute: function() {
            // import LRUCache from 'lru-cache'
            WhiteFalconDatasource = (function () {
                // mycache = new LRUCache(10)
                function WhiteFalconDatasource(instanceSettings, templateSrv, $q, $http) {
                    this.instanceSettings = instanceSettings;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.$http = $http;
                    /** @ngInject */
                    this.deferredMap = {};
                    this.functions = [];
                    this.cache = new cache_1.default();
                    this.wfFunc = new wf_func_1.default();
                    this.urls = lodash_1.default.map(this.instanceSettings.url.split(','), function (url) {
                        return url.trim();
                    });
                    this.queryStats = {
                        totalQueries: 0,
                        outboundQueries: 0,
                        fullyCached: 0,
                        toString: function () {
                            return "QueryStats - TotalQueries: " + this.totalQueries +
                                " OutBound: " + this.outboundQueries + " fully cached: " + this.fullyCached;
                        }
                    };
                    console.log("[TEST] datasource.constructor()");
                    this.instanceSettings = instanceSettings;
                    this.id = instanceSettings.id;
                    this.name = instanceSettings.name;
                    this.isV2 = this.urls[0].indexOf('/v2') >= 0;
                }
                /**
                 * Query all metric name for show in dropdown list of panel-edit mode
                 * @param query
                 * @param from
                 * @param to
                 */
                WhiteFalconDatasource.prototype.queryMetric = function (query, from, to) {
                    console.log("[TEST] datasource.queryMetric()");
                    query = this.templateSrv.replace(query).replace('{', '').replace('}', '');
                    var options = {
                        url: this.urls[0] + '/rest/discovery/metrics',
                        method: "POST",
                        data: {
                            query: query,
                            from: from,
                            to: to
                        },
                        timeout: 30 * 1000,
                        headers: { "Content-Type": "application/json" }
                    };
                    return this.httpWithCache(options);
                };
                WhiteFalconDatasource.prototype.retry = function (deferred, callback, delay, retries) {
                    console.log("[TEST] datasource.retry()");
                    return callback().then(undefined, function (reason) {
                        var errorMessage = "Reason is unknown.";
                        if (reason.data) {
                            if (reason.data.errorMessage) {
                                errorMessage = reason.data.errorMessage;
                            }
                            else {
                                errorMessage = reason.data;
                            }
                        }
                        var message = 'WhitefalconDB Error (status=' + reason.status + '): ' + errorMessage;
                        if (retries > 1) {
                            reason.message = message;
                            deferred.reject(reason);
                        }
                        else {
                            console.log(message);
                            setTimeout(function () {
                                return this.retry(deferred, callback, Math.min(delay * 2, 30000), (retries || 0) + 1);
                            }, delay);
                        }
                    });
                };
                WhiteFalconDatasource.prototype.fixGranularity = function (dataset) {
                    console.log("[TEST] datasource.fixGranularity()");
                    // Currently WF is returning the requested granularity, where in fact it might be much higher
                    // since we don't keep it so tight, but we don't know exactly what the store holds so we have some heuristics
                    function getGran(ds) {
                        var datapoints = (ds || {}).datapoints || (ds || {}).dataPoints || [];
                        return (lodash_1.default.min(lodash_1.default.map(lodash_1.default.filter(lodash_1.default.zip(datapoints, datapoints.slice(1)), function (a) { return a[0] != null && a[1] != null; }), function (a) {
                            return new Date(a[1].time).getTime() - new Date(a[0].time).getTime();
                        })) || Infinity) / 1000;
                    }
                    var actualGran;
                    if (!this.isV2) {
                        actualGran = getGran(dataset);
                    }
                    else {
                        actualGran = lodash_1.default.min(lodash_1.default.map(dataset.datasets, function (ds) { return getGran(ds); })) || Infinity;
                    }
                    // Only take less than 60 if we actually see it, otherwise take the requested granularity
                    dataset.granularity = Math.max(Math.min(actualGran, 60), dataset.granularity);
                    return dataset;
                };
                WhiteFalconDatasource.prototype._wfRequest = function (allQueries) {
                    console.log("[TEST] datasource._wfRequest()");
                    var self = this;
                    // check if we have duplicate queries that can be reduced from sending
                    //var invertedQueries = _.invert(_.mapValues(queries,  function(q) { return JSON.stringify(q.getJson()); })
                    var groups = lodash_1.default.mapKeys(lodash_1.default.groupBy(lodash_1.default.toPairs(allQueries), // convert to (key,val) paies
                    function (arr) { return JSON.stringify(arr[1].getJson()); } // group by the json string of the query to have similar queries together
                     // group by the json string of the query to have similar queries together
                    ), function (arr) { return arr[0][0]; }); // take the first key of the first item in each group as group key
                    var queries = lodash_1.default.mapValues(groups, // take the first query from each group
                    function (arr) { return arr[0][1]; });
                    var keyMap = lodash_1.default.fromPairs(lodash_1.default.flatten(lodash_1.default.values(lodash_1.default.mapValues(groups, // take the first query from each group
                    function (arr, k) {
                        return lodash_1.default.map(arr, function (a) { return [a[0], k]; });
                    } // for each group we tuple the group key with the query key
                     // for each group we tuple the group key with the query key
                    ))));
                    var data = {
                        requests: lodash_1.default.mapValues(queries, function (q) { return lodash_1.default.merge(q.getJson(), (this.debug) ? { internal: { debug: true } } : {}); })
                    };
                    var inflate = function (datasets) {
                        return lodash_1.default.mapValues(keyMap, function (k, kc) { return (k !== kc) ? lodash_1.default.cloneDeep(datasets[k]) : datasets[k]; });
                    };
                    // We are caching queries that are live so we don't retry the exact same query while it's actually running
                    var key = JSON.stringify(data);
                    var deferred = this.deferredMap[key];
                    if (deferred) {
                        return deferred.promise.then(inflate);
                    }
                    if (lodash_1.default.size(this.deferredMap) > 100) {
                        console.log("Defer map is bigger than 100 -> " + lodash_1.default.size(this.deferredMap));
                    }
                    this.queryStats.outboundQueries += lodash_1.default.size(queries);
                    deferred = this.$q.defer();
                    this.deferredMap[key] = deferred;
                    deferred.promise.finally(function () { delete self.deferredMap[key]; }); // Remove from map when finished so user can retry to get fresh data
                    this.retry(deferred, function () {
                        var currentUrl = self.urls[0];
                        var options = {
                            url: currentUrl + '/rest/measurements/getsets',
                            method: "POST",
                            data: data,
                            timeout: 30 * 1000
                        };
                        options.headers = options.headers || { "Content-Type": "application/json" };
                        return self.$http(options).then(function (r) {
                            deferred.resolve(r.data.datasets || r.data.dataSets || {});
                        });
                    }, 1000);
                    return deferred.promise.then(inflate);
                };
                WhiteFalconDatasource.prototype.handleWfQueryResponseV2 = function (seriesParams, scopedVars, datasets, _this) {
                    console.log("[TEST] datasource.handleWfQueryResponseV2()");
                    var self = this;
                    var series = lodash_1.default.flatten(lodash_1.default.flatten(lodash_1.default.map(datasets, function (ds, k) {
                        if (!ds) {
                            return [];
                        }
                        return lodash_1.default.map(ds.datasets, function (groupData) {
                            if (seriesParams[k].percentiles) {
                                return lodash_1.default.map(seriesParams[k].percentiles, function (p) {
                                    return new wf_series_1.default(groupData.datapoints, seriesParams[k], _this.templateSrv, scopedVars, ds.granularity, groupData.group, p);
                                });
                            }
                            else {
                                return new wf_series_1.default(groupData.datapoints, seriesParams[k], _this.templateSrv, scopedVars, ds.granularity, groupData.group);
                            }
                        });
                    })));
                    // We should be able to join by key
                    return {
                        data: lodash_1.default.filter(lodash_1.default.map(lodash_1.default.filter(lodash_1.default.sortBy(series, function (s) { return s.getAlias(); }), function (s) { return s.show(); }), function (s) { return s.getTimeSeries(series); }), function (s) { return s.datapoints.length > 0; })
                    };
                };
                WhiteFalconDatasource.prototype.handleWfQueryResponse = function (seriesParams, scopedVars, datasets) {
                    console.log("[TEST] datasource.handleWfQueryResponseV2()");
                    var self = this;
                    var series = lodash_1.default.map(datasets, function (ds, k) {
                        return new wf_series_1.default(ds.dataPoints, seriesParams[k], self.templateSrv, scopedVars, ds.granularity);
                    });
                    // We should be able to join by key
                    return {
                        data: lodash_1.default.filter(lodash_1.default.map(lodash_1.default.filter(series, function (s) { return s.show(); }), function (s) { return s.getTimeSeries(series); }), function (s) { return s.datapoints.length > 0; })
                    };
                };
                WhiteFalconDatasource.prototype.parseRecursive = function (astNode, func, index) {
                    console.log("[TEST] datasource.handleWfQueryResponseV2()");
                    var self = this;
                    if (astNode === null) {
                        return null;
                    }
                    switch (astNode.type) {
                        case 'metric':
                            this.metric = this.templateSrv.replace(lodash_1.default.map(astNode.segments, 'value').join('.'), this.scopedVars);
                            break;
                        case 'function':
                            var innerFunc = this.wfFunc.createFuncInstance(astNode.name, { withDefaultParams: false });
                            lodash_1.default.each(astNode.params, function (param, index) {
                                self.parseRecursive(param, innerFunc, index);
                            });
                            this.functions.push(innerFunc);
                            break;
                        case 'string':
                        case 'number':
                            this.addFunctionParameter(func, astNode.value, index - 1);
                            break;
                    }
                };
                WhiteFalconDatasource.prototype.addFunctionParameter = function (func, value, index) {
                    console.log("[TEST] datasource.handleWfQueryResponseV2()");
                    if (index >= func.def.params.length) {
                        throw new Error('invalid number of parameters to method ' + func.def.name);
                    }
                    if (lodash_1.default.isString(value)) {
                        value = this.templateSrv.replace(value, this.scopedVars);
                    }
                    switch (func.def.params[index].type) {
                        case 'int':
                            value = parseFloat(value);
                            break;
                        case 'csv':
                            value = lodash_1.default.map(value.replace('{', '').replace('}', '').split(","), function (s) { return s.trim(); });
                            break;
                    }
                    func.params[index] = value;
                };
                WhiteFalconDatasource.prototype.ngOnInit = function () {
                    console.log("[TEST] datasource.ngOnInit()");
                };
                WhiteFalconDatasource.prototype.mergeWithCache = function (dataset) {
                    console.log("[TEST] datasource.mergeWithCache()");
                    return dataset;
                };
                WhiteFalconDatasource.prototype._postQueries = function (queries) {
                    console.log("[TEST] datasource._postQueries()");
                    var maximalLatency = 60 * 60; // How much time back we don't allow cache because new data might still come in?
                    var self = this;
                    var url = self.urls[0];
                    // Get the current cache values before we do the query, so we make appropriate queries
                    lodash_1.default.forEach(queries, function (q, key) {
                        if (q.getNoCache()) {
                            return;
                        }
                        // Update the start time of the query, according the cache values we have
                        return q;
                    });
                    // Only send the queries that are not completely cached
                    var neededQueries = lodash_1.default.pickBy(queries, function (q) { return q.getQueryStartTime().unix() < q.getEndTime().unix(); });
                    this.queryStats.fullyCached += lodash_1.default.size(queries) - lodash_1.default.size(neededQueries);
                    var promise;
                    if (lodash_1.default.size(neededQueries) > 0) {
                        promise = this._wfRequest(neededQueries);
                    }
                    else {
                        var d = this.$q.defer();
                        d.resolve({});
                        promise = d.promise;
                    }
                    return promise.then(function (datasets) {
                        return lodash_1.default.mapValues(queries, lodash_1.default.bind(function (q, key) {
                            var newDataset = datasets[key];
                            if (newDataset) {
                                newDataset.datasets = newDataset.datasets || [];
                            }
                            // Get the relevant cache value
                            var mergedDS = this.mergeWithCache(newDataset);
                            var fixedDS = this.fixGranularity(mergedDS);
                            var filledDS = this.fillGaps(fixedDS, q);
                            // Fill the cache
                            // Mark the valid time as the maximum time in this data that we are pretty sure is not going to change any more
                            // so that is one bucket (granularity) back from now + some latency consideration
                            var endTime = Math.min(q.getEndTime().unix(), moment_1.default().subtract(q.getGranularity() + maximalLatency, 's').unix());
                            return filledDS;
                        }, self));
                    });
                };
                WhiteFalconDatasource.prototype.fillGaps = function (dataset, query) {
                    console.log("[TEST] datasource.fillGaps()");
                    // This should not affect percentile queries
                    if (query.getPercentiles()) {
                        return dataset;
                    }
                    var self = this;
                    // Fill gaps in the query response with zero values, as WF does not return these datapoints at all
                    var granularity = dataset.granularity;
                    // To make sure we generate the zeros on the right "grid", we take one sample time from the input
                    var sampleTime = lodash_1.default.head(lodash_1.default.flatten(lodash_1.default.map((dataset.datasets || dataset), function (ds) { return ds.datapoints || ds.dataPoints; })));
                    sampleTime = sampleTime && moment_1.default(sampleTime.time).unix();
                    if (!sampleTime || !isFinite(sampleTime)) {
                        return dataset;
                    } // Can't do anything about this
                    // Take is back until we find the closest to query start time moving in full granularity steps
                    var startTime = sampleTime - Math.trunc((sampleTime - query.getStartTime().unix()) / granularity) * granularity;
                    // Take the minimum of query time and last existing timestamp for any group
                    var endTime = Math.min(query.getEndTime().unix(), query.getFillZeros() ? Infinity : (moment_1.default(lodash_1.default.reduce(lodash_1.default.map((dataset.datasets || dataset), function (ds) {
                        return lodash_1.default.reduce(lodash_1.default.map((ds.datapoints || ds.datapPoints), 'time'), function (a, b) {
                            return a > b ? a : b;
                        });
                    }), function (a, b) {
                        return a > b ? a : b;
                    })).unix() + 1));
                    var format = 'YYYY-MM-DDTHH:mm:ss';
                    // Create all the needed points
                    var timePoints = lodash_1.default.map(lodash_1.default.range(startTime, endTime, granularity), function (t) { return moment_1.default.unix(t).utc().format(format); });
                    function makePoint(t) {
                        return {
                            time: t,
                            sum: 0,
                            count: 0
                        };
                    }
                    function updateDataset(ds) {
                        var datapoints = (ds || {}).datapoints || (ds || {}).dataPoints || [];
                        // Make sure the datapoints dont have tz information
                        lodash_1.default.forEach(datapoints, function (dp) { dp.time = self.stripTz(dp.time); });
                        // key datapoints by time
                        var keyedPoints = {};
                        lodash_1.default.forEach(datapoints, function (dp) { keyedPoints[dp.time] = dp; });
                        datapoints = lodash_1.default.map(timePoints, function (t) {
                            var p = keyedPoints[t] || makePoint(t);
                            p.time += "+00:00";
                            return p;
                        });
                        if (ds.datapoints) {
                            ds.datapoints = datapoints;
                        }
                        else if (ds.dataPoints) {
                            ds.dataPoints = datapoints;
                        }
                        else {
                            throw new Error("Impossible");
                        }
                        return ds;
                    }
                    if (!self.isV2) {
                        return updateDataset(dataset);
                    }
                    dataset.datasets = lodash_1.default.map(dataset.datasets, function (ds) {
                        return updateDataset(ds);
                    }, this);
                    return dataset;
                };
                WhiteFalconDatasource.prototype._expand = function (queryBuilder, params) {
                    console.log("[TEST] datasource._expand()");
                    var wfQuery = queryBuilder.build(params);
                    params.groupby = wfQuery.getGroups();
                    params.percentiles = wfQuery.getPercentiles();
                    var func = lodash_1.default.find(params.functions, function (f) { return f.def.shortName === 'aliasByTag'; });
                    if (!func) {
                        return [params];
                    }
                    var tag = func.params[0];
                    var aliases = func.params[1];
                    var tagValues = wfQuery.getTagValues(tag);
                    if (!tagValues || tagValues.length === 0) {
                        throw new Error("Cannot alias by tag '" + tag + "' because it has no values in query");
                    }
                    return lodash_1.default.map(tagValues, function (val, ind) {
                        var newParams = lodash_1.default.clone(params);
                        var tagFunction = this.wfFunc.createFuncInstance('tag', { withDefaultParams: false });
                        tagFunction.params = [tag, [val]];
                        var aliasFunction = this.wfFunc.createFuncInstance('alias', { withDefaultParams: false });
                        aliasFunction.params = [aliases ? aliases[ind] : val];
                        newParams.functions = newParams.functions.concat([tagFunction, aliasFunction]);
                        return newParams;
                    });
                };
                WhiteFalconDatasource.prototype.httpWithCache = function (options) {
                    console.log("[TEST] datasource.httpWithCache()");
                    var key = JSON.stringify(options);
                    // var c = this.cache.get(key)
                    // console.log(c)
                    return this.$http(options).then(function (d) {
                        return d.data;
                    });
                };
                WhiteFalconDatasource.prototype.stripTz = function (s) {
                    console.log("[TEST] datasource.stripTz()");
                    return s.split('Z')[0].split('+')[0];
                };
                WhiteFalconDatasource.prototype.updateDataset = function (newds, cachedds) {
                    console.log("[TEST] datasource.updateDataset()");
                    var newDatapoints = (newds || {}).datapoints || (newds || {}).dataPoints || [];
                    var cachedDatapoints = (cachedds || {}).datapoints || (cachedds || {}).dataPoints || [];
                    var o = newds || cachedds; // The new one might not be defined for this group
                    var newDataStart = (newDatapoints.length > 0) ? this.stripTz(newDatapoints[0].time) : null;
                    // Take only the past cachedDatapoints and add the new datapoints
                    var datapoints = lodash_1.default.filter(cachedDatapoints, function (dp) {
                        var strippedTime = this.stripTz(dp.time);
                        return (newDatapoints.length === 0 || strippedTime < newDataStart) // We always prefer to use new data instead of cached
                            && strippedTime <= this.cacheValueEndString // This means we never use stale data
                            && strippedTime >= this.queryStartString;
                    }).concat(newDatapoints);
                    this.cache.hit(datapoints.length - newDatapoints.length);
                    this.cache.miss(newDatapoints.length);
                    if (o.datapoints) {
                        o.datapoints = datapoints;
                    }
                    else if (o.dataPoints) {
                        o.dataPoints = datapoints;
                    }
                    else {
                        throw new Error("Impossible");
                    }
                    return o;
                };
                WhiteFalconDatasource.prototype._parseTarget = function (scopedVars, target) {
                    console.log("[TEST] datasource._parseTarget()");
                    var hidden = target.hide;
                    var targetObj = target.target;
                    var lexer = new lexer_1.default(targetObj);
                    var parser = new parser_1.default(targetObj, lexer);
                    var astNode = parser.getAst();
                    this.functions = [];
                    if (astNode === null) {
                        return;
                    }
                    if (astNode.type === 'error') {
                        throw new Error(astNode.message + " at position: " + astNode.pos);
                    }
                    try {
                        this.parseRecursive(astNode);
                    }
                    catch (err) {
                        throw new Error('error parsing target:');
                    }
                    if (this.metric == null) {
                        throw new Error("Metric is null");
                    }
                    this.metric = this.metric.replace(/\._$/, '');
                    return {
                        functions: this.functions,
                        metric: this.metric,
                        target: targetObj,
                        hidden: hidden,
                        seriesId: target.refId
                    };
                };
                WhiteFalconDatasource.prototype.query = function (options) {
                    console.log("[TEST] datasource.query()");
                    console.log("instance query - " + options.id);
                    console.log(this.templateSrv);
                    var _this = this;
                    var targets = lodash_1.default.forEach(lodash_1.default.cloneDeep(lodash_1.default.filter(options.targets, function (t) { return t.target != null; })), function (t) {
                        t.target = _this.templateSrv.replace(t.target.replace('{', '').replace('}', ''), options.scopedVars);
                    }, this.templateSrv);
                    var queryBuilder = new query_builder_1.default(options);
                    var expand = lodash_1.default.bind(this._expand, this, queryBuilder);
                    var seriesParams = lodash_1.default.reduce(lodash_1.default.flatten(lodash_1.default.map(lodash_1.default.map(targets, lodash_1.default.bind(this._parseTarget, this, options.scopedVars)), expand)), function (r, v, i) { r[i] = v; return r; }, {});
                    var queries = lodash_1.default.mapValues(seriesParams, lodash_1.default.bind(queryBuilder.build, queryBuilder));
                    this.queryStats.totalQueries += lodash_1.default.size(queries);
                    _this = this;
                    var handler = this.isV2 ? this.handleWfQueryResponseV2 : this.handleWfQueryResponse;
                    return this._postQueries(queries).then(lodash_1.default.partial(handler, seriesParams, options.scopedVars, lodash_1.default, _this));
                };
                WhiteFalconDatasource.prototype.queryTagValues = function (query, metric, tag, from, to) {
                    console.log("[TEST] datasource.queryTagValues()");
                    query = this.templateSrv.replace(query).replace('{', '').replace('}', '');
                    metric = this.templateSrv.replace(metric).replace('{', '').replace('}', '');
                    tag = this.templateSrv.replace(tag).replace('{', '').replace('}', '');
                    var from = from || moment_1.default().subtract(6, 'hours').startOf('hour');
                    var to = to || moment_1.default().endOf('hour');
                    var options = {
                        url: this.urls[0] + '/rest/discovery/tagvalues',
                        method: "POST",
                        data: {
                            metric: metric,
                            tag: tag,
                            query: query,
                            from: from,
                            to: to
                        },
                        timeout: 30 * 1000,
                        headers: { "Content-Type": "application/json" }
                    };
                    return this.httpWithCache(options);
                };
                WhiteFalconDatasource.prototype.metricFindQuery = function (query, options, excludeSelf) {
                    console.log("[TEST] datasource.metricFindQuery()");
                    var matches = query.match(/(.*)\[(.+)\]$/); // is it a template query?
                    var from = (options && options.range) ? options.range.from : moment_1.default().subtract(6, 'hours').startOf('hour');
                    var to = (options && options.range) ? options.range.to : moment_1.default().endOf('hour');
                    if (matches != null) {
                        var metric = matches[1].trim();
                        var tag = matches[2].split(",")[0];
                        return this.queryTagValues("", metric, tag, from, to)
                            .then(function (res) { return lodash_1.default.map(res.results, function (d) { return { text: d }; }); });
                    }
                    query = this.templateSrv.replace(query).replace('{', '').replace('}', '');
                    console.log("query -> " + query);
                    if (query.indexOf(".*") < 0) {
                        return this.queryMetric(query, from, to).then(function (res) {
                            return lodash_1.default.filter(lodash_1.default.sortBy(lodash_1.default.uniqBy(lodash_1.default.map(lodash_1.default.filter(res.results, function (d) {
                                return !query.length || d[query.length] === '.'
                                    || (!excludeSelf && d.length === query.length);
                            }), function (d) {
                                if (query.length) {
                                    d = d.substring(query.length + 1);
                                } //remove search prefix
                                var dotPos = d.indexOf('.');
                                return { text: (dotPos >= 0) ? d.substring(0, dotPos) : d || '_', expandable: (dotPos >= 0) };
                            }), function (o) { return o.text + o.expandable; }), function (o) { return o.text; }), function (o) { return o.text.length; });
                        });
                    }
                    else {
                        return this.$q.when([]);
                    }
                };
                WhiteFalconDatasource.prototype.testDatasource = function () {
                    console.log("[TEST] datasource.testDatasource()");
                    // console.log(this.mycache)
                    return this.$q.when({
                        status: 'success',
                        message: 'We didn\'t do any functional test to your datasource, just save the infomation',
                    });
                };
                return WhiteFalconDatasource;
            })();
            exports_1("default", WhiteFalconDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map