System.register(['lodash', 'moment', './utils'], function(exports_1) {
    var lodash_1, moment_1, utils_1;
    var WfQuery;
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
            }],
        execute: function() {
            WfQuery = (function () {
                function WfQuery(json) {
                    this.utils = new utils_1.default();
                    this._json = json;
                    this._originalStartTime = this._json.start;
                }
                WfQuery.prototype.getStartTime = function () { return moment_1.default(this._originalStartTime); };
                WfQuery.prototype.getQueryStartTime = function () { return moment_1.default(this._json.start); };
                WfQuery.prototype.getEndTime = function () { return moment_1.default(this._json.end); };
                WfQuery.prototype.getGranularity = function () { return this._json.granularity; };
                WfQuery.prototype.getTagValues = function (tag) { return this._json.tags[tag]; };
                WfQuery.prototype.getGroups = function () { return this._json.groupby; };
                WfQuery.prototype.getPercentiles = function () { return this._json.percentile; };
                WfQuery.prototype.getNoCache = function () { return this._json.noCache; };
                WfQuery.prototype.getFillZeros = function () { return this._json.fillZeros; };
                WfQuery.prototype.getCacheKey = function (url) {
                    /* For the cache key, we remove the start and end time but keep the start_time%granularity
                       This is done to ensure we can use the cache value even for slightly different time ranges, as long as we keep
                       the same grid locations.
                    */
                    var json = lodash_1.default.cloneDeep(this._json);
                    json['granularity-mod'] = this.getStartTime().unix() % this.getGranularity();
                    json['url'] = url; // Put the url in, so we are not mixing different datasources
                    json['ver'] = 0; // Place holder so we can nullify the cache by updating this version number
                    delete json['start'];
                    delete json['end'];
                    delete json['noCache'];
                    json['start-hour'] = this.getStartTime().unix() -
                        (+this.utils.objectHash(json) + this.getStartTime().unix()) % 3600;
                    return JSON.stringify(json);
                };
                WfQuery.prototype.getJson = function () {
                    var res = lodash_1.default.clone(this._json);
                    if (res.percentile) {
                        res.percentile = lodash_1.default.filter(res.percentile, function (p) { return p !== 'count'; });
                    }
                    return res;
                };
                WfQuery.prototype.addToQueryStartTimeSec = function (deltaSec) {
                    this._json.start = this.getStartTime().add(deltaSec, 's').utc().format('YYYY-MM-DDTHH:mm:ssZ');
                };
                return WfQuery;
            })();
            exports_1("default",WfQuery);
        }
    }
});
//# sourceMappingURL=wf_query.js.map