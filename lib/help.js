// Enable JavaScript strict mode.
"use strict";

// module imports
const option = require("./option.js");
const operand = require("./operand.js");
const util = require("util");

// string constants -- i18n needed
const Aliases = "Aliases:\n";
const DefaultValueName = "VALUE";
const ERROR = "ERROR";
const Options = "Options:\n";
const OptionsMsg = " [options] ";
const Operands = "Operands:\n";
const Usage = "Usage";

function getTitle(parser) {
    return parser.parserOptions.prog || process.title;
}

function getHeader(parser) {
    const title = getTitle(parser);
    const description = parser.parserOptions.description ? (' -- ' + parser.parserOptions.description) : '';
    return title + description + '\n';
}

function getTrailer(parser) {
    return parser.parserOptions.epilog || '';
}

// return width of help message aliases prefix.
function getAliasesWidth(args) {
    return args.options.reduce((max, opt) => {
        if (opt.expansion && opt.option && (opt.option.length > max)) {
            return opt.option.length;
        }
        return max;
    }, 0);
}

// return width of a single option description.
function getOptionWidth(opt) {
    const sigLength = opt.signature.length;
    if (opt.hasValue) {
        if (opt.valueName) {
            return sigLength + 1 + opt.valueName.length;
        }
        return sigLength + 1 + DefaultValueName.length;
    }
    return sigLength;
}

// return width of options prefix.
function getOptionsWidth(args) {
    return args.options.reduce((max, opt) => {
        if (!operand.isOperand(opt) && opt.signature) {
            const len = getOptionWidth(opt);
            if (len > max) {
                return len;
            }
        }
        return max;
    }, 0);
}

function getOptions(args, maxPrefix) {
    const pad = ' '.repeat(maxPrefix);
    const align = "\n" + ' '.repeat(maxPrefix + 6);
    return args.options.reduce((s, opt) => {
        var prefix, suffix;
        if (!operand.isOperand(opt) && opt.signature) {
            prefix = opt.signature;
            if (opt.hasValue) {
                if (opt.valueName) {
                    prefix += '=' + opt.valueName;
                } else {
                    prefix += '=' + DefaultValueName;
                }
            }
            prefix += pad;
            suffix = '';
            if (opt.description) {
                suffix += ': ' + opt.description.replace(/\n/gm, align);
            } else if (opt.description === false) {
                return s;
            }
            if (opt.defaultValue) {
                suffix += ' [' + opt.defaultValue + ']';
            }
            const groupName = opt.groupName ? (" " + opt.groupName + "\n") : "";
            return s + groupName + "   " + prefix.substr(0, maxPrefix+1) + suffix + "\n";
        } else if (opt.option && opt.expansion) {
            prefix = opt.option + pad;
            if (opt.expansion.length == 2) {
                suffix = opt.expansion[0] + '=' + opt.expansion[1];
            } else {
                suffix = opt.expansion.join(' ');
            }
            return s + "   " + prefix.substr(0, maxPrefix) + "=> " + suffix + "\n";
        }
    }, Options);
}

function getOperandWidth(opt) {
    const greedyLen = opt.greedy ? 1 : 0;
    return opt.valueName.length + greedyLen;
}

function getOperandsWidth(args) {
    var maxPrefix = 0;
    for (var n=0; n < args.options.length; n++) {
        if (operand.isOperand(args.options[n])) {
            const len = getOperandWidth(args.options[n]);
            if (len > maxPrefix) {
                maxPrefix = len;
            }
        }
    }
    return maxPrefix;
}

function getOperands(args, maxPrefix) {
    var str = Operands;
    var pad= '';
    for (var n=0; n < maxPrefix; n++) {
        pad += ' ';
    }
    var align = "\n" + pad + '      ';
    args.options.forEach(function (opt) {
        var prefix, suffix;
        if (operand.isOperand(opt)) {
            prefix = opt.valueName;
            if (opt.greedy) {
                prefix += '+';
            }
            prefix += pad;
            suffix = '';
            if (opt.description) {
                suffix += ': ' + opt.description.replace(/\n/gm, align);
            } else if (opt.description === false) {
                return;
            }
            str += "   " + prefix.substr(0, maxPrefix+1) + suffix + "\n";
        }
    });
    return str;
}

function getShortOperands(args) {
    const maxPrefix = getOperandsWidth(args);
    if (maxPrefix === 0) {
        return '';
    }
    var str = '';
    var prefix;
    args.options.forEach(function (opt) {
        if (operand.isOperand(opt) && (opt.description !== false)) {
            prefix = opt.valueName;
            if (opt.greedy) {
                prefix += '+';
            }
            str += prefix + ' ';
        }
    });
    return str;
}

const formatter = (parser) => {
    var str = '';
    if (parser.parserOptions.formatter) {
        if (typeof parser.parserOptions.formatter != 'function') {
            throw new TypeError('custom formatter must be a function');
        }
        str = parser.parserOptions.formatter(parser);
    } else {
        const optionsWidth = getOptionsWidth(parser);
        const aliasesWidth = getAliasesWidth(parser)+1;
        const operandsWidth = getOperandsWidth(parser);
        var width = optionsWidth;
        if (aliasesWidth > width) {
            width = aliasesWidth;
        }
        if (operandsWidth > width) {
            width = operandsWidth;
        }
        str += getHeader(parser);
        str += getUsage(parser) + "\n";
        if (optionsWidth > 0) {
            str += getOptions(parser, width);
        }
        if (operandsWidth > 0) {
            str += getOperands(parser, width);
        }
        str += getTrailer(parser);
    }
    return str;
};

const getUsage = (parser) => {
    var str = Usage + ': ' + getTitle(parser);
    if (getOptionsWidth(parser) > 0) {
        str += OptionsMsg;
    }
    str += getShortOperands(parser);
    return str;
};

module.exports = {


    // Print a standarized help message based upon parser parameters.
    formatter : formatter,

    printHelp : function (parser) {
        const str = formatter(parser);

        parser.log(str);
    },


    // print the version number.
    printVersion: function(parser, version, verbose) {
        parser.log(util.format("%s version %s", getTitle(parser), version));
        if (verbose) {
            var width = 0;
            var key;
            for (key in process.versions) {
                if (key.length > width) {
                    width = key.length;
                }
            }
            var pad = ' '.repeat(width);
            parser.log("Component versions");
            var component;
            for (key in process.versions) {
                component = key + pad;
                const msg = util.format("    %s : version %s", component.substr(0, width), process.versions[key]);
                parser.log(msg);
            }
        }
    },

    printErrors: function (errors, parser) {
        const errFn = parser ? parser.error.bind(parser) : console.error;

        for (var n=0; n < errors.length; n++) {
            errFn('%s: %s', ERROR, errors[n]);
        }
    },

    getUsage : getUsage,

    // print a usage error message to stderr. include help if verbose is set.
    printUsage: function (parser, verbose) {
        parser.error(getUsage(parser));
        if (verbose) {
            parser.error(formatter(parser));
        }
    },

};
