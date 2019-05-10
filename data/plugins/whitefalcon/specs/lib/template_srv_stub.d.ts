export default class TemplateSrvStub {
    variables: any[];
    templateSettings: {
        interpolate: RegExp;
    };
    data: {};
    replace(text: any): any;
    getAdhocFilters(): any[];
    variableExists(): boolean;
    highlightVariablesAsHtml(str: any): any;
    setGrafanaVariable(name: any, value: any): void;
    init(): void;
    fillVariableValuesForUrl(): void;
    updateTemplateData(): void;
}
