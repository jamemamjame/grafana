import _ from 'lodash';

import FuncInstance from './func_instance';
class WfFunc {
    constructor() {
        this.addFuncDef({
            name: "count",
            category: this.categories.Data,
            postCalc: "count"
        });
        this.addFuncDef({
            name: "countDistinct",
            shortName: 'countDistinct',
            category: this.categories.Data,
            postCalc: "countDistinct"
        });
        this.addFuncDef({
            name: "sum",
            category: this.categories.Data,
            postCalc: "sum"
        });
        this.addFuncDef({
            name: "percentile",
            shortName: 'percentile',
            category: this.categories.Data,
            postCalc: "percentile",
            params: [
                { name: "percentile", type: "string" }
            ]
        });
        this.addFuncDef({
            name: "rate",
            shortName: 'rate',
            category: this.categories.Transform,
            params: [
                { name: "per", type: "select", options: ["MilliSecond", "Second", "Minute", "Hour", "Day", "Week"] }
            ]
        });
        this.addFuncDef({
            name: "truncate",
            shortName: 'truncate',
            category: this.categories.Transform,
            params: [
                { name: "minValue", type: "int" },
                { name: "maxValue", type: "string" },
                { name: "truncateTo", type: "select", options: ["null", "limit"] }
            ],
            defaultParams: [-10000, 10000, "limit"]
        });
        this.addFuncDef({
            name: "map",
            shortName: 'map',
            category: this.categories.Transform,
            params: [
                { name: "body", type: "string" }
            ],
            defaultParams: ["return x * y"]
        });
        this.addFuncDef({
            name: "withoutLast",
            shortName: 'withoutLast',
            category: this.categories.Transform
        });
        this.addFuncDef({
            name: "derivative",
            shortName: 'derivative',
            category: this.categories.Transform,
            params: [
                { name: "per", type: "select", options: ["MilliSecond", "Second", "Minute", "Hour", "Day", "Week"] }
            ]
        });
        this.addFuncDef({
            name: "average",
            shortName: 'avg',
            category: this.categories.Data,
            params: [
                { name: "minCount", type: "int", optional: true }
            ],
            defaultParams: [0],
            postCalc: "avg"
        });
        this.addFuncDef({
            name: "custom",
            shortName: 'custom',
            category: this.categories.Data,
            params: [
                { name: "function", type: "string" }
            ],
            defaultParams: ["return o.sum / o.count;"],
            postCalc: "custom"
        });
        this.addFuncDef({
            name: 'dataCenter',
            shortName: 'dc',
            category: this.categories.Filter,
            params: [
                { name: "dc", type: "csv", options: ['HK', 'SG', 'AM', 'SH', 'AS'] }
            ],
            defaultParams: ["AM,AS,HK,SG,SH"],
            tagFilter: true
        });
        this.addFuncDef({
            name: 'tag',
            shortName: 'tag',
            category: this.categories.Filter,
            params: [
                { name: "name", type: "string", options: '_tags_' },
                { name: "values", type: "csv", options: '_tagvalues_' }
            ],
            tagFilter: true
        });
        this.addFuncDef({
            name: 'excludeTag',
            shortName: 'excludeTag',
            category: this.categories.Filter,
            params: [
                { name: "name", type: "string", options: '_tags_' },
                { name: "values", type: "csv", options: '_tagvalues_' }
            ]
        });
        this.addFuncDef({
            name: 'granularity',
            shortName: 'granularity',
            category: this.categories.TimeGrouping,
            params: [
                { name: 'value', type: 'int' },
                { name: "type", type: "select", options: ["Seconds", "Minutes", "Hours", "Days", "Weeks"] }
            ],
            defaultParams: [60, "Seconds"]
        });
        this.addFuncDef({
            name: 'dataPoints',
            shortName: 'dataPoints',
            category: this.categories.TimeGrouping,
            params: [
                { name: 'points', type: 'int' }
            ],
            defaultParams: [200]
        });
        this.addFuncDef({
            name: "alias",
            category: this.categories.Special,
            params: [{ name: "alias", type: 'string' }],
            defaultParams: ['alias']
        });
        this.addFuncDef({
            name: "mapAlias",
            category: this.categories.Special,
            params: [{ name: "function", type: 'string' }],
            defaultParams: ["return a"]
        });
        this.addFuncDef({
            name: "aliasByTag",
            shortName: 'aliasByTag',
            category: this.categories.Special,
            params: [
                { name: "tag", type: "string", options: '_tags_' },
                { name: "aliases", type: "csv", options: [] }
            ]
        });
        this.addFuncDef({
            name: "groupBy",
            shortName: 'groupBy',
            category: this.categories.Special,
            params: [
                { name: "tag", type: "csv", options: '_tags_' }
            ]
        });
        this.addFuncDef({
            name: "asPercent",
            shortName: 'asPercent',
            category: this.categories.Calculate,
            params: [
                { name: "series", type: "select", options: this.SERIES_IDS }
            ],
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "divSeries",
            shortName: 'divSeries',
            category: this.categories.Calculate,
            params: [
                { name: "series", type: "select", options: this.SERIES_IDS }
            ],
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "diffSeries",
            shortName: 'diffSeries',
            category: this.categories.Calculate,
            params: [
                { name: "series", type: "select", options: this.SERIES_IDS }
            ],
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "sumSeries",
            shortName: 'sumSeries',
            category: this.categories.Calculate,
            params: this.manySeries,
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "poissonCdf",
            shortName: 'poissonCdf',
            category: this.categories.Calculate,
            params: [
                { name: "series", type: "select", options: this.SERIES_IDS }
            ],
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "multSeries",
            shortName: 'multSeries',
            category: this.categories.Calculate,
            params: this.manySeries,
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "maxSeries",
            shortName: 'maxSeries',
            category: this.categories.Calculate,
            params: [
                { name: "series", type: "select", options: this.SERIES_IDS }
            ],
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "avgSeries",
            shortName: 'avgSeries',
            category: this.categories.Calculate,
            params: this.manySeries,
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: "medianSeries",
            shortName: 'medianSeries',
            category: this.categories.Calculate,
            params: this.manySeries,
            defaultParams: ["A"],
            relative: true
        });
        this.addFuncDef({
            name: 'timeShift',
            shortName: 'timeShift',
            category: this.categories.Transform,
            params: [{ name: "amount", type: "int" },
            { name: "type", type: "select", options: ["Seconds", "Minutes", "Hours", "Days", "Weeks"] },
            { name: "exact", type: "select", options: ['false', 'true'] }],
            defaultParams: [-30, "Seconds", "false"]
        });
        this.addFuncDef({
            name: 'timeShiftSec',
            shortName: 'timeShiftSec',
            category: this.categories.Transform,
            params: [{ name: "amount", type: "int" }],
            defaultParams: [-30]
        });
        this.addFuncDef({
            name: 'noCache',
            shortName: 'noCache',
            category: this.categories.Special
        });
        this.addFuncDef({
            name: 'fillZeros',
            shortName: 'fillZeros',
            category: this.categories.Special
        });
        this.addFuncDef({
            name: 'runningAvg',
            shortName: 'runningAvg',
            category: this.categories.Calculate,
            params: [
                { name: 'duration', type: 'int' },
                { name: "type", type: "select", options: ["Seconds", "Minutes", "Hours", "Days", "Weeks"] }
            ],
            defaultParams: [5, "Minutes"]
        });
        this.addFuncDef({
            name: 'cumSum',
            shortName: 'cumSum',
            category: this.categories.Calculate,
            params: [],
            defaultParams: []
        });

    }
    index = [];
    categories = {
        Data: [],
        Combine: [],
        Transform: [],
        TimeGrouping: [],
        Calculate: [],
        Filter: [],
        Special: []
    };

    SERIES_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I",
        "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    manySeries = [
        { name: "series", type: "select", options: this.SERIES_IDS },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true },
        { name: "series", type: "select", options: this.SERIES_IDS, optional: true }
    ];


    addFuncDef(funcDef) {
        funcDef.params = funcDef.params || [];
        funcDef.defaultParams = funcDef.defaultParams || [];

        if (funcDef.category) {
            funcDef.category.push(funcDef);
        }
        this.index[funcDef.name] = funcDef;
        this.index[funcDef.shortName || funcDef.name] = funcDef;
    }


    createFuncInstance(funcDef, options) {
        if (_.isString(funcDef)) {
            if (!this.index[funcDef]) {
                throw { message: 'Method not found ' + name };
            }
            funcDef = this.index[funcDef];
        }
        return new FuncInstance(funcDef, options ,this);
    }

    getFuncDef(name) {
        return this.index[name];
    }

    getCategories() {
        return this.categories;
    }
}


export default WfFunc;
