# samplx-argv-parser

`samplx-argv-parser` is a command line interface (CLI) argument parser that is:

* [POSIX "Utility Argument Syntax"](http://pubs.opengroup.org/onlinepubs/9699919799/) compliant
* **Ambiguity aware** - lets you specify how to handle ambiguities such as
  `-bar`, which can mean both `-b -a -r` and `-b=ar`.
* Supports standardized Usage, Version, and Help messages.

```js
var argvParser = require("samplx-argv-parser");
var parserOptions = {
    // program name -- defaults to process.title
    prog : 'sample-program',
    
    // string used to describe the program in help message.
    description : 'A sample program',
    
    // string printed after the help message.
    epilog : 'See more at http://samplx.org/sample-program/'
    
};

var args = argvParser.create(parserOptions);

args.createOption(["-p", "--port"], {
    // All options are optional

    // Implies hasValue: true, which allows parser to read -p2345 as -p=2345
    defaultValue: 8282,

    // Both built-in and custom validations supported,
    // synchronous as well as asynchronous (promise based)
    validators: [argvParser.validators.integer("Custom message. ${1} must be a number.")],

    // Transforms allow you to get more intelligent values
    // than raw strings back
    transform: function (value) { return parseInt(value, 10); },
    
    // how this option is described in a help message.
    description: 'define my port number.',
    
    // how this option's parameter is described in the help message.
    valueName: 'PORT'
});

args.createOption(["-v"], {
    validators: [function (opt) {
        // See also asynchronous validators
        if (opt.timesSet < 1) {
            throw new Error("Set " + opt.signature + " at least once!");
        }
    }]
});

// Operands are statements without options.
// Example: the path in `mything --port=1234 path/to/stuff`
args.createOperand("rootPath", {
    // Used in error msgs
    signature: "Presentation root directory",
    // Both will use default error messages
    validators: [v.file(), v.required()]
});

args.parse(process.argv.slice(2), function (errors, options) {
    if (errors) { 
        args.printUsage(errors);
    }

    // Various useful ways to get the values from the options.
    options["-v"].timesSet;
    options["--port"].isSet;
    // Will be a true number thanks to the transform
    options["--port"].value;
    options.rootPath.value;
});
```

## Methods

### `argvParser.create()`

```js
var args = require("samplx-argv-parser").create(parserOptions);
```

Creates a new instance of samplx-argv-parser that holds a collection of
options and operands.

### `args.createOption(flags[, options])`

```js
args.createOption(["-h", "--help"]);
```

Creates a new `option`. An option has all the properties of an
`argument`, as well as `option.hasValue` and `option.timesSet`. The
`options` object is optional.

### `args.addShorthand(opt, [argv1, ...])`

A shorthand is a convenience method for adding options to your CLI
that simply set other options.

```js
args.createOption("--env", { hasValue: true });
args.addShorthand("--dev", ["--env", "dev"]);
args.addShorthand("--prod", ["--env", "prod"]);
```

This makes passing `--dev` an equlvalent to passing `--env dev`.

### `args.createOperand([name][, options])`

```js
args.createOperand();
```

Creates a new operand. An operand has all the properties of an
`argument`, as well as `greedy: true|false` - i.e. whether or not it
will eat many arguments or just one (defaults to `false`, just one).
The name is optional, and should be a string. The name is used to
access the value through the `options` object passed to the `parse`
callback. If not provided, it defaults to "OPD" (beware when using
more than one operand).

### `args.parse(args, callback)`

Performs parsing and validation of argv. In Node.JS, make sure to discard
the first two items of [process.argv](http://nodejs.org/api/process.html#process_process_argv>), as they
contain unrelated arguments ("node" and the file name).

The callback is called with two arguments, `errors`, which is either
undefined, or an array of errors and/or validation messages, and an
`options` object, which is used to retrieve data from configured options.

```js
var args = require("samplx-argv-parser").create();
args.parse(process.argv.slice(2), function (errors, options) {
    if (errors) {
        // Print an error msg, i.e. console.log(errors[0])
        // may also generate a standard usage message
        return;
    }
    // Continue with normal operation. I.e. options["-v"].hasValue,
    // options["-v"].timesSet, options["-p"].value, etc.
});
```

### `args.printVersion(version [, verbose])`

Prints a standard program version string. If `verbose` is `true` the Node.js version information is also printed.

```js
var args = require("samplx-argv-parser").create();
args.printVersion('1.0.0', true);
```

### `args.printUsage(errors [, verbose])`

Prints a standard usage message to stderr. The first argument `errors` is either undefined, or an
array of errors and/or validation messages. The option second argument is `true` if the usage
message should include the standard help message as well.

```js
var args = require("samplx-argv-parser").create(parserOptions);
// create options, shorthands and operands.
args.parse(process.argv.slice(2), function (errors, options) {
    if (errors) {
        args.printUsage(errors, true);
        process.exit(2);
    }
    // handle normal options.

}
```


## Arguments (options and operands)

Options (`args.createOption` and operands (`args.createOperand`) are
the two types of arguments handled by samplx-argv-parser, and they
share common functionality, listed below this introduction.

An **option** is a flag, with or without a value. `-p`, `-p abc`,
`-pabc`, `-p=abc`, `--port abc` and `--port=abc` are all supported by
samplx-argv-parser.

`-pabc` can mean both `-p -a -b -c` and `-p=abc`. samplx-argv-parser
uses `opt.hasValue` to separate the two. With `opt.hasValue` set to
true, `-pabc` will be handled as `-p=abc`. When false (default), it
will be handled as `-p -a -b -c`. In that case you also need to have
option handlers for `-a`, `-b` and `-c`, or you'll get a validation
error such as `"unknown option -a"` (depending on which option
samplx-argv-parser first encountered that didn't exist).

An **operand** is an option-less value, i.e. `foo` (with no `-b` or
`--myopt` prefixing it). It's commonly used for arguments that always
have to be passed. Examples are `nano path/to/file.txt`, `git checkout
master`, `rmdir my_dir`, etc. The validators `validators.file`,
`validators.directory`, and `validators.fileOrDirectory` are very
useful for operands.

Note that the parser can handle a mix and match of options and
operands in any order, i.e. `mycommand --port 1234 my/directory` and
`mycommand my/directory --port 1234` will both work.

Multiple operands will be applied in order of creation. I.e.
`mycommand something` with two operands will assign `"something"` to
the first and `undefined` to the second, unless the first is greedy,
in which case it will receive all the operand values.

See example usage at the beginning of this document for more
information.

When creating options and operands, the following properties can be
passed in with the "options" object.

### `opt.validators`

An array of validators. A validator is a function that accepts the
argument result object as input. See below for a description of
argument result objects. To fail validation, the validator can either
throw an error, or return a rejecting promise.

### `opt.transform`

A function that transforms the raw string value provided before
assigning it to the `opt.value` property of an argument result object.
The function receives the string value as input, and should return any
value back.

### `opt.hasValue`

If the argument takes a value, set to `true`. Defaults to `false` for
options, is always `true` for operands (thus it can be omitted).

### `opt.defaultValue`

The default value to use if the argument was not provided. When
`opt.defaultValue` is provided, `opt.hasValue` is implied
and can be omitted. The default value should be a string, and will be
validated and transformed like actual values.

### `opt.signature`

The signature is used to identify options and operands in validation errors.
Options automatically gets a signature consisting of the option flags assigned
to it::

```js
var opt = args.createOption(["-v", "--version"]);
opt.signature; // "-v|--version"
opt.signature = "-v"; // custom signature
```

Specifying a signature is more useful for operands, since an operand doesn't
have any data that it can use to auto generate a signature (their default signature
is "OPD").

```js
var rootDir = args.createOperand();
rootDir.signature; // "OPD", as the default name
rootDir.signature = "Root directory";
```

### `opt.valueName`

Used to define the value name for the help message. Defaults to 'VALUE'.

### `opt.description`

Used to define a description of the argument for the help message.

## Options

Options has additional properties that operands doesn't have.

### `opt.requiresValue`

Only makes sense if `opt.hasValue` is `true`. When this property
is `false`, an option can both be provided as a flag with no value or
as an option with a value.

A common example of options that work with and without values are help
options, that may be provided alone to get general help, e.g. `mything
--help`, and with values to get help for specific topics, e.g.
`mything --help bisect`.

### `opt.groupName`

Generates a sub-title in help message. Only define this on the first option
in the option group.

### `opt.allowOverride`

When `true`, allows an option which defines a value to override an earlier option.

### `opt.allowMultiple`

When `true`, allows multiple options. If option defines a value, an `Array` of the
values is used to keep all of the values defined.


## Argument result

Argument result objects are produced when calling `args.parse` to
parse `argv` into the predefined options and operands. There is one
result object per original option/operand. These objects have the
following properties:

### `argumentResult.isSet`

`true` or `false` depending on whether or not the argument was present
in `argv`.

### `argumentResult.value`

The value of the argument. Is normally a string, but may be any object
if the argument had a transform function. If `opt.allowMultiple` is defined,
then the value is an `Array` of argument values.

### `argumentResult.timesSet`

The number of times an argument was set. Useful for options like `-v`
(verbose) which you might want to allow setting multiple times, giving the
user more and more verbose output from your program:

```js
-v // 1
-vv // 2
-v -v -v -v // 4
-v -vv -vv -vvv // 8
```

## Validators

Validators let you add requirements with associated error messages to
options and operands.

samplx-argv-parser has a number of built-in validators, and creating
custom ones is dead simple, as a validator is just a function.

### Built-in validators

The built in validators provides a selection of generic validators.
You can customize the error messages by passing strings with tokens
like `"${1}"` in them. The number and value maps are documented for
each validator.

Validators are functions, yet the built-in validators are used by
calling them directly with custom error messages. This works because
the built-in validators all return the actual validation function.

```js
// Uses built-in error message
argvParser.validators.required();

// Specify your own error message
argvParser.validators.required("${1} has to be set");
```

### `validators.required(errorMessage)`

Fails if the option is not set.

Custom error message:

`${1}`: The option `opt.signature`

### `validators.integer(errorMessage)`

Will fail validation if the option was not an integer, i.e. `"foo"`
and `42.5`.

Custom error message:

`${1}`: The specified number
`${2}`: The option `opt.signature`

### `validators.number(errorMessage)`

Will fail validation if the option was not a number, i.e. `"foo"` and
`?`.

Custom error message:

`${1}`: The specified number
`${2}`: The option `opt.signature`

### `validators.file(errorMessage)`

Will fail validation if the option was not a path pointing to an
existing file in the file system.

Custom error message:

`${1}`: The specified file
`${2}`: The option `opt.signature`

### `validators.directory(errorMessage)`

Will fail validation if the option was not a path pointing to an
existing directory in the file system.

Custom error message:

`${1}`: The specified directory
`${2}`: The option `opt.signature`

### `validators.fileOrDirectory(errorMessage)`

Will fail validation if the option was not a path pointing to an
existing file or directory in the file system. Will fail for block
devices, sockets, etc.

Custom error message:

`${1}`: The specified file or directory
`${2}`: The option `opt.signature`

### `validators.positiveInteger(errorMessage)`

Will fail validation if the option is not a positive integer or the value
`Infinity`.

### `validators.inEnum(values, errorMessage)`

Will fail validation if the value provided is not included in the `Array` of values.

### `validators.maxTimesSet(times, errorMessage)`

Will fail if the option has been defined more than the number of `times`.

### `validators.isURL(errorMessage)`

Will fail if the option is not a valid URL.

### `validators.isURLOrFile(errorMessage)`

Will fail if the option is not a valid URL or an existing file name.

## Custom validators

A validator is a function that throws an error or returns a promise.
If it does not do any of those things, it is immediately considered
passed. The function is passed an argument result object.

```js
args.createOption("-v", {
    validators: [function (opt) {
        if (opt.value == "can not be this value") {
            throw new Error("This is the error message.");
        }
    }]
});
```

Promises are used to facilitate asynchronous validators. Here's an
example of a validator that checks if a file is larger than 1MB::

```js
var when = require("when");
args.createOption(["-f"], {
    validators: [function (opt) {
        var deferred = when.defer();
        fs.stat(opt.value, function (err, stat) {
            if (err) { deferred.reject("Unknown error: " + err); }

            if (stat.size > 1024) {
                deferred.reject(opt.value +
                    " (" + opt.signature + ") was larger than 1MB");
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    }]
});
```

Given `--myopt /path/to/file` and the file is larger than 1MB, you'll
get the error message `"/path/to/file (--myopt) was larger than 1MB"`.

Rejecting the promise counts as an error. The first argument should be
a string, and is the error message. (TODO: This will likely change to
an error object with a `message` property).

## Transforms

Transforms can mutate the values of options. A transform is a simple
function that receives the raw string value as input, and can return
whatever it likes.::

```js
args.createOption(["-p"], {
    transform: function (value) { return parseInt(value, 10); }
});
```

## Types

Types are predefined "options" objects that you can pass when creating
options and/or operands. For instance, the "number" type includes the
number validator, sets `opt.hasValue` to `true`, and includes a
transform that converts the raw string to an actual number (by way of
`parseFloat`)::

```js
args.createOption(["-n"], args.types.number());
```

Note that the type is a function call - it returns the options object.
You can pass in additional options. The following example piggy-backs
the number type to create an option that only takes positive numbers::

```js
args.createOption(["-n"], args.types.number({
    validators: [function (opt) {
        if (parseFloat(opt.value) < 0) {
            throw new Error("Oh noes, negative number!");
        }
    }]
}));
```


