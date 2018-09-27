// enable JavaScript strict mode.
"use strict";

const argument = require("./argument");

function detectDuplicates(options) {
    options.forEach(function (option, i) {
        if (options.slice(i + 1).some(function (o) { return option === o; })) {
            throw new Error("Duplicate option (" + option + ")");
        }
    });
}

function unexpectedValueError(option) {
    return new Error(option.signature + " does not take a value.");
}

function missingValueError(option) {
    return new Error("No value specified for " + option.signature);
}

function validateOption(option) {
    if (module.exports.isShortOption(option) && option.length > 2) {
        throw new Error("A short option can only be one dash and " +
                        "one character (" + option + ").");
    }
    return option;
}

function valueAlreadySetError(option) {
    return new Error("Value already set for " + option.signature);
}

function getTransform(properties) {
    if (!properties.transform) { return; }
    if (typeof properties.transform !== "function") {
        throw new Error("transform must be function");
    }
    return properties.transform;
}

function getRequiresValue(properties) {
    if (!properties.hasOwnProperty("requiresValue")) { return true; }
    return properties.requiresValue;
}

function Option(validators) {
    var prop, arg = argument.create(validators);
    for (prop in arg) {
        this[prop] = arg[prop];
    }
}

Option.prototype = module.exports = {
    create: function (opts, props) {
        if (!Array.isArray(opts) || (opts.length === 0)) {
            throw new Error("Option must have at least one name, e.g. --help");
        }
        detectDuplicates(opts);
        props = props || {};
        const options = opts.map(validateOption);
        const opt = new Option(props.validators);
        opt.options = options;
        opt.signature = options.join("|");
        opt.hasValue = !!props.hasValue || props.hasOwnProperty("defaultValue");
        opt.requiresValue = getRequiresValue(props);
        opt.transform = getTransform(props);
        opt.defaultValue = props.defaultValue;
        opt.description = props.description;
        opt.valueName = props.valueName;
        opt.allowMultiple = props.allowMultiple;
        opt.allowOverride = props.allowOverride;
        opt.groupName = props.groupName;
        return opt;
    },

    valueRequired: function () {
        return this.hasValue && this.requiresValue;
    },

    handle: function (data, value) {
        const hasValue = typeof value === "string";
        if (hasValue && !this.hasValue) { throw unexpectedValueError(this); }
        if (!hasValue && this.valueRequired()) { throw missingValueError(this); }
        if (data.isSet && !this.allowMultiple && !this.allowOverride) { throw valueAlreadySetError(this); }
        if (hasValue) {
            if (this.allowMultiple) {
                if (!data.value) {
                    data.value = [];
                }
                data.value.push(value);
            } else {
                data.value = value;
            }
        }
        data.isSet = true;
        data.timesSet++;
    },

    intersects: function (o) {
        return this.options.some((opt) => o.recognizes(opt));
    },

    recognizes: function (option, data) {
        const longOpt = option.split("=")[0];
        const shortOpt = longOpt.slice(0, 2);
        return this.options.indexOf(shortOpt) >= 0 ||
            this.options.indexOf(longOpt) >= 0;
    },

    keys: function () {
        return this.options;
    },

    isLongOption: function (option) {
        return (/^\-\-./).test(option);
    },

    isShortOption: function (option) {
        return (/^\-[^\-]/).test(option);
    },

    isOption: function (opt) {
        return this.isLongOption(opt) || this.isShortOption(opt);
    }
};
