System.register(['angular'], function(exports_1) {
    var angular_1;
    var directives;
    return {
        setters:[
            function (angular_1_1) {
                angular_1 = angular_1_1;
            }],
        execute: function() {
            directives = function () {
                var module = angular_1.default.module('grafana.directives');
                this.module.directive('metricQueryEditorWhitefalcon', function () {
                    return { controller: 'WhitefalconQueryCtrl', templateUrl: 'app/plugins/datasource/whitefalcon/partials/query.editor.html' };
                });
                this.module.directive('metricQueryOptionsWhitefalcon', function () {
                    return { templateUrl: 'app/plugins/datasource/whitefalcon/partials/query.options.html' };
                });
                this.module.directive('annotationsQueryEditorWhitefalcon', function () {
                    return { templateUrl: 'app/plugins/datasource/whitefalcon/partials/annotations.editor.html' };
                });
            };
            exports_1("default",directives);
        }
    }
});
//# sourceMappingURL=directives.js.map