System.register([], function(exports_1) {
    var Log;
    return {
        setters:[],
        execute: function() {
            Log = {
                _log: function (level, s) {
                    console.log(level + ": " + s);
                },
                info: function (s) {
                    Log._log("INFO", s);
                },
                warn: function (s) {
                    Log._log("WARN", s);
                },
                debug: function (s) {
                    Log._log("WARN", s);
                }
            };
            exports_1("default",{ Log: Log });
        }
    }
});
//# sourceMappingURL=logger.js.map