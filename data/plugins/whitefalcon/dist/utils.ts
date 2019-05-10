import _ from 'lodash';

class Utils {
    constructor() { }
    objectToKey(o) {
        var r = {};
        _.forEach(_.keys(o).sort(), function (k) { r[k] = o[k]; });
        return JSON.stringify(r);
    }
    objectHash(o) {
        return JSON.stringify(o);
    }
    getUrlParams() {
        var qd = {};
        location.search.substr(1).split("&")
            .forEach(function (item) {
                var s = item.split("="), k = s[0], v = s[1]
                    && decodeURIComponent(s[1]); (k in qd) ? qd[k].push(v) : qd[k] = [v];
            });
        return qd;
    }
}

export default Utils;