"use strict";

const args = require("./../lib/samplx-argv-parser");
const path = require("path");
const net = require("net");
jest.mock('fs');
const fs = require("fs");
const when = require("when");
const v = args.validators;

var a = null;

beforeEach(() => {
    a = args.create();
});

const validatedOption = (validator, hasValue) => {
    a.createOption(["-p"], {
        hasValue: hasValue,
        validators: [validator]
    });
};


const multipleValidatedOption = (validator) => {
    a.createOption(["-m"], {
        hasValue: true,
        allowMultiple: true,
        validators: [validator]
    });
};

const validatedOperand = (validator) => {
    a.createOperand("rest", {
        validators: [ validator ]
    });
};

describe("validators", () => {
    test("basic validator with error", done => {
        const actualError = "An error message";
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toMatch(actualError);
            done();
        }
        const validator = (opt) => {
            return when.reject(actualError);
        }

        a.createOption(["-p"], {
            validators: [validator]
        });
        a.parse(["-p"], callback);
    });

    test("basic validator without error", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            done();
        }
        const validator = (opt) => {
            return when();
        }

        a.createOption(["-p"], {
            validators: [validator]
        });
        a.parse(["-p"], callback);
    });

    test("adds validator that uses the value of the option", done => {
        const expectedError = "1234 is crazy.";
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toEqual(expectedError);
            done();
        }
        const validator = (opt) => {
            return when.reject(opt.value + " is crazy.");
        }

        a.createOption(["-p"], {
            hasValue: true,
            validators: [validator]
        });
        a.parse(["-p1234"], callback);
    });

    test("passes for non-promise return value from validator", done => {
        const expectedError = "1234 is crazy.";
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            done();
        }
        const validator = (opt) => {
            return 42;
        }

        a.createOption(["-p"], {
            validators: [validator]
        });
        a.parse(["-p"], callback);
    });

    test("passes for falsy return value from validator", done => {
        const expectedError = "1234 is crazy.";
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            done();
        }
        const validator = (opt) => {
            return false;
        }

        a.createOption(["-p"], {
            validators: [validator]
        });
        a.parse(["-p"], callback);
    });

    test("fails for validator throwing exceptions", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toMatch(/Oh my/);
            done();
        }
        const validator = (opt) => {
            throw new Error("Oh my");
        }

        a.createOption(["-p"], {
            validators: [validator]
        });
        a.parse(["-p"], callback);
    });

    describe("integer", () => {
        beforeEach(() => {
            validatedOption(v.integer(), true);
            multipleValidatedOption(v.integer());
        });

        test("test passing integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-p123"], callback);
        });

        test("test without option", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });

        test("test passing string", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/abc/);
                expect(error).toMatch(/not an integer/);
                done();
            }

            a.parse(["-pabc"], callback);
        });

        test("test passing comma float", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/123,4/);
                expect(error).toMatch(/not an integer/);
                done();
            }

            a.parse(["-p123,4"], callback);
        });

        test("test passing dot float", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/123.4/);
                expect(error).toMatch(/not an integer/);
                done();
            }

            a.parse(["-p123.4"], callback);
        });

        test("test passing multiple integers", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-m1", "-m2"], callback);
        });
    });

    describe("number", () => {
        beforeEach(() => {
            validatedOption(v.number(), true);
            multipleValidatedOption(v.number());
        });

        test("passes for integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-p123"], callback);
        });

        test("fails on letters", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/abc/);
                expect(error).toMatch(/not a number/);
                done();
            }

            a.parse(["-pabc"], callback);
        });
        
        test("fails for float with comma", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/123,4/);
                expect(error).toMatch(/not a number/);
                done();
            }

            a.parse(["-p123,4"], callback);
        });

        test("passes for float with dot", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-p123.4"], callback);
        });

        test("passes for float with leading +", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-p+123.4"], callback);
        });

        test("passes for float with leading -", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-p-123.4"], callback);
        });

        test("test passing multiple integers", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-m1", "-m2"], callback);
        });
    });

    describe("required", () => {
        describe("for option with value", () => {
            beforeEach(() => {
                validatedOption(v.required(), true);
            });
    
            test("test setting option with value", done => {
                const callback = (errors, options) => {
                    expect(Array.isArray(errors)).toBeFalsy();
                    done();
                }
    
                a.parse(["-pfoo"], callback);
            });
    
            test("test setting option with empty value", done => {
                const callback = (errors, options) => {
                    expect(Array.isArray(errors)).toBeFalsy();
                    done();
                }
    
                a.parse(["-p", ""], callback);
            });
    
            test("test not setting option", done => {
                const callback = (errors, options) => {
                    expect(Array.isArray(errors)).toBeTruthy();
                    expect(errors.length).toBe(1);
                    const error = errors[0];
                    expect(error).toMatch(/-p/);
                    expect(error).toMatch(/is required/);
                    done();
                }
    
                a.parse([], callback);
            });
            
        });

        describe("for option without value", () => {
            beforeEach(() => {
                validatedOption(v.required(), false);
            });
    
            test("test setting option", done => {
                const callback = (errors, options) => {
                    expect(Array.isArray(errors)).toBeFalsy();
                    done();
                }
    
                a.parse(["-p"], callback);
            });
    
            test("test not setting option", done => {
                const callback = (errors, options) => {
                    expect(Array.isArray(errors)).toBeTruthy();
                    expect(errors.length).toBe(1);
                    const error = errors[0];
                    expect(error).toMatch(/-p/);
                    expect(error).toMatch(/is required/);
                    done();
                }
    
                a.parse([], callback);
            });
            
        });
    });

    describe("directory", () => {
        beforeEach(() => {
            validatedOperand(v.directory());
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
        });

        test("test on existing directory", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["/some/directory"], callback);
        });

        test("test on existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch("/some/file");
                expect(error).toMatch(/is not a directory/i);
                done();
            }

            a.parse(["/some/file"], callback);
        });

        test("test on non-existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch("/missing-file");
                expect(error).toMatch(/is not a directory/i);
                done();
            }

            a.parse(["/missing-file"], callback);
        });

        test("test no value", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });
    });

    describe("file", () => {
        beforeEach(() => {
            validatedOperand(v.file());
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
        });

        test("test on existing directory", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch("/some/directory");
                expect(error).toMatch(/is not a file/i);
                done();
            }

            a.parse(["/some/directory"], callback);
        });

        test("test on existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["/some/file"], callback);
        });

        test("test on non-existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch("/missing-file");
                expect(error).toMatch(/is not a file/i);
                done();
            }

            a.parse(["/missing-file"], callback);
        });

        test("test no value", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });
    });

    describe("fileOrDirectory", () => {
        beforeEach(() => {
            validatedOperand(v.fileOrDirectory());
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
        });

        test("test on existing directory", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["/some/directory"], callback);
        });

        test("test on existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["/some/file"], callback);
        });

        test("test on non-existing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch("/missing-file");
                expect(error).toMatch(/is not a file or directory/i);
                done();
            }

            a.parse(["/missing-file"], callback);
        });

        test("test no value", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });
    });


    describe("inEnum", () => {
        beforeEach(() => {
            validatedOperand(v.inEnum(["1", "2"]));
        });

        test("passes when operand is in enum", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["1"], callback);
        });

        test("fails when operand is not in enum", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/expected one of \[1, 2\], got 3/);
                done();
            }

            a.parse(["3"], callback);
        });

        test("passes when there's no argument", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });
    });

    describe("maxTimeSet", () => {
        beforeEach(() => {
            a.createOption(["-v"], {
                allowMultiple: true,
                validators: [ v.maxTimesSet(2) ]
            });
        });

        test("passes if not set", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });

        test("passes if set few enough times", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-v"], callback);
        });

        test("passes if set max times", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse(["-v", "-v"], callback);
        });

        test("fails if passed too many times", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/can only be set 2 times/);
                done();
            }
            a.parse(["-v", "-v", "-v"], callback);
        });
    });


    describe("positiveInteger", () => {
        beforeEach(() => {
            validatedOption(v.positiveInteger(), true);
            multipleValidatedOption(v.positiveInteger());
        });

        test("test Infinity value", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["-p"].isSet).toBeTruthy();
                expect(options["-p"].value).toEqual("Infinity");
                done();
            }

            a.parse(["-p", "Infinity"], callback);
        });

        test("test negative integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/-12/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-p=-12"], callback);
        });

        test("test positive integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["-p"].isSet).toBeTruthy();
                expect(options["-p"].value).toEqual("12");
                done();
            }

            a.parse(["-p12"], callback);
        });

        test("test zero", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/0/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-p0"], callback);
        });

        test("test without option", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            }

            a.parse([], callback);
        });

        test("test passing string", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/abc/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-pabc"], callback);
        });

        test("test passing comma float", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/123,4/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-p123,4"], callback);
        });

        test("test passing dot float", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/123.4/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-p123.4"], callback);
        });

        test("test passing multiple integers", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors, options)).toBeFalsy();
                done();
            }

            a.parse(["-m1", "-m2"], callback);
        });

        test("test one positive, one negative integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/-1/);
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-m1", "-m", "-1"], callback);
        });

        test("test multiple non-numbers", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/not a positive integer/);
                done();
            }

            a.parse(["-m=two", "-m=one"], callback);
        });
    });
    
    describe("isURL", () => {
        beforeEach(() => {
            a.createOption(["--url"], {
                hasValue: true,
                validators: [ v.isURL() ]
            });
            a.createOption(["-m"], {
                hasValue: true,
                validators: [ v.isURL() ],
                allowMultiple: true
            })
        });

        const checkURL = (url, done) => {
            const callback = (errors, options) => {
                if (Array.isArray(errors)) {
                    console.dir(errors);
                }
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["--url"].isSet).toBeTruthy();
                expect(options["--url"].value).toEqual(url);
                done();
            };

            a.parse(["--url", url], callback);
        };

        test("http URL", done => {
            checkURL("http://example.com", done);
        });

        test("scheme authority path URL", done => {
            checkURL("http://example.com/myfile", done);
        });

        test("scheme authority path query URL", done => {
            checkURL("http://example.com/index.php?what=now", done);
        });

        test("scheme authority path query fragment URL", done => {
            checkURL("http://example.com/index.php?what=now#there", done);
        });

        test("scheme authority no-path query URL", done => {
            checkURL("http://example.com/?what=now", done);
        });

        test("scheme authority no-path no-query fragement URL", done => {
            checkURL("http://example.com#there", done);
        });

        test("no scheme URL", done => {
            checkURL("example.com", done);
        });

        test("multiple arguments", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["-m"].isSet).toBeTruthy();
                expect(options["-m"].timesSet).toBe(2);
                const val = options["-m"].value;
                expect(Array.isArray(val)).toBeTruthy();
                done();
            }

            a.parse(["-m", "http://example.com/index.php", "-m", "http://google.com/"], callback);
        });

        test("invalid URL", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                done();
            }

            a.parse(["--url", "?#h#//example.com?/#/#/#"], callback);
        });
    });

    describe("isURLOrFile", () => {
        beforeEach(() => {
            a.createOption(["--url"], {
                hasValue: true,
                validators: [ v.isURLOrFile() ]
            });
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
        });

        const checkURL = (url, done) => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["--url"].isSet).toBeTruthy();
                expect(options["--url"].value).toEqual(url);
                done();
            };

            a.parse(["--url", url], callback);
        };

        test("http URL", done => {
            checkURL("http://example.com", done);
        });

        test("scheme authority path URL", done => {
            checkURL("http://example.com/myfile", done);
        });

        test("scheme authority path query URL", done => {
            checkURL("http://example.com/index.php?what=now", done);
        });

        test("scheme authority path query fragment URL", done => {
            checkURL("http://example.com/index.php?what=now#there", done);
        });

        test("scheme authority no-path query URL", done => {
            checkURL("http://example.com/?what=now", done);
        });

        test("scheme authority no-path no-query fragement URL", done => {
            checkURL("http://example.com#there", done);
        });

        test("file", done => {
            checkURL("/some/file", done);
        });

        test("missing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/is neither a file nor a URL/);
            
                done();
            };

            a.parse(["--url", ":::missing:::"], callback);
        });

        test("invalid url and missing file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/is neither a file nor a URL/);
            
                done();
            };

            a.parse(["--url", "?#h#//example.com?/#/#/#"], callback);
        });

        test("missing arg", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                done();
            };

            a.parse(["--url"], callback);
        });

        test("empty arg", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                done();
            };

            a.parse(["--url", ""], callback);
        });
    });

    describe("custom error messages", () => {

        test("integer", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("I love not a number!");
                done();
            };

            validatedOption(v.integer("I love ${2}!"), true);
            a.parse(["-p", "not a number"], callback);
        });

        test("integer with signature", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Yay not a number and -p!");
                done();
            };

            validatedOption(v.integer("Yay ${2} and ${1}!"), true);
            a.parse(["-p", "not a number"], callback);
        });

        test("number", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("I love not a number!");
                done();
            };

            validatedOption(v.number("I love ${2}!"), true);
            a.parse(["-p", "not a number"], callback);
        });

        test("number with signature", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Yay not a number and -p!");
                done();
            };

            validatedOption(v.number("Yay ${2} and ${1}!"), true);
            a.parse(["-p", "not a number"], callback);
        });

        test("required", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("I love -p!");
                done();
            };

            validatedOption(v.required("I love ${1}!"), true);
            a.parse([], callback);
        });

        test("file", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/directory!");
                done();
            };

            validatedOption(v.file("Foo ${2}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/directory"], callback);
        });

        test("file with signature", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/directory as -p!");
                done();
            };

            validatedOption(v.file("Foo ${2} as ${1}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/directory"], callback);
        });

        test("directory", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/file!");
                done();
            };
    
            validatedOption(v.directory("Foo ${2}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/file"], callback);
        });
    
        test("directory with signature", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/file as -p!");
                done();
            };
    
            validatedOption(v.directory("Foo ${2} as ${1}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/file"], callback);
        });

        test("fileOrDirectory", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/other-file!");
                done();
            };
    
            validatedOption(v.fileOrDirectory("Foo ${2}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/other-file"], callback);
        });
    
        test("fileOrDirectory with signature", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBeGreaterThan(0);
                const error = errors[0];
                expect(error).toEqual("Foo /some/other-file as -p!");
                done();
            };
    
            validatedOption(v.fileOrDirectory("Foo ${2} as ${1}!"), true);
            fs.__setMockFiles([
                "/some/directory/",
                "/some/file"
            ]);
            a.parse(["-p", "/some/other-file"], callback);
        });        
    });

    describe("mutate", () => {
        test("should not be able to mutate argument", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options["-p"].isSet).toBeTruthy();
                expect(options["-p"].value).toBeUndefined();
                expect(options["-p"].hasOwnProperty("whatever")).toBeFalsy();
                done();
            };

            a.createOption(["-p"], {
                validators: [
                    opt => {
                        opt.isSet = false;
                        opt.value = "test";
                        opt.whatever = 123;
                    }
                ]
            });
            a.parse(["-p"], callback);
        });

        test("operands should not be able to mutate argument", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeFalsy();
                expect(options.OPD.isSet).toBeTruthy();
                expect(options.OPD.value).toEqual("hey");
                expect(options.OPD.hasOwnProperty("whatever")).toBeFalsy();
                done();
            };

            a.createOperand({
                validators: [
                    opt => {
                        opt.isSet = false;
                        opt.value = "test";
                        opt.whatever = 123;
                    }
                ]
            });
            a.parse(["--", "hey"], callback);
        });
    });
});
