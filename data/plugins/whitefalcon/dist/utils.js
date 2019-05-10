System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var Utils;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            Utils = (function () {
                function Utils() {
                }
                Utils.prototype.objectToKey = function (o) {
                    var r = {};
                    lodash_1.default.forEach(lodash_1.default.keys(o).sort(), function (k) { r[k] = o[k]; });
                    return JSON.stringify(r);
                };
                Utils.prototype.objectHash = function (o) {
                    return JSON.stringify(o);
                };
                Utils.prototype.getUrlParams = function () {
                    var qd = {};
                    location.search.substr(1).split("&")
                        .forEach(function (item) {
                        var s = item.split("="), k = s[0], v = s[1]
                            && decodeURIComponent(s[1]);
                        (k in qd) ? qd[k].push(v) : qd[k] = [v];
                    });
                    return qd;
                };
                return Utils;
            })();
            exports_1("default",Utils);
        }
    }
});
//# sourceMappingURL=utils.js.map