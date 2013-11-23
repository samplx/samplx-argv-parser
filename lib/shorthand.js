// Enable JavaScript strict mode.
"use strict";

function Shorthand(option, expansion) {
    this.option = option;
    this.expansion = expansion;
}

Shorthand.prototype = module.exports = {
    create: function (option, expansion) {
        if (!(expansion instanceof Array)) {
            throw new Error("Shorthand expansion must be an array.");
        }
        return new Shorthand(option, expansion);
    },

    recognizes: function (option) {
        if (option.slice(1, 2) != "-") {
            return this.option == option.slice(0, 2);
        }
   
        return this.option === option;
    },

    expand: function (args) {
        return args.reduce(function (expanded, arg) {
            var expansion = arg;
            if (this.recognizes(arg)) {
                if ((arg.slice(1, 2) != "-") && (arg.length > 2)) {
                    expansion = this.expansion.concat(this.expand(["-" + arg.slice(2)]));
                } else {
                    expansion = this.expansion;
                }
            }
            return expanded.concat(expansion);
        }.bind(this), []);
    }
};
