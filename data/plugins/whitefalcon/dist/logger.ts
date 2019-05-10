let Log: any = {
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

export default { Log }