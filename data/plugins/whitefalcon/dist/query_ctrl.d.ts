/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import WhitefalconAddFunc from './add_whitefalcon_func';
import WfFunc from './wf_func';
import { QueryCtrl } from 'app/plugins/sdk';
import WhitefalconFuncEditor from './func_editor';
export declare class WhitefalconQueryCtrl extends QueryCtrl {
    private templateSrv;
    private uiSegmentSrv;
    static templateUrl: string;
    functionEditor: WhitefalconAddFunc;
    whitefalconFuncEditor: WhitefalconFuncEditor;
    functions: any[];
    segments: any[];
    wfFunc: WfFunc;
    /** @ngInject **/
    constructor($scope: any, $injector: any, templateSrv: any, uiSegmentSrv: any);
    toggleEditorMode(): void;
    parseTarget(): void;
    addFunctionParameter(func: any, value: any, index: any, shiftBack: any): void;
    parseTargeRecursive(astNode: any, func: any, index: any): any;
    getSegmentPathUpTo(index: any): any;
    setSegmentFocus(segmentIndex: any): void;
    wrapFunction(target: any, func: any): any;
    getAltSegments(index: any): any;
    segmentValueChanged(segment: any, segmentIndex: any): void;
    targetTextChanged(): void;
    targetChanged(): void;
    removeFunction(func: any): void;
    addFunction(funcDef: any): void;
    moveAliasFuncLast(): void;
    smartlyHandleNewAliasByNode(func: any): void;
}
