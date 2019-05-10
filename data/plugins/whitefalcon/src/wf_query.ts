import _ from 'lodash';
import moment from 'moment';
import Utils from './utils';

class WfQuery  {
    _json: any;
    _originalStartTime: any;
    utils  = new Utils();
    getStartTime(): any{ return moment(this._originalStartTime);}
    getQueryStartTime() { return moment(this._json.start); }
    getEndTime() { return moment(this._json.end);}
    getGranularity(){ return this._json.granularity; }
    getTagValues (tag) { return this._json.tags[tag]; }
    getGroups () { return this._json.groupby; }
    getPercentiles () { return this._json.percentile; }
    getNoCache () { return this._json.noCache; }
    getFillZeros() { return this._json.fillZeros; }
    getCacheKey (url) {
        /* For the cache key, we remove the start and end time but keep the start_time%granularity
           This is done to ensure we can use the cache value even for slightly different time ranges, as long as we keep
           the same grid locations.
        */
        var json = _.cloneDeep(this._json);
        json['granularity-mod'] = this.getStartTime().unix() % this.getGranularity();
        json['url'] = url; // Put the url in, so we are not mixing different datasources
        json['ver'] = 0; // Place holder so we can nullify the cache by updating this version number
        delete json['start'];
        delete json['end'];
        delete json['noCache'];
        json['start-hour'] = this.getStartTime().unix() -
                    ( +this.utils.objectHash(json)+this.getStartTime().unix()) % 3600;

        return JSON.stringify(json);
    }
    getJson() {
        var res = _.clone(this._json);
        if (res.percentile) {
            res.percentile = _.filter(res.percentile, function (p) { return p !== 'count'; });
        }
        return res;
    }

    addToQueryStartTimeSec(deltaSec) {
        this._json.start = this.getStartTime().add(deltaSec, 's').utc().format('YYYY-MM-DDTHH:mm:ssZ');
    }

    constructor (json){
    this._json = json;
    this._originalStartTime = this._json.start;
    }
}
export default WfQuery;
