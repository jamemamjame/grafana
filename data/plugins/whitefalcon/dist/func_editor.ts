import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';

class WhitefalconFuncEditor {
    constructor() {
        angular
            .module('grafana.directives')
            .directive('whitefalconFuncEditor', function ($compile, templateSrv) {

                var funcSpanTemplate = '<a ng-click="">{{func.def.name}}</a><span>(</span>';
                var paramTemplate = '<input type="text" style="display:none"' +
                    ' class="input-mini tight-form-func-param"></input>';

                var funcControlsTemplate =
                    '<div class="tight-form-func-controls">' +
                    '<span class="pointer fa fa-arrow-left"></span>' +
                    '<span class="pointer fa fa-question-circle"></span>' +
                    '<span class="pointer fa fa-remove" ></span>' +
                    '<span class="pointer fa fa-arrow-right"></span>' +
                    '</div>';

                return {
                    restrict: 'A',
                    link: function postLink($scope, elem) {
                        var $funcLink = $(funcSpanTemplate);
                        var $funcControls = $(funcControlsTemplate);
                        var ctrl = $scope.ctrl;
                        var func = $scope.func;
                        var funcDef = func.def;
                        var scheduledRelink = false;
                        var paramCountAtLink = 0;

                        function clickFuncParam(paramIndex) {
                            /*jshint validthis:true */

                            var $link = $(this);
                            var $input = $link.next();

                            $input.val(func.params[paramIndex]);
                            $input.css('width', ($link.width() + 16) + 'px');

                            $link.hide();
                            $input.show();
                            $input.focus();
                            $input.select();

                            var typeahead = $input.data('typeahead');
                            if (typeahead) {
                                $input.val('');
                                typeahead.lookup();
                            }
                        }

                        function scheduledRelinkIfNeeded() {
                            if (paramCountAtLink === func.params.length) {
                                return;
                            }

                            if (!scheduledRelink) {
                                scheduledRelink = true;
                                setTimeout(function () {
                                    relink();
                                    scheduledRelink = false;
                                }, 200);
                            }
                        }

                        function inputBlur(paramIndex) {
                            /*jshint validthis:true */
                            var $input = $(this);
                            var $link = $input.prev();
                            var newValue = $input.val();

                            if (newValue !== '' || func.def.params[paramIndex].optional) {
                                $link.html(templateSrv.highlightVariablesAsHtml(newValue));

                                func.updateParamWithoutSelf($input.val(), paramIndex);
                                scheduledRelinkIfNeeded();

                                $scope.$apply(function () {
                                    ctrl.targetChanged();
                                });
                            }
                            $input.hide();
                            $link.show();

                        }

                        function inputBlurNoLink(paramIndex) {
                            /*jshint validthis:true */
                            var $input = $(this);
                            var newValue = $input.val();

                            if (newValue !== '' || func.def.params[paramIndex].optional) {
                                func.updateParam($input.val(), paramIndex);
                                scheduledRelinkIfNeeded();

                                $scope.$apply(function () {
                                    ctrl.targetChanged();
                                });
                            }
                        }

                        function inputKeyPress(paramIndex, e) {
                            /*jshint validthis:true */
                            if (e.which === 13) {
                                inputBlur.call(this, paramIndex);
                            }
                        }

                        function inputKeyDown() {
                            /*jshint validthis:true */
                            this.style.width = (3 + this.value.length) * 8 + 'px';
                        }

                        function addTypeahead($input, paramIndex) {
                            $input.attr('data-provide', 'typeahead');

                            var options = funcDef.params[paramIndex].options;
                            if (funcDef.params[paramIndex].type === 'int') {
                                options = _.map(options, function (val) { return val.toString(); });
                            }
                            if (options === "_tags_") {
                                options = function (query, process) {
                                    ctrl.datasource.queryTags(query, ctrl.getSegmentPathUpTo())
                                        .then(function (r) {
                                            // add template variables
                                            var tvars = _.map(templateSrv.variables, function (v) { return '$' + v.name; });
                                            process(tvars.concat(r.results));
                                        });
                                };
                            }
                            $input.typeahead({
                                source: options,
                                minLength: 0,
                                items: 10000,
                                updater: function (value) {
                                    setTimeout(function () {
                                        inputBlur.call($input[0], paramIndex);
                                    }, 0);
                                    return value;
                                }
                            });

                            //var typeahead = $input.data('typeahead');
                            //typeahead.lookup = function () {
                            //  this.query = this.$element.val() || '';
                            //  return this.process(this.source);
                            //};
                        }
                        function addTags($input, paramIndex) {
                            //$input.attr('data-provide', 'typeahead');

                            var options = funcDef.params[paramIndex].options;
                            if (options === "_tagvalues_") {
                                options = function (query, process) {
                                    return ctrl.datasource.queryTagValues(query, ctrl.getSegmentPathUpTo(), func.params[0])
                                        .then(function (r) {
                                            var tvars = _.map(templateSrv.variables, function (v) { return '$' + v.name; });
                                            return tvars.concat(r.results);
                                        });
                                };
                            }
                            if (options === "_tags_") {
                                options = function (query, process) {
                                    return ctrl.datasource.queryTags(query, ctrl.getSegmentPathUpTo())
                                        .then(function (r) {
                                            var tvars = _.map(templateSrv.variables, function (v) { return '$' + v.name; });
                                            return tvars.concat(r.results);
                                        });
                                };
                            }
                            $input.val(func.params[paramIndex]);
                            $input.tagsinput({
                                typeahead: {
                                    source: options,
                                    minLength: 0
                                },
                                widthClass: ' '
                                /*updater: function (value) {
                                  setTimeout(function() {
                                    inputBlur.call($input[0], paramIndex);
                                  }, 0);
                                  return value;
                                }*/
                            });
                            $input.data('tagsinput').$container.addClass('func-editor-tags');
                            $input.on('itemAdded itemRemoved', function (event) {
                                // event.item: contains the item
                                //console.log($input.val());
                                inputBlurNoLink.call($input[0], paramIndex);
                            });
                        }

                        function toggleFuncControls() {
                            var targetDiv = elem.closest('.tight-form');

                            if (elem.hasClass('show-function-controls')) {
                                elem.removeClass('show-function-controls');
                                targetDiv.removeClass('has-open-function');
                                $funcControls.hide();
                                return;
                            }

                            elem.addClass('show-function-controls');
                            targetDiv.addClass('has-open-function');

                            $funcControls.show();
                        }

                        function addElementsAndCompile() {
                            $funcControls.appendTo(elem);
                            $funcLink.appendTo(elem);

                            _.each(funcDef.params, function (param, index) {
                                if (param.optional && func.params.length <= index) {
                                    return;
                                }

                                if (index > 0) {
                                    $('<span>, </span>').appendTo(elem);
                                }

                                var paramValue = templateSrv.highlightVariablesAsHtml(func.params[index]);
                                var $input = $(paramTemplate);

                                paramCountAtLink++;

                                if (funcDef.params[index].type !== "csv") {
                                    var $paramLink = $('<a ng-click="" class="whitefalcon-func-param-link">' + paramValue + '</a>');
                                    $paramLink.appendTo(elem);
                                    $paramLink.click(_.partial(clickFuncParam, index));
                                }

                                $input.appendTo(elem);

                                $input.blur(_.partial(inputBlur, index));
                                $input.keyup(inputKeyDown);
                                $input.keypress(_.partial(inputKeyPress, index));

                                if (funcDef.params[index].options) {
                                    if (funcDef.params[index].type === "csv") {
                                        addTags($input, index);
                                    } else {
                                        addTypeahead($input, index);
                                    }
                                }
                            });

                            $('<span>)</span>').appendTo(elem);

                            $compile(elem.contents())($scope);
                        }

                        function ifJustAddedFocusFistParam() {
                            if ($scope.func.added) {
                                $scope.func.added = false;
                                setTimeout(function () {
                                    elem.find('.whitefalcon-func-param-link').first().click();
                                }, 10);
                            }
                        }

                        function registerFuncControlsToggle() {
                            $funcLink.click(toggleFuncControls);
                        }

                        function registerFuncControlsActions() {
                            $funcControls.click(function (e) {
                                var $target = $(e.target);
                                if ($target.hasClass('fa-remove')) {
                                    toggleFuncControls();
                                    $scope.$apply(function () {
                                        ctrl.removeFunction($scope.func);
                                    });
                                    return;
                                }

                                if ($target.hasClass('fa-arrow-left')) {
                                    $scope.$apply(function () {
                                        _.move(ctrl.functions, $scope.$index, $scope.$index - 1);
                                        ctrl.targetChanged();
                                    });
                                    return;
                                }

                                if ($target.hasClass('fa-arrow-right')) {
                                    $scope.$apply(function () {
                                        _.move(ctrl.functions, $scope.$index, $scope.$index + 1);
                                        ctrl.targetChanged();
                                    });
                                    return;
                                }

                                if ($target.hasClass('fa-question-circle')) {
                                    window.open(
                                        "http://whitefalcon.readthedocs.org/en/latest/" +
                                        "functions.html#whitefalcon.render.functions." + funcDef.name,
                                        '_blank'
                                    );
                                    return;
                                }
                            });
                        }

                        function relink() {
                            elem.children().remove();

                            addElementsAndCompile();
                            ifJustAddedFocusFistParam();
                            registerFuncControlsToggle();
                            registerFuncControlsActions();
                        }

                        relink();
                    }
                };

            });
    }
}

export default WhitefalconFuncEditor;

