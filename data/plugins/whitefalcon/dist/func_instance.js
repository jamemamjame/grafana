System.register(['lodash', 'jquery'], function(exports_1) {
    var lodash_1, jquery_1;
    var FuncInstance;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            }],
        execute: function() {
            FuncInstance = (function () {
                function FuncInstance(funcDef, options, self) {
                    this.funcDef = funcDef;
                    this.options = options;
                    this.self = self;
                    this.def = funcDef;
                    this.params = [];
                    if (options && options.withDefaultParams) {
                        this.params = funcDef.defaultParams.slice(0);
                    }
                    this.updateText(this);
                }
                FuncInstance.prototype._hasMultipleParamsInString = function (strValue, index) {
                    if (strValue.indexOf(',') === -1) {
                        return false;
                    }
                    return this.def.params[index + 1] && this.def.params[index + 1].optional;
                };
                FuncInstance.prototype.updateParamWithoutSelf = function (strValue, index) {
                    // handle optional parameters
                    // if string contains ',' and next param is optional, split and update both
                    if (this._hasMultipleParamsInString(strValue, index)) {
                        lodash_1.default.each(strValue.split(','), lodash_1.default.bind(function (partVal, idx) {
                            this.updateParam(partVal.trim(), idx, this);
                        }, this));
                        return;
                    }
                    if (strValue === '' && this.def.params[index].optional) {
                        this.params.splice(index, 1);
                    }
                    else {
                        this.params[index] = strValue;
                    }
                    this.updateText(this);
                };
                FuncInstance.prototype.updateParam = function (strValue, index, self) {
                    // handle optional parameters
                    // if string contains ',' and next param is optional, split and update both
                    if (this._hasMultipleParamsInString(strValue, index)) {
                        lodash_1.default.each(strValue.split(','), lodash_1.default.bind(function (partVal, idx) {
                            this.updateParam(partVal.trim(), idx);
                        }, this));
                        return;
                    }
                    if (strValue === '' && this.def.params[index].optional) {
                        this.params.splice(index, 1);
                    }
                    else {
                        this.params[index] = strValue;
                    }
                    self.updateText(self);
                };
                FuncInstance.prototype.updateText = function (self) {
                    if (self.params.length === 0) {
                        self.text = self.def.name + '()';
                        return;
                    }
                    var text = self.def.name + '(';
                    text += self.params.join(', ');
                    text += ')';
                    self.text = text;
                };
                FuncInstance.prototype.render = function (metricExp) {
                    var str = this.def.name + '(';
                    var parameters = lodash_1.default.map(this.params, lodash_1.default.bind(function (value, index) {
                        var paramType = this.def.params[index].type;
                        if (paramType === 'int' || paramType === 'value_or_series' || paramType === 'boolean') {
                            return value;
                        }
                        else if (paramType === 'int_or_interval' && jquery_1.default.isNumeric(value)) {
                            return value;
                        }
                        return "'" + value + "'";
                    }, this));
                    if (metricExp) {
                        parameters.unshift(metricExp);
                    }
                    return str + parameters.join(', ') + ')';
                };
                return FuncInstance;
            })();
            exports_1("default",FuncInstance);
        }
    }
});
//# sourceMappingURL=func_instance.js.map