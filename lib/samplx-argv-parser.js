// Enable JavaScript strict mode.
"use strict";

const option = require("./option");
const operand = require("./operand");
const shorthand = require("./shorthand");
const parser = require("./parser");
const help = require("./help");

function detectDuplicateOption(suspect, option) {
    if (!operand.isOperand(option) && suspect.intersects(option)) {
        throw new Error("Duplicate option (" + suspect.signature + ")");
    }
}

function detectDuplicateShorthand(shorthand, option) {
    if (option.recognizes && option.recognizes(shorthand)) {
        throw new Error("Can not add shorthand '" + shorthand +
                        "', option already exists.");
    }
}

function optList(collection) {
    if (!collection.options) { collection.options = []; }
    return collection.options;
}

function ArgvParser(parserOptions) {
    this.options = [];
    this.parserOptions = parserOptions || {};
}

ArgvParser.prototype = module.exports = {
    parserOptions : {},

    validators: require("./validators"),
    types: require("./types"),

    create: function (parserOptions) {
        return new ArgvParser(parserOptions);
    },

    add: function (opt) {
        optList(this).push(opt);
        return opt;
    },

    createOption: function (options, properties) {
        const opt = option.create(options, properties);
        optList(this).forEach(detectDuplicateOption.bind(null, opt));
        return this.add(opt);
    },

    createOperand: function (name, properties) {
        return this.add(operand.create(name, properties));
    },

    addShorthand: function (opt, args) {
        if (!option.isOption(opt)) {
            throw new Error("Invalid option '" + opt + "'");
        }
        optList(this).forEach(detectDuplicateShorthand.bind(null, opt));
        return this.add(shorthand.create(opt, args));
    },

    parse: function (argv, onFinished) {
        try {
            parser.parse(optList(this), argv, function (err, options) {
                if (err) {
                    err = [err];
                }
                onFinished(err, options);
            }.bind(this));
        } catch (e) {
            onFinished([e.message]);
        }
    },

    printHelp : function() {
        help.printHelp(this);
    },

    printUsage : function(errors, verbose) {
        help.printErrors(errors);
        if (this.parserOptions.usage) {
            console.error(this.parserOptions.usage);
        } else {
            help.printUsage(this, verbose);
        }
    },

    printVersion : function (version, verbose) {
        help.printVersion(this, version, verbose);
    }
};

var flag;
for (flag in operand.flags) {
    module.exports[flag] = operand.flags[flag];
}
