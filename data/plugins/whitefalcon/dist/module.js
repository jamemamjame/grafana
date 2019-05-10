System.register(['./datasource', './query_ctrl', './config_ctrl'], function(exports_1) {
    var datasource_1, query_ctrl_1, config_ctrl_1;
    var WhitefalconAnnotationsQueryCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }],
        execute: function() {
            WhitefalconAnnotationsQueryCtrl = (function () {
                function WhitefalconAnnotationsQueryCtrl() {
                }
                WhitefalconAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
                return WhitefalconAnnotationsQueryCtrl;
            })();
            exports_1("Datasource", datasource_1.default);
            exports_1("QueryCtrl", query_ctrl_1.WhitefalconQueryCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.WhitefalconConfigCtrl);
            exports_1("AnnotationsQueryCtrl", WhitefalconAnnotationsQueryCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map