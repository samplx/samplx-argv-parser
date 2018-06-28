/*jslint maxlen: 100 */
"use strict";

const buster = require("buster");
const assert = buster.assert;
const refute = buster.refute;
const args = require("./../lib/samplx-argv-parser");
const path = require("path");
const net = require("net");
const fs = require("fs");
const when = require("when");
const v = args.validators;

buster.testCase("validators", {
    setUp: function () {
        this.a = args.create();
        this.stubFsStat = function (options) {
            this.stub(fs, "stat").yields(options.error, {
                isFile: this.stub().returns(!!options.isFile),
                isDirectory: this.stub().returns(!!options.isDirectory)
            });
        };
        this.validatedOption = function (validator) {
            this.a.createOption(["-p"], {
                hasValue: true,
                validators: [validator]
            });
        };
        this.multipleValidatedOption = function (validator) {
            this.a.createOption(["-m"], {
                hasValue: true,
                allowMultiple: true,
                validators: [validator]
            });
        };
        this.validatedOperand = function (validator) {
            this.a.createOperand("rest", { validators: [validator] });
        };
    },

    "basic validator with error": function (done) {
        const actualError = "An error message";
        this.a.createOption(["-p"], {
            validators: [function (opt) { return when.reject(actualError); }]
        });

        this.a.parse(["-p"], done(function (errors) {
            assert.equals(errors.length, 1);
            assert.equals(errors[0], actualError);
        }));
    },

    "basic validator without error": function (done) {
        this.a.createOption(["-p"], {
            validators: [function (opt) { return when(); }]
        });

        this.a.parse(["-p"], done(function (errors) {
            refute(errors);
        }));
    },

    "adds validator that uses the value of the option": function (done) {
        this.a.createOption(["-p"], {
            hasValue: true,
            validators: [function (opt) {
                return when.reject(opt.value + " is crazy.");
            }]
        });

        this.a.parse(["-p1234"], done(function (errors) {
            assert.equals(errors.length, 1);
            assert.equals(errors[0], "1234 is crazy.");
        }));
    },

    "passes for non-promise return value from validator": function (done) {
        this.a.createOption(["-p"], {
            validators: [function (opt) { return 42; }]
        });

        this.a.parse(["-p"], done(function (errors) {
            refute(errors);
        }));
    },

    "passes for falsy return value from validator": function (done) {
        this.a.createOption(["-p"], {
            validators: [function (opt) { return false; }]
        });

        this.a.parse(["-p"], done(function (errors) {
            refute(errors);
        }));
    },

    "fails for validator throwing exception": function (done) {
        this.a.createOption(["-p"], {
            validators: [function (opt) { throw new Error("Oh my jeebus"); }]
        });

        this.a.parse(["-p"], done(function (errors) {
            assert.equals(errors.length, 1);
            assert.match(errors[0], "Oh my jeebus");
        }));
    },

    "integer": {
        setUp: function () {
            this.validatedOption(v.integer());
            this.multipleValidatedOption(v.integer());
        },

        "test passing integer": function (done) {
            this.a.parse(["-p123"], done(function (errors) {
                refute(errors);
            }));
        },

        "test without option": function (done) {
            this.a.parse([], done(function (errors) {
                refute(errors);
            }));
        },

        "test passing string": function (done) {
            this.a.parse(["-pabc"], done(function (errors) {
                assert.equals(errors.length, 1);
                assert.match(errors[0], "abc");
                assert.match(errors[0], /not an integer/);
            }));
        },

        "test passing comma float": function (done) {
            this.a.parse(["-p123,4"], done(function (errors) {
                assert.equals(errors.length, 1);
                assert.match(errors[0], "123,4");
                assert.match(errors[0], /not an integer/);
            }));
        },

        "test passing dot float": function (done) {
            this.a.parse(["-p123.4"], done(function (errors) {
                assert.equals(errors.length, 1);
                assert.match(errors[0], "123.4");
                assert.match(errors[0], /not an integer/);
            }));
        },
        "test passing multiple integers": function (done) {
            this.a.parse(["-m1", "-m2"], done(function (errors) {
                refute(errors);
            }));
        },
    },

    "number": {
        setUp: function () {
            this.validatedOption(v.number());
        },

        "passes for integer": function (done) {
            const self = this;
            this.a.parse(["-p123"], done(function (errors) {
                refute(errors);
            }));
        },

        "fails on letters": function (done) {
            this.a.parse(["-pabc"], done(function (errors) {
                assert.equals(errors.length, 1);
                assert.match(errors[0], "abc");
                assert.match(errors[0], /not a number/);
            }));
        },

        "fails for float with comma": function (done) {
            this.a.parse(["-p123,4"], done(function (errors) {
                assert.equals(errors.length, 1);
                assert.match(errors[0], "123,4");
                assert.match(errors[0], /not a number/);
            }));
        },

        "passes for float with dot": function (done) {
            this.a.parse(["-p123.4"], done(function (errors) {
                refute(errors);
            }));
        },

        "passes for float with leading +": function (done) {
            this.a.parse(["-p+123.4"], done(function (errors) {
                refute(errors);
            }));
        },

        "passes for float with leading -": function (done) {
            this.a.parse(["-p-123.4"], done(function (errors) {
                refute(errors);
            }));
        }
    },

    "required": {
        "for option with value": {
            setUp: function () {
                this.validatedOption(v.required());
            },

            "test setting option with value": function (done) {
                this.a.parse(["-pfoo"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test not setting option": function (done) {
                this.a.parse([], done(function (errors) {
                    assert.defined(errors);
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], "-p");
                    assert.match(errors[0], /is required/);
                }));
            }
        },

        "for option without value": {
            setUp: function () {
                this.a.createOption(["-p"], { validators: [v.required()] });
            },

            "test setting option": function (done) {
                this.a.parse(["-p"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test not setting option": function (done) {
                this.a.parse([], done(function (errors) {
                    assert.defined(errors);
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], "-p");
                    assert.match(errors[0], /is required/);
                }));
            }
        }
    },

    "directory": {
        "operand": {
            setUp: function () {
                this.validatedOperand(v.directory());
            },

            "test on existing directory": function (done) {
                this.stubFsStat({ isDirectory: true });
                this.a.parse(["/some/dir"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test on existing file": function (done) {
                this.stubFsStat({ isFile: true });
                this.a.parse(["/some/dir"], done(function (errors) {
                    assert.defined(errors);
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /is not a directory/i);
                    assert.match(errors[0], "/some/dir");
                }));
            },

            "test on none existing file/directory": function (done) {
                this.stubFsStat({ isFile: false, isDirectory: false });
                this.a.parse(["/dev/null"], done(function (errors) {
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /is not a directory/i);
                    assert.match(errors[0], "/dev/null");
                }));
            },

            "test no value": function (done) {
                this.a.parse([], done(function (errors) {
                    refute(errors);
                }));
            }
        }
    },

    "file": {
        "operand": {
            setUp: function () {
                this.validatedOperand(v.file());
            },

            "test on existing directory": function (done) {
                this.stubFsStat({ isDirectory: true });
                this.a.parse(["/var/lib"], done(function (errors) {
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /is not a file/i);
                    assert.match(errors[0], "/var/lib");
                }));
            },

            "test on existing file": function (done) {
                this.stubFsStat({ isFile: true });
                this.a.parse(["/some/file.txt"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test on non-existing file/directory": function (done) {
                this.stubFsStat({ isFile: false, isDirectory: false });
                this.a.parse(["/dev/null"], done(function (errors) {
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /is not a file/i);
                    assert.match(errors[0], "/dev/null");
                }));
            },

            "test no value": function (done) {
                this.a.parse([], done(function (errors) {
                    refute(errors);
                }));
            }
        }
    },

    "fileOrDirectory": {
        "operand": {
            setUp: function () {
                this.validatedOperand(v.fileOrDirectory());
            },

            "test on existing directory": function (done) {
                this.stubFsStat({ isDirectory: true });
                this.a.parse(["/var/lib"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test on existing file": function (done) {
                this.stubFsStat({ isFile: true });
                this.a.parse(["/some/file"], done(function (errors) {
                    refute(errors);
                }));
            },

            "test on non-existing file/directory": function (done) {
                this.stubFsStat({ isFile: false, isDirectory: false });
                this.a.parse(["/dev/null"], done(function (errors) {
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /not a file or directory/i);
                    assert.match(errors[0], "/dev/null");
                }));
            },

            "test no value": function (done) {
                this.a.parse([], done(function (errors) {
                    assert(true);
                }));
            },

            "test with existing item that isn't file or directory": function (done) {
                this.stub(fs, "stat").yields(null, {
                    isFile: this.stub().returns(false),
                    isDirectory: this.stub().returns(false)
                });

                this.a.parse(["/dev/null"], done(function (errors) {
                    assert.equals(errors.length, 1);
                    assert.match(errors[0], /not a file or directory/i);
                    assert.match(errors[0], "/dev/null");
                }));
            }
        }
    },

    "inEnum": {
        "operand": {
            setUp: function () {
                this.validatedOperand(v.inEnum(["1", "2"]));
            },

            "passes when operand is in enum": function (done) {
                this.a.parse(["1"], done(function (errors) {
                    refute(errors);
                }));
            },

            "fails when operand is not in enum": function (done) {
                this.a.parse(["3"], done(function (errors) {
                    assert(errors instanceof Array);
                }));
            },

            "fails with readable message": function (done) {
                this.a.parse(["3"], done(function (errors) {
                    assert.match(errors[0], "expected one of [1, 2], got 3");
                }));
            },

            "passes when there's no argument": function (done) {
                this.a.parse([], done(function (errors) {
                    refute(errors);
                }));
            }
        }
    },

    "maxTimesSet": {
        "passes if not set": function (done) {
            this.a.createOption(["-v"], { allowMultiple: true, validators: [v.maxTimesSet(2)] });
            this.a.parse([], done(function (errors, options) {
                refute(errors);
            }));
        },

        "passes if set few enough times": function (done) {
            this.a.createOption(["-v"], { allowMultiple: true, validators: [v.maxTimesSet(2)] });
            this.a.parse(["-v"], done(function (errors, options) {
                refute(errors);
            }));
        },

        "passes if set max times": function (done) {
            this.a.createOption(["-v"], { allowMultiple: true, validators: [v.maxTimesSet(2)] });
            this.a.parse(["-v", "-v"], done(function (errors, options) {
                refute(errors);
            }));
        },

        "fails if passed too many times": function (done) {
            this.a.createOption(["-v"], { allowMultiple: true, validators: [v.maxTimesSet(2)] });
            this.a.parse(["-v", "-v", "-v"], done(function (errors, options) {
                assert(errors);
            }));
        },

        "fails with understandable error": function (done) {
            this.a.createOption(["-v"], { allowMultiple: true, validators: [v.maxTimesSet(2)] });
            this.a.parse(["-v", "-v", "-v"], done(function (errors, options) {
                assert.match(errors[0], "-v: can only be set 2 times");
            }));
        },

        "fails with custom error": function (done) {
            this.a.createOption(["-v"], {
                allowMultiple: true,
                validators: [v.maxTimesSet(2, "${1} iz ${2}!")]
            });
            this.a.parse(["-v", "-v", "-v"], done(function (errors, options) {
                assert.match(errors[0], "-v iz 2!");
            }));
        }
    },

    "positiveInteger": {
        setUp: function() {
            this.validatedOption(v.positiveInteger());
            this.multipleValidatedOption(v.positiveInteger());
        },

        "test Infinity value": function (done) {
            this.a.parse(["-p", "Infinity"], done(function (errors, options) {
                refute(errors);
                assert.equals(options["-p"].value, "Infinity");
            }));
        },

        "test negative integer": function (done) {
            this.a.parse(["-p=-12"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },

        "test positive integer": function (done) {
            this.a.parse(["-p", "12"], done(function (errors, options) {
                refute(errors);
                assert.equals(options["-p"].value, "12");
            }));
        },

        "test zero": function (done) {
            this.a.parse(["-p", "0"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },

        "test floating number": function (done) {
            this.a.parse(["-p", "3.14"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },

        "test non-number": function (done) {
            this.a.parse(["-p", "twelve"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },

        "test multiple positive integers": function (done) {
            this.a.parse(["-m", "1", "-m", "2"], done(function (errors, options) {
                refute(errors);
                assert(Array.isArray(options["-m"].value));
                assert(options["-m"].value.length == 2);
            }));
        },

        "test one positive, one negative integer": function (done) {
            this.a.parse(["-m", "1", "-m=-1"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },

        "test multiple non-numbers": function (done) {
            this.a.parse(["-m=two", "-m=one"], done(function (errors, options) {
                assert(errors);
                assert.match(errors[0], /is not a positive integer/);
            }));
        },
    },

    "isURL": {
        setUp: function() {
            this.a.createOption(["--url"], { hasValue: true, validators: [v.isURL()] });
        },

        "http URL" : function (done) {
            this.a.parse(["--url", "http://example.com"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com");
            }));
        },

        "scheme authority path URL" : function(done) {
            this.a.parse(["--url", "http://example.com/myfile"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com/myfile");
            }));
        },

        "scheme authority path query URL" : function (done) {
            this.a.parse(["--url", "http://example.com/index.php?what=now"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com/index.php?what=now");
            }));
        },

        "scheme authority path query fragment URL" : function (done) {
            this.a.parse(["--url", "http://example.com/index.php?what=now#there"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com/index.php?what=now#there");
            }));
        },

        "scheme authority no-path query URL" : function (done) {
            this.a.parse(["--url", "http://example.com/?what=now"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com/?what=now");
            }));
        },

        "scheme authority no-path no-query fragement URL": function (done) {
            this.a.parse(["--url", "http://example.com#there"], done(function (errors, options) {
                assert.equals(options["--url"].value, "http://example.com#there");
            }));
        },

        "no scheme invalid URL": function (done) {
            this.a.parse(["--url", "example.com"], done(function (errors, options) {
                assert.equals(options["--url"].value, "example.com");
            }));
        },
    },

    "custom error messages": {
        "test integer": function (done) {
            this.validatedOption(v.integer("I love ${2}!"));
            this.a.parse(["-p", "not a number"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "I love not a number!");
            }));
        },

        "test integer with signature": function (done) {
            this.validatedOption(v.integer("Yay ${2} and ${1}!"));
            this.a.parse(["-p", "not a number"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Yay not a number and -p!");
            }));
        },

        "test number": function (done) {
            this.validatedOption(v.number("I love ${2}!"));
            this.a.parse(["-p", "not a number"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "I love not a number!");
            }));
        },

        "test number with signature": function (done) {
            this.a.createOption(["-p"], {
                hasValue: true,
                validators: [v.number("I love ${2} and ${1}!")]
            });
            this.a.parse(["-p", "not a number"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "I love not a number and -p!");
            }));
        },

        "test required": function (done) {
            this.a.createOption(["-p"], {
                hasValue: true,
                validators: [v.required("I love ${1}!")]
            });
            this.a.parse([], done(function (errors) {
                assert.defined(errors);
                assert.equals(errors[0], "I love -p!");
            }));
        },

        "test file with no such file or dir": function (done) {
            this.stubFsStat({ isFile: false, isDirectory: false });
            this.a.createOption(["-p"], {
                hasValue: true,
                validators: [v.file("Foo ${2}")]
            });
            this.a.parse(["-p", "/dev/null"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /dev/null");
            }));
        },

        "test file with directory": function (done) {
            this.stubFsStat({ isDirectory: true });
            this.a.createOption(["-p"], {
                hasValue: true,
                validators: [v.file("Foo ${2}")]
            });
            this.a.parse(["-p", "/some/dir"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /some/dir");
            }));
        },

        "test dir with no such file or dir": function (done) {
            this.stubFsStat({ isFile: false, isDirectory: false });
            this.validatedOption(v.directory("Foo ${2}"));
            this.a.parse(["-p", "/dev/null"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /dev/null");
            }));
        },

        "test dir with file": function (done) {
            this.stubFsStat({ isFile: true });
            this.validatedOption(v.directory("Foo ${2}"));
            this.a.parse(["-p", "/some/file"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /some/file");
            }));
        },

        "test fileOrDir with no such file or dir": function (done) {
            this.stubFsStat({ isFile: false, isDirectory: false });
            this.validatedOption(v.fileOrDirectory("Foo ${2}"));
            this.a.parse(["-p", "/dev/null"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /dev/null");
            }));
        },

        "test fileOrDir with existing but not file or dir": function (done) {
            this.stub(fs, "stat").yields(null, {
                isFile: this.stub().returns(false),
                isDirectory: this.stub().returns(false)
            });

            this.validatedOption(v.fileOrDirectory("Foo ${2}"));
            this.a.parse(["-p", "/dev/null"], done(function (errors) {
                assert(errors);
                assert.equals(errors[0], "Foo /dev/null");
            }));
        }
    },

    "should not be able to mutate argument": function (done) {
        this.a.createOption(["-p"], {
            validators: [function (o) {
                o.isSet = false;
                o.value = "test";
                o.whatever = 123;
            }]
        });

        this.a.parse(["-p"], done(function (errors, options) {
            refute(errors);
            assert(options["-p"].isSet);
            refute(options["-p"].value);
            refute(options["-p"].hasOwnProperty("whatever"));
        }));
    },

    "operands should not be able to mutate argument": function (done) {
        this.a.createOperand({
            validators: [function (o) {
                o.isSet = false;
                o.value = "test";
                o.whatever = 123;
            }]
        });

        this.a.parse(["--", "hey"], done(function (errors, options) {
            refute(errors);
            assert(options.OPD.isSet);
            assert.equals(options.OPD.value, "hey");
            refute(options.OPD.hasOwnProperty("whatever"));
        }));
    }
});
