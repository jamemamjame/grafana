System.register(['angular', 'lodash', 'jquery', './wf_func'], function(exports_1) {
    var angular_1, lodash_1, jquery_1, wf_func_1;
    var WhitefalconAddFunc;
    return {
        setters:[
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            },
            function (wf_func_1_1) {
                wf_func_1 = wf_func_1_1;
            }],
        execute: function() {
            WhitefalconAddFunc = (function () {
                function WhitefalconAddFunc() {
                    this.wfFunc = new wf_func_1.default();
                    var self = this;
                    angular_1.default
                        .module('grafana.directives')
                        .directive('whitefalconAddFunc', function ($compile) {
                        var inputTemplate = '<input type="text"' +
                            ' class="gf-form-input"' +
                            ' spellcheck="false" style="display:none"></input>';
                        var buttonTemplate = '<a  class="gf-form-label query-part dropdown-toggle"' +
                            ' tabindex="1" gf-dropdown="functionMenu" data-toggle="dropdown">' +
                            '<i class="fa fa-plus"></i></a>';
                        return {
                            link: function ($scope, elem) {
                                var categories = self.wfFunc.getCategories();
                                var allFunctions = self.getAllFunctionNames(categories);
                                var ctrl = $scope.ctrl;
                                $scope.functionMenu = self.createFunctionDropDownMenu(categories);
                                var $input = jquery_1.default(inputTemplate);
                                var $button = jquery_1.default(buttonTemplate);
                                $input.appendTo(elem);
                                $button.appendTo(elem);
                                $input.attr('data-provide', 'typeahead');
                                $button.click(function () {
                                    $button.hide();
                                    $input.show();
                                    $input.focus();
                                });
                                $input.keyup(function () {
                                    elem.toggleClass('open', $input.val() === '');
                                });
                                $input.blur(function () {
                                    // clicking the function dropdown menu wont
                                    // work if you remove class at once
                                    setTimeout(function () {
                                        $input.val('');
                                        $input.hide();
                                        $button.show();
                                        elem.removeClass('open');
                                    }, 200);
                                });
                                $compile(elem.contents())($scope);
                            }
                        };
                    });
                }
                WhitefalconAddFunc.prototype.getAllFunctionNames = function (categories) {
                    return lodash_1.default.reduce(categories, function (list, category) {
                        lodash_1.default.each(category, function (func) {
                            list.push(func.name);
                        });
                        return list;
                    }, []);
                };
                WhitefalconAddFunc.prototype.createFunctionDropDownMenu = function (categories) {
                    return lodash_1.default.map(categories, function (list, category) {
                        return {
                            text: category,
                            submenu: lodash_1.default.map(list, function (value) {
                                return {
                                    text: value.name,
                                    click: "ctrl.addFunction('" + value.name + "')",
                                };
                            })
                        };
                    });
                };
                return WhitefalconAddFunc;
            })();
            exports_1("default",WhitefalconAddFunc);
        }
    }
});
//# sourceMappingURL=add_whitefalcon_func.js.map