System.register(["lodash"], function (exports_1, context_1) {
    "use strict";
    var lodash_1, TemplateSrvStub;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }
        ],
        execute: function () {
            TemplateSrvStub = /** @class */ (function () {
                function TemplateSrvStub() {
                    this.variables = [];
                    this.templateSettings = { interpolate: /\[\[([\s\S]+?)\]\]/g };
                    this.data = {};
                }
                TemplateSrvStub.prototype.replace = function (text) {
                    return lodash_1.default.template(text, this.templateSettings)(this.data);
                };
                TemplateSrvStub.prototype.getAdhocFilters = function () {
                    return [];
                };
                TemplateSrvStub.prototype.variableExists = function () {
                    return false;
                };
                TemplateSrvStub.prototype.highlightVariablesAsHtml = function (str) {
                    return str;
                };
                TemplateSrvStub.prototype.setGrafanaVariable = function (name, value) {
                    this.data[name] = value;
                };
                TemplateSrvStub.prototype.init = function () { };
                TemplateSrvStub.prototype.fillVariableValuesForUrl = function () { };
                TemplateSrvStub.prototype.updateTemplateData = function () { };
                return TemplateSrvStub;
            }());
            exports_1("default", TemplateSrvStub);
        }
    };
});
//# sourceMappingURL=template_srv_stub.js.map