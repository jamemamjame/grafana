///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import WhitefalconAddFunc from './add_whitefalcon_func';
import './func_editor';
import _ from 'lodash';
import WfFunc from './wf_func';
import Parser from './parser';
import Lexer from './lexer';
import {QueryCtrl} from 'app/plugins/sdk';
import WhitefalconFuncEditor from './func_editor';

export class WhitefalconQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';
  functionEditor = new WhitefalconAddFunc();
  whitefalconFuncEditor = new WhitefalconFuncEditor();
  functions: any[];
  segments: any[];
  wfFunc = new WfFunc();
  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private uiSegmentSrv ) {
    super($scope, $injector);

    if (this.target) {
      this.target.target = this.target.target || '';
      this.parseTarget();
    }
  }

  toggleEditorMode() {
    this.target.textEditor = !this.target.textEditor;
    this.parseTarget();
  }

  parseTarget() {
    this.functions = [];
    this.segments = [];
    this.error = null;

    if (this.target.textEditor) {
      return;
    }
    var lexer = new Lexer(this.target.target);
    var parser = new Parser(this.target.target,lexer);
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
    } catch (err) {
      console.log('error parsing target:', err.message);
      this.error = err.message;
      this.target.textEditor = true;
    }
  }

  addFunctionParameter(func, value, index, shiftBack) {
    if (shiftBack) {
      index = Math.max(index - 1, 0);
    }
    func.params[index] = value;
  }

  parseTargeRecursive(astNode, func, index) {
    var self = this;
    if (astNode === null) {
      return null;
    }
    switch (astNode.type) {
      case 'function':
        var innerFunc = this.wfFunc.createFuncInstance(astNode.name, { withDefaultParams: false });
        _.each(astNode.params, (param, index) => {
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
        if ((index-1) >= func.def.params.length) {
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

      this.segments = _.map(astNode.segments, segment => {
        return this.uiSegmentSrv.newSegment(segment);
      });
    }
  }

  getSegmentPathUpTo(index) {
    if (index === 0) {
      return '';
    }
    var arr = index ? this.segments.slice(0, index) : this.segments;
    return _.reduce(arr, function(result, segment) {
      return result ? (result + "." + segment.value) : segment.value;
    }, "");
  }

  setSegmentFocus(segmentIndex) {
    _.each(this.segments, (segment, index) => {
      segment.focus = segmentIndex === index;
    });
  }

  wrapFunction(target, func) {
    return func.render(target);
  }

  getAltSegments(index) {
    var query = this.getSegmentPathUpTo(index);

    return this.datasource.metricFindQuery(query).then(segments => {
      var altSegments = _.map(segments, segment => {
        return this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
      });

      if (altSegments.length === 0) { return altSegments; }

      // add template variables
      _.each(this.templateSrv.variables, variable => {
        altSegments.unshift(this.uiSegmentSrv.newSegment({
          type: 'template',
          value: '$' + variable.name,
          expandable: true,
        }));
      });

      // add wildcard option
      return altSegments;
    }).catch(err => {
      this.error = err.message || 'Failed to issue metric query';
      return [];
    });
  }

  segmentValueChanged(segment, segmentIndex) {
    this.error = null;

    if (this.functions.length > 0 && this.functions[0].def.fake) {
      this.functions = [];
    }

    var query = this.getSegmentPathUpTo(segmentIndex);
    if (query) {
      query += '.';
    }
    query += segment.value;

    this.datasource.metricFindQuery(query,{},true).then(segments => {
      var expandable = (segments.length > 0);
      this.segments = this.segments.splice(0, segmentIndex);
      this.segments.push(this.uiSegmentSrv.newSegment({ value: segment.value, expandable: expandable }));
      if (expandable) {
        this.segments.push(this.uiSegmentSrv.newSelectMetric());
        this.setSegmentFocus(segmentIndex + 1);
      }
      this.targetChanged();
    });
  }

  targetTextChanged() {
    this.parseTarget();
    this.panelCtrl.refresh();
  }

  targetChanged() {
    if (this.error) {
      return;
    }

    var oldTarget = this.target.target;
    var target = this.getSegmentPathUpTo(this.segments.length);
    this.target.target = _.reduce(this.functions, this.wrapFunction, target);

    if (this.target.target !== oldTarget) {
      if (this.segments[this.segments.length - 1].value !== 'select metric') {
        this.panelCtrl.refresh();
      }
    }
  }

  removeFunction(func) {
    this.functions = _.without(this.functions, func);
    this.targetChanged();
  }

  addFunction(funcDef) {
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
  }

  moveAliasFuncLast() {
    var aliasFunc = _.find(this.functions, function(func) {
      return func.def.name === 'alias' ||
        func.def.name === 'aliasByNode' ||
        func.def.name === 'aliasByMetric';
    });

    if (aliasFunc) {
      this.functions = _.without(this.functions, aliasFunc);
      this.functions.push(aliasFunc);
    }
  }

  smartlyHandleNewAliasByNode(func) {
    if (func.def.name !== 'aliasByNode') {
      return;
    }

    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i].value.indexOf('*') >= 0)  {
        func.params[0] = i;
        func.added = false;
        this.targetChanged();
        return;
      }
    }
  }
}

