System.register(['./add_whitefalcon_func', './func_editor', 'lodash', './wf_func', './parser', './lexer', 'app/plugins/sdk'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var add_whitefalcon_func_1, lodash_1, wf_func_1, parser_1, lexer_1, sdk_1, func_editor_1;
    var WhitefalconQueryCtrl;
    return {
        setters:[
            function (add_whitefalcon_func_1_1) {
                add_whitefalcon_func_1 = add_whitefalcon_func_1_1;
            },
            function (func_editor_1_1) {
                func_editor_1 = func_editor_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (wf_func_1_1) {
                wf_func_1 = wf_func_1_1;
            },
            function (parser_1_1) {
                parser_1 = parser_1_1;
            },
            function (lexer_1_1) {
                lexer_1 = lexer_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }],
        execute: function() {
            WhitefalconQueryCtrl = (function (_super) {
                __extends(WhitefalconQueryCtrl, _super);
                /** @ngInject **/
                function WhitefalconQueryCtrl($scope, $injector, templateSrv, uiSegmentSrv) {
                    _super.call(this, $scope, $injector);
                    this.templateSrv = templateSrv;
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.functionEditor = new add_whitefalcon_func_1.default();
                    this.whitefalconFuncEditor = new func_editor_1.default();
                    this.wfFunc = new wf_func_1.default();
                    if (this.target) {
                        this.target.target = this.target.target || '';
                        this.parseTarget();
                    }
                }
                WhitefalconQueryCtrl.prototype.toggleEditorMode = function () {
                    this.target.textEditor = !this.target.textEditor;
                    this.parseTarget();
                };
                WhitefalconQueryCtrl.prototype.parseTarget = function () {
                    this.functions = [];
                    this.segments = [];
                    this.error = null;
                    if (this.target.textEditor) {
                        return;
                    }
                    var lexer = new lexer_1.default(this.target.target);
                    var parser = new parser_1.default(this.target.target, lexer);
                    var astNode = parser.getAst();
                    if (astNode === null) {
                        this.segments.push(this.uiSegmentSrv.newSelectMetric());
                        return;
                    }
                    if (astNode.type === 'error') {
                        this.error = astNode.message + " at position: " + astNode.pos;
                        this.target.textEditor = true;
                        return;
                    }
                    try {
                        this.parseTargeRecursive(astNode, null, 0);
                    }
                    catch (err) {
                        console.log('error parsing target:', err.message);
                        this.error = err.message;
                        this.target.textEditor = true;
                    }
                };
                WhitefalconQueryCtrl.prototype.addFunctionParameter = function (func, value, index, shiftBack) {
                    if (shiftBack) {
                        index = Math.max(index - 1, 0);
                    }
                    func.params[index] = value;
                };
                WhitefalconQueryCtrl.prototype.parseTargeRecursive = function (astNode, func, index) {
                    var _this = this;
                    var self = this;
                    if (astNode === null) {
                        return null;
                    }
                    switch (astNode.type) {
                        case 'function':
                            var innerFunc = this.wfFunc.createFuncInstance(astNode.name, { withDefaultParams: false });
                            lodash_1.default.each(astNode.params, function (param, index) {
                                self.parseTargeRecursive(param, innerFunc, index);
                            });
                            innerFunc.updateText(this);
                            self.functions.push(innerFunc);
                            break;
                        case 'series-ref':
                            this.addFunctionParameter(func, astNode.value, index, this.segments.length > 0);
                            break;
                        case 'bool':
                        case 'string':
                        case 'number':
                            if ((index - 1) >= func.def.params.length) {
                                throw { message: 'invalid number of parameters to method ' + func.def.name };
                            }
                            this.addFunctionParameter(func, astNode.value, index, true);
                            break;
                        case 'metric':
                            if (this.segments.length > 0) {
                                if (astNode.segments.length !== 1) {
                                    throw { message: 'Multiple metric params not supported, use text editor.' };
                                }
                                this.addFunctionParameter(func, astNode.segments[0].value, index, true);
                                break;
                            }
                            this.segments = lodash_1.default.map(astNode.segments, function (segment) {
                                return _this.uiSegmentSrv.newSegment(segment);
                            });
                    }
                };
                WhitefalconQueryCtrl.prototype.getSegmentPathUpTo = function (index) {
                    if (index === 0) {
                        return '';
                    }
                    var arr = index ? this.segments.slice(0, index) : this.segments;
                    return lodash_1.default.reduce(arr, function (result, segment) {
                        return result ? (result + "." + segment.value) : segment.value;
                    }, "");
                };
                WhitefalconQueryCtrl.prototype.setSegmentFocus = function (segmentIndex) {
                    lodash_1.default.each(this.segments, function (segment, index) {
                        segment.focus = segmentIndex === index;
                    });
                };
                WhitefalconQueryCtrl.prototype.wrapFunction = function (target, func) {
                    return func.render(target);
                };
                WhitefalconQueryCtrl.prototype.getAltSegments = function (index) {
                    var _this = this;
                    var query = this.getSegmentPathUpTo(index);
                    return this.datasource.metricFindQuery(query).then(function (segments) {
                        var altSegments = lodash_1.default.map(segments, function (segment) {
                            return _this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                        });
                        if (altSegments.length === 0) {
                            return altSegments;
                        }
                        // add template variables
                        lodash_1.default.each(_this.templateSrv.variables, function (variable) {
                            altSegments.unshift(_this.uiSegmentSrv.newSegment({
                                type: 'template',
                                value: '$' + variable.name,
                                expandable: true,
                            }));
                        });
                        // add wildcard option
                        return altSegments;
                    }).catch(function (err) {
                        _this.error = err.message || 'Failed to issue metric query';
                        return [];
                    });
                };
                WhitefalconQueryCtrl.prototype.segmentValueChanged = function (segment, segmentIndex) {
                    var _this = this;
                    this.error = null;
                    if (this.functions.length > 0 && this.functions[0].def.fake) {
                        this.functions = [];
                    }
                    var query = this.getSegmentPathUpTo(segmentIndex);
                    if (query) {
                        query += '.';
                    }
                    query += segment.value;
                    this.datasource.metricFindQuery(query, {}, true).then(function (segments) {
                        var expandable = (segments.length > 0);
                        _this.segments = _this.segments.splice(0, segmentIndex);
                        _this.segments.push(_this.uiSegmentSrv.newSegment({ value: segment.value, expandable: expandable }));
                        if (expandable) {
                            _this.segments.push(_this.uiSegmentSrv.newSelectMetric());
                            _this.setSegmentFocus(segmentIndex + 1);
                        }
                        _this.targetChanged();
                    });
                };
                WhitefalconQueryCtrl.prototype.targetTextChanged = function () {
                    this.parseTarget();
                    this.panelCtrl.refresh();
                };
                WhitefalconQueryCtrl.prototype.targetChanged = function () {
                    if (this.error) {
                        return;
                    }
                    var oldTarget = this.target.target;
                    var target = this.getSegmentPathUpTo(this.segments.length);
                    this.target.target = lodash_1.default.reduce(this.functions, this.wrapFunction, target);
                    if (this.target.target !== oldTarget) {
                        if (this.segments[this.segments.length - 1].value !== 'select metric') {
                            this.panelCtrl.refresh();
                        }
                    }
                };
                WhitefalconQueryCtrl.prototype.removeFunction = function (func) {
                    this.functions = lodash_1.default.without(this.functions, func);
                    this.targetChanged();
                };
                WhitefalconQueryCtrl.prototype.addFunction = function (funcDef) {
                    var newFunc = this.wfFunc.createFuncInstance(funcDef, { withDefaultParams: true });
                    newFunc.added = true;
                    this.functions.push(newFunc);
                    this.moveAliasFuncLast();
                    this.smartlyHandleNewAliasByNode(newFunc);
                    if (this.segments.length === 1 && this.segments[0].fake) {
                        this.segments = [];
                    }
                    if (!newFunc.params.length && newFunc.added) {
                        this.targetChanged();
                    }
                };
                WhitefalconQueryCtrl.prototype.moveAliasFuncLast = function () {
                    var aliasFunc = lodash_1.default.find(this.functions, function (func) {
                        return func.def.name === 'alias' ||
                            func.def.name === 'aliasByNode' ||
                            func.def.name === 'aliasByMetric';
                    });
                    if (aliasFunc) {
                        this.functions = lodash_1.default.without(this.functions, aliasFunc);
                        this.functions.push(aliasFunc);
                    }
                };
                WhitefalconQueryCtrl.prototype.smartlyHandleNewAliasByNode = function (func) {
                    if (func.def.name !== 'aliasByNode') {
                        return;
                    }
                    for (var i = 0; i < this.segments.length; i++) {
                        if (this.segments[i].value.indexOf('*') >= 0) {
                            func.params[0] = i;
                            func.added = false;
                            this.targetChanged();
                            return;
                        }
                    }
                };
                WhitefalconQueryCtrl.templateUrl = 'partials/query.editor.html';
                return WhitefalconQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("WhitefalconQueryCtrl", WhitefalconQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map