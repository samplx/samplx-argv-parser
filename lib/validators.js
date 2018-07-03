// Enable JavaScript strict mode.
"use strict";

const fs = require("fs");
const when = require("when");

function interpolate(str, args) {
    args.forEach(function (arg, i) {
        str = str.replace("${" + (i + 1) + "}", arg);
    });
    return str;
}
//                              scheme                     authority      path    query    fragment
const urlPattern = new RegExp(/^([A-Za-z][-A-Za-z0-9+.]*:)?(\/\/[^\/?#]+)?([^#?]*)(\?[^#]*)?(#.*)?$/);

module.exports = {
    integer: function (errMsg) {
        return function (opt) {
            if (opt.value === undefined) return;
            var values;
            if (Array.isArray(opt.value)) {
                values = opt.value;
            } else {
                values = [ opt.value ];
            }
            const errors = [];
            values.forEach(function (value) {
                if (!/^\d+$/.test(value)) {
                    errors.push(interpolate(
                        errMsg || "${1}: ${2} is not an integer",
                        [opt.signature, value]
                    ));
                }
            });
            if (errors.length !== 0) {
                throw new Error(errors.join("\n"));
            }
        };
    },

    positiveInteger : function (errMsg) {
        return function (opt) {
            if (opt.value == undefined) return;
            var values;
            if (Array.isArray(opt.value)) {
                values = opt.value;
            } else {
                values = [ opt.value ];
            }
            const errors = [];
            values.forEach(function (value) {
                if (value == 'Infinity') return;
                var number = parseInt(value, 10);
                if (!/^\d+$/.test(value) || isNaN(value) || (value <= 0)) {
                    errors.push(interpolate(errMsg || "${1}: ${2} is not a positive integer.",
                        [ opt.signature, value ]
                    ));
                }
            });
            if (errors.length !== 0) {
                throw new Error(errors.join("\n"));
            }
        };
    },

    number: function (errMsg) {
        return function (opt) {
            if (opt.value === undefined) return;
            var values;
            if (Array.isArray(opt.value)) {
                values = opt.value;
            } else {
                values = [ opt.value ];
            }
            const errors = [];
            values.forEach(function (value) {
                if (!/^(\+|\-)?\d+(\.\d+)?$/.test(value)) {
                    errors.push(interpolate(errMsg || "${1}: ${2} is not a number",
                        [opt.signature, value])
                    );
                }
            });
            if (errors.length !== 0) {
                throw new Error(errors.join("\n"));
            }
        };
    },

    required: function (errMsg) {
        return function (opt) {
            if (opt.isSet && (!opt.hasValue || opt.value)) { return; }
            throw new Error(interpolate(
                errMsg || "${1} is required.",
                [opt.signature]
            ));
        };
    },

    file: function (errMsg) {
        return function (opt) {
            const deferred = when.defer();
            if (typeof opt.value !== "string") {
                deferred.resolve();
                return deferred.promise;
            }

            fs.stat(opt.value, function (err, stat) {
                if (err || !stat.isFile()) {
                    deferred.reject(interpolate(
                        errMsg || "${1}: ${2} is not a file",
                        [opt.signature, opt.value]
                    ));
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };
    },

    directory: function (errMsg) {
        return function (opt) {
            const deferred = when.defer();
            if (typeof opt.value !== "string") {
                deferred.resolve();
                return deferred.promise;
            }

            fs.stat(opt.value, function (err, stat) {
                if (err || !stat.isDirectory()) {
                    deferred.reject(interpolate(
                        errMsg || "${1}: ${2} is not a directory",
                        [opt.signature, opt.value]
                    ));
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };
    },

    fileOrDirectory: function (errMsg) {
        return function (opt) {
            var deferred = when.defer();
            if (typeof opt.value !== "string") {
                deferred.resolve();
                return deferred.promise;
            }

            fs.stat(opt.value, function (err, stat) {
                if (err || (!stat.isDirectory() && !stat.isFile())) {
                    deferred.reject(interpolate(
                        errMsg || "${1}: ${2} is not a file or directory",
                        [opt.signature, opt.value]
                    ));
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };
    },

    isURL: function (errMsg) {
        return function (opt) {
            if (opt.value === undefined) return;
            var values;
            if (Array.isArray(opt.value)) {
                values = opt.value;
            } else {
                values = [ opt.value ];
            }
            const errors = [];
            const validUrl = (url) => {
                const urlMatch = urlPattern.exec(url);
                const valid = Array.isArray(urlMatch) && 
                    ((urlMatch[3]) || (urlMatch[2] !== undefined));
                return valid;
            };
            values.forEach(function (value) {
                if (!validUrl(value)) {
                    errors.push(interpolate(errMsg || "${1}: ${2} is not a valid URL.",
                                [ opt.signature, value ]));
                }
            });
            if (errors.length !== 0) {
                throw new Error(errors.join("\n"));
            }
        };
    },

    isURLOrFile : function (errMsg) {
        return function (opt) {
            if (!opt.value) return;
            const deferred = when.defer();

            const urlMatch = urlPattern.exec(opt.value);
            // all path names will match scheme-less URL's, so require a scheme
            if ((urlMatch != null) && (urlMatch[1] !== undefined)) {
                deferred.resolve();
                return deferred.promise;
            }
            fs.stat(opt.value, function (err, stat) {
                if (err || !stat.isFile()) {
                    deferred.reject(interpolate(
                        errMsg || "${1}: ${2} is neither a file nor a URL.",
                        [opt.signature, opt.value]
                    ));
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };
    },

    inEnum: function (values, errMsg) {
        return function (opt) {
            if (!opt.value || values.indexOf(opt.value) >= 0) { return; }
            throw new Error(interpolate(
                errMsg || "${1}: expected one of [${3}], got ${2}",
                [opt.signature, opt.value, values.join(", ")]
            ));
        };
    },

    maxTimesSet: function (times, errMsg) {
        return function (opt) {
            if (opt.timesSet > times) {
                throw new Error(interpolate(
                    errMsg || "${1}: can only be set ${2} times.",
                    [opt.signature, times]
                ));
            }
        };
    }
};
