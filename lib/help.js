// Enable JavaScript strict mode.
"use strict";

// module imports
var option = require("./option.js");
var operand = require("./operand.js");
var util = require("util");

// string constants -- i18n needed
var Aliases = "Aliases:\n";
var DefaultValueName = "VALUE";
var ERROR = "ERROR";
var Options = "Options:\n";
var OptionsMsg = " [options] ";
var Operands = "Operands:\n";
var Usage = "Usage";

function getTitle(parser) {
    return parser.parserOptions.prog || process.title;
}

function getHeader(parser) {
    var str = getTitle(parser);
    if (parser.parserOptions.description) {
        str += ' -- ' + parser.parserOptions.description;
    }
    str += "\n";
//    console.log("getHeader=" + str);
    return str;
}

function getTrailer(parser) {
    return parser.parserOptions.epilog || '';
}
    
// return width of help message aliases prefix.
function getAliasesWidth(args) {
    var maxPrefix = 0;
    var len;
    args.options.forEach(function (opt) {
        if (opt.expansion && opt.option) {
            len = opt.option.length;
            if (len > maxPrefix) {
                maxPrefix = len;
            }
        }
    });
//    console.log("getAliasesWidth=" + maxPrefix);
    return maxPrefix;
}

/* ***
// return Aliases section of help message.
function getAliases(args) {
    var maxPrefix = getAliasesWidth(args);
    if (maxPrefix == 0) {
        return '';
    }

    var str = Aliases;
    var pad = '';
    var n;
    for (n=0; n < maxPrefix; n++) {
        pad += ' ';
    }
    args.options.forEach(function (opt) {
        var prefix, suffix;
        if (opt.option && opt.expansion) {
            prefix = opt.option + pad;
            suffix = '';
            if (opt.expansion.length == 2) {
                suffix = opt.expansion[0] + '=' + opt.expansion[1];
            } else {
                for (n=0; n < opt.expansion.length; n++) {
                    suffix += opt.expansion[n] + ' ';
                }
            }
            str += "    " + prefix.substr(0, maxPrefix) + " => " + suffix + "\n";
        }
    });
//    console.log("getAliases="+str);
    return str;
}
*** */

// return width of options prefix.
function getOptionsWidth(args) {
    var len;
    var maxPrefix = 0;
    args.options.forEach(function (opt) {
        if (!operand.isOperand(opt) && opt.signature) {
            len = opt.signature.length;
            if (opt.hasValue) {
                if (opt.valueName) {
                    len += 1 + opt.valueName.length;
                } else {
                    len += 1 + DefaultValueName.length;
                }
            }
            if (len > maxPrefix) {
                maxPrefix = len;
            }
        }
    });
//    console.log("getOptionsWidth="+maxPrefix);
    return maxPrefix;
}

function getOptions(args, maxPrefix) {
    var str = Options;
    var pad= '';
    for (var n=0; n < maxPrefix; n++) {
        pad += ' ';
    }
    var align = "\n" + pad + '      ';
    args.options.forEach(function (opt) {
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
                return;
            }
            if (opt.defaultValue) {
                suffix += ' [' + opt.defaultValue + ']';
            }
            if (opt.groupName) {
                str += "  " + opt.groupName + "\n";
            }
            str += "   " + prefix.substr(0, maxPrefix+1) + suffix + "\n";
        } else if (opt.option && opt.expansion) {
            prefix = opt.option + pad;
            suffix = '';
            if (opt.expansion.length == 2) {
                suffix = opt.expansion[0] + '=' + opt.expansion[1];
            } else {
                for (n=0; n < opt.expansion.length; n++) {
                    suffix += opt.expansion[n] + ' ';
                }
            }
            str += "   " + prefix.substr(0, maxPrefix) + "=> " + suffix + "\n";
        }
    });
//    console.log("getOptions=" + str);
    return str;
}

function getOperandsWidth(args) {
    var len;
    var maxPrefix = 0;
    for (var n=0; n < args.options.length; n++) {
        if (operand.isOperand(args.options[n])) {
            if (args.options[n].valueName) {
                len = args.options[n].valueName.length;
            } else {
                len = DefaultValueName.length;
            }
            if (args.options[n].greedy) {
                len += 1;
            }
            if (len > maxPrefix) {
                maxPrefix = len;
            }
        }
    }
//    console.log("getOperandsWidth=" + maxPrefix);
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
            if (opt.valueName) {
                prefix = opt.valueName;
            } else {
                prefix = DefaultValueName;
            }
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
//    console.log("getOperands=" + str);
    return str;
}

function getShortOperands(args) {
    var maxPrefix = getOperandsWidth(args);
    if (maxPrefix == 0) {
        return '';
    }
    var str = '';
    var prefix;
    args.options.forEach(function (opt) {
        if (operand.isOperand(opt)) {
            if (opt.valueName) {
                prefix = opt.valueName;
            } else {
                prefix = DefaultValueName;
            }
            if (opt.greedy) {
                prefix += '+';
            }
            str += prefix + ' ';
        }
    });
    return str;
}

module.exports = {
    

    // Print a standarized help message based upon parser parameters.
    formatter : function (parser) {
//        console.log("formatter, parser=");
//        console.log(util.inspect(parser, { depth: null }));
        if (parser.parserOptions.formatter) {
            str = parser.parserOptions.formatter(parser);
        } else {
            var optionsWidth = getOptionsWidth(parser);
            var aliasesWidth = getAliasesWidth(parser)+1;
            var operandsWidth = getOperandsWidth(parser);
            var width = optionsWidth;
            if (aliasesWidth > width) {
                width = aliasesWidth;
            }
            if (operandsWidth > width) {
                width = operandsWidth;
            }
            //console.log("width=" + width);
            var str = '';
            str += getHeader(parser);
            str += this.getUsage(parser) + "\n";
            if (optionsWidth > 0) {
                str += getOptions(parser, width);
            }
            if (operandsWidth > 0) {
                str += getOperands(parser, width);
            }
            str += getTrailer(parser);
        }
        return str;
    },
    
    printHelp : function (parser) {
        //console.log("help.printHelp");
        var str = this.formatter(parser);
        
        console.log(str);
    },
    

    // print the version number.
    printVersion: function(parser, version, verbose) {
        console.log("%s version %s", getTitle(parser), version);
        if (verbose) {
            var width = 0;
            var key;
            for (key in process.versions) {
                if (key.length > width) {
                    width = key.length;
                }
            }
            var pad = '';
            for (var n=0; n <= width; n++) {
                pad += ' ';
            }
            console.log("Component versions");
            var component;
            for (key in process.versions) {
                component = key + pad;
                console.log("    %s : version %s", component.substr(0, width), process.versions[key]);
            }
        }
    },
    
    printErrors: function (errors) {
        for (var n=0; n < errors.length; n++) {
            console.error('%s: %s', ERROR, errors[n]);
        }
    },
    
    getUsage : function (parser) {
        var str = Usage + ': ' + getTitle(parser);
        if (getOptionsWidth(parser) > 0) {
            str += OptionsMsg;
        }
        str += getShortOperands(parser);
        return str;
    },
    
    // print a usage error message to stderr. include help if verbose is set.
    printUsage: function (parser, verbose) {
//            console.log("usage, parser=");
//            console.log(util.inspect(parser, { depth: null }));
        console.error(this.getUsage(parser));
        if (verbose) {
            console.error(this.formatter(parser));
            console.error(str);
        }
    },

};

