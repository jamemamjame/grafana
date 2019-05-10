System.register(["../lib/common", "app/core/utils/datemath"], function (exports_1, context_1) {
    "use strict";
    var common_1, datemath_1, TimeSrvStub;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (datemath_1_1) {
                datemath_1 = datemath_1_1;
            }
        ],
        execute: function () {
            TimeSrvStub = /** @class */ (function () {
                function TimeSrvStub() {
                    this.init = common_1.sinon.spy();
                    this.time = { from: 'now-1h', to: 'now' };
                }
                TimeSrvStub.prototype.timeRange = function (parse) {
                    if (parse === false) {
                        return this.time;
                    }
                    return {
                        from: datemath_1.default.parse(this.time.from, false),
                        to: datemath_1.default.parse(this.time.to, true)
                    };
                };
                TimeSrvStub.prototype.replace = function (target) {
                    return target;
                };
                TimeSrvStub.prototype.setTime = function (time) {
                    this.time = time;
                };
                return TimeSrvStub;
            }());
            exports_1("default", TimeSrvStub);
        }
    };
});
//# sourceMappingURL=time_srv_stub.js.map