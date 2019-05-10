import _ from 'lodash';
import $ from 'jquery';

class FuncInstance {
    def: any;
    params: any;
    text: any;
    added: any;

    constructor(private funcDef, private options, private self?) {
        this.def = funcDef;
        this.params = [];

        if (options && options.withDefaultParams) {
            this.params = funcDef.defaultParams.slice(0);
        }

        this.updateText(this);
    }

    _hasMultipleParamsInString(strValue, index) {
        if (strValue.indexOf(',') === -1) {
            return false;
        }

        return this.def.params[index + 1] && this.def.params[index + 1].optional;
    }

    updateParamWithoutSelf(strValue, index) {
        // handle optional parameters
        // if string contains ',' and next param is optional, split and update both
        if (this._hasMultipleParamsInString(strValue, index)) {
            _.each(strValue.split(','), _.bind(function (partVal, idx) {
                this.updateParam(partVal.trim(), idx, this);
            }, this));
            return;
        }

        if (strValue === '' && this.def.params[index].optional) {
            this.params.splice(index, 1);
        } else {
            this.params[index] = strValue;
        }

        this.updateText(this);
    }

    updateParam(strValue, index, self?) {
        // handle optional parameters
        // if string contains ',' and next param is optional, split and update both
        if (this._hasMultipleParamsInString(strValue, index)) {
            _.each(strValue.split(','), _.bind(function (partVal, idx) {
                this.updateParam(partVal.trim(), idx);
            }, this));
            return;
        }

        if (strValue === '' && this.def.params[index].optional) {
            this.params.splice(index, 1);
        } else {
            this.params[index] = strValue;
        }

        self.updateText(self);
    }

    updateText(self) {
        if (self.params.length === 0) {
            self.text = self.def.name + '()';
            return;
        }

        var text = self.def.name + '(';
        text += self.params.join(', ');
        text += ')';
        self.text = text;
    }

    render(metricExp) {
        var str = this.def.name + '(';
        var parameters = _.map(this.params, _.bind(function (value, index) {
            var paramType = this.def.params[index].type;
            if (paramType === 'int' || paramType === 'value_or_series' || paramType === 'boolean') {
                return value;
            } else if (paramType === 'int_or_interval' && $.isNumeric(value)) {
                return value;
            }
            return "'" + value + "'";
        }, this));
        if (metricExp) {
            parameters.unshift(metricExp);
        }
        return str + parameters.join(', ') + ')';
    }
}

export default FuncInstance;
