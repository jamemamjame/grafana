System.register(["./lib/common", "../src/query_ctrl", "./lib/template_srv_stub", "q"], function (exports_1, context_1) {
    "use strict";
    var common_1, query_ctrl_1, template_srv_stub_1, q_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (template_srv_stub_1_1) {
                template_srv_stub_1 = template_srv_stub_1_1;
            },
            function (q_1_1) {
                q_1 = q_1_1;
            }
        ],
        execute: function () {
            common_1.describe('ChangeMyNameQueryCtrl', function () {
                var queryCtrl;
                common_1.beforeEach(function () {
                    queryCtrl = new query_ctrl_1.ChangeMyNameQueryCtrl({}, {}, new template_srv_stub_1.default());
                    queryCtrl.datasource = { $q: q_1.default };
                });
                common_1.describe('init query_ctrl variables', function () {
                    common_1.it('defaults should be initialized', function () {
                        // Replace with test for defaults that should be set in the query ctrl.
                        common_1.expect(queryCtrl.target.target).to.be('');
                    });
                });
            });
        }
    };
});
//# sourceMappingURL=query_ctrl_specs.js.map