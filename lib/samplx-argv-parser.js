// Enable JavaScript strict mode.
"use strict";

const optionModule = require("./option");
const operand = require("./operand");
const shorthand = require("./shorthand");
const parser = require("./parser");
const help = require("./help");

function detectDuplicateOption(suspect, option) {
    if (!operand.isOperand(option) && suspect.intersects(option)) {
        throw new Error("Duplicate option (" + suspect.signature + ")");
    }
}

function ArgvParser(parserOptions, $cons) {
    this.$console = $cons || console;
    this.options = [];
    this.parserOptions = parserOptions || {};
    return this;
}

ArgvParser.prototype = module.exports = {
    parserOptions : {},

    validators: require("./validators"),
    types: require("./types"),

    create: function (parserOptions, cons) {
        return new ArgvParser(parserOptions, cons);
    },

    add: function (opt) {
        this.options.push(opt);
        return opt;
    },

    createOption: function (options, properties) {
        const opt = optionModule.create(options, properties);
        this.options.forEach(detectDuplicateOption.bind(null, opt));
        return this.add(opt);
    },

    createOperand: function (name, properties) {
        return this.add(operand.create(name, properties));
    },

    addShorthand: function (opt, args) {
        if (!optionModule.isOption(opt)) {
            throw new Error("Invalid option '" + opt + "'");
        }
        return this.add(shorthand.create(opt, args));
    },

    parse: function (argv, onFinished) {
        try {
            parser.parse(this.options, argv, function (err, opts) {
                if (err) {
                    err = [err];
                }
                onFinished(err, opts);
            }.bind(this));
        } catch (e) {
            onFinished([e.message]);
        }
    },

    printHelp : function() {
        help.printHelp(this);
    },

    printUsage : function(errors, verbose) {
        help.printErrors(errors, this);
        if (this.parserOptions.usage) {
            if (typeof this.parserOptions.usage === 'function') {
                this.$console.error(this.parserOptions.usage());
            } else {
                this.$console.error(this.parserOptions.usage);
            }
        } else {
            help.printUsage(this, verbose);
        }
    },

    printVersion : function (version, verbose) {
        help.printVersion(this, version, verbose);
    },

    log : function (s) {
        this.$console.log(s);
    },

    error: function (s) {
        this.$console.error(s);
    }
};
