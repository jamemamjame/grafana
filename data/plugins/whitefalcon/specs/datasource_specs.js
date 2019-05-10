System.register(["./lib/common", "../src/datasource", "./lib/template_srv_stub", "q"], function (exports_1, context_1) {
    "use strict";
    var common_1, datasource_1, template_srv_stub_1, q_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (template_srv_stub_1_1) {
                template_srv_stub_1 = template_srv_stub_1_1;
            },
            function (q_1_1) {
                q_1 = q_1_1;
            }
        ],
        execute: function () {
            common_1.describe('ChangeMyNameDatasource', function () {
                var ctx = {
                    backendSrv: {},
                    templateSrv: new template_srv_stub_1.default()
                };
                common_1.beforeEach(function () {
                    ctx.$q = q_1.default;
                    ctx.instanceSettings = {};
                    ctx.ds = new datasource_1.default(ctx.instanceSettings, ctx.backendSrv, ctx.templateSrv, ctx.$q);
                });
                common_1.describe('When performing testDatasource', function () {
                    common_1.describe('and an error is returned', function () {
                        var error = {
                            data: {
                                error: {
                                    code: 'Error Code',
                                    message: "An error message."
                                }
                            },
                            status: 400,
                            statusText: 'Bad Request'
                        };
                        common_1.beforeEach(function () {
                            ctx.backendSrv.datasourceRequest = function (options) {
                                return ctx.$q.reject(error);
                            };
                        });
                        common_1.it('should return error status and a detailed error message', function () {
                            return ctx.ds.testDatasource().then(function (results) {
                                common_1.expect(results.status).to.equal('error');
                                common_1.expect(results.message).to.equal('Data Source is just a template and has not been implemented yet.');
                            });
                        });
                    });
                    common_1.describe('and the response works', function () {
                        var response = {
                            data: {},
                            status: 200,
                            statusText: 'OK'
                        };
                        common_1.beforeEach(function () {
                            ctx.backendSrv.datasourceRequest = function (options) {
                                return ctx.$q.when({ data: response, status: 200 });
                            };
                        });
                        common_1.it('should return success status', function () {
                            return ctx.ds.testDatasource().then(function (results) {
                                common_1.expect(results.status).to.equal('success');
                            });
                        });
                    });
                });
                common_1.describe('When performing query', function () {
                });
            });
        }
    };
});
//# sourceMappingURL=datasource_specs.js.map