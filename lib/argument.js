// Enable JavaScript strict mode.
"use strict";

const when = require("when");

function validate(data, validator) {
    try {
        const val = validator(data);
        return when.isPromiseLike(val) ? val : when(val);
    } catch (e) {
        return when.reject(e.message || e);
    }
}

function Argument(validators) {
    this.validators = validators || [];
}

Argument.prototype = module.exports = {
    create: function (validators) {
        return new Argument(validators);
    },

    validate: function (data) {
        const validations = this.validators.map(validate.bind(this, data));
        return when.all(validations);
    }
};
