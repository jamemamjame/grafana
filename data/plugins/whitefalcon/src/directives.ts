import angular from 'angular';
let directives = function()  {
  var module = angular.module('grafana.directives');

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

export default directives;
