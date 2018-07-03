'use strict';

const args = require("./../lib/samplx-argv-parser");

var a = Object.create(null);

describe("samplx-argv-parser", () => {

    const cons = {
        log: jest.fn(),
        error: jest.fn()
    };

    beforeEach(() => {
        jest.resetAllMocks();
        a = args.create({}, cons);
    });

    test("not passing any options", () => {
        const createEmpty = () => {
            a.createOption([]);
        };

        expect(createEmpty).toThrow();
    });

    test("handling non-existent option errors", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            expect(error).toMatch(/-z/);
            done();
        };

        a.createOption(["-p"]);
        a.parse(["-z"], callback);
    });

    test("one and two dash option with both passed, single first", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            done();
        };

        a.createOption(["-p"]);
        a.createOption(["--port"]);
        a.parse(["-p", "--port"], callback);
    });

    test("one and two dash option with both passed, double first", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            done();
        };

        a.createOption(["-p"]);
        a.createOption(["--port"]);
        a.parse(["--port", "-p"], callback);
    });

    test("one and two dash option with only double dash passed", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            done();
        };

        a.createOption(["-p"]);
        a.createOption(["--port"]);
        a.parse(["--port"], callback);
    });

    test("one and two dash option with only single dash passed", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["--port"].isSet).toBeFalsy();
            done();
        };

        a.createOption(["-p"]);
        a.createOption(["--port"]);
        a.parse(["-p"], callback);
    });

    const checkCreateOption = (option) => {
        return () => {
            a.createOption(option);
        };
    };

    test("same options specified twice in one option", () => {
        expect(checkCreateOption(["-p", "-p"])).toThrow();

        expect(checkCreateOption(["--port", "--port"])).toThrow();
    });

    test("same options specified in different option", () => {
        a.createOption(["-p"]);
        expect(checkCreateOption(["-p"])).toThrow();
        
        a.createOption(["--port"]);
        expect(checkCreateOption(["--port"])).toThrow();
    });

    describe("transform", () => {
        test("throws if transform is not a function", () => {
            const checkOption = () => {
                a.createOption(["-p"], {
                    transform: {}
                });
            };
            expect(checkOption).toThrow();
        });

        test("handles throw during transform", done => {
            const callback = (errors, options) => {
                expect(Array.isArray(errors)).toBeTruthy();
                expect(errors.length).toBe(1);
                const error = errors[0];
                expect(error).toMatch(/transformer error/);
                done();
            };
            const transformer = (value) => {
                throw new Error("transformer error");
            };
            a.createOption(["-p"], {
                hasValue: true,
                transform: transformer
            });
            a.parse(["-p", "12"], callback);
        });
    });

    describe("printHelp", () => {
        test("method exists", () => {
            expect(a.printHelp).toBeDefined();
            expect(typeof a.printHelp).toEqual("function");
        });

        test("writes to console log not console error", () => {
            a.printHelp();
            expect(cons.log.mock.calls.length).toBeGreaterThan(0);
            expect(cons.error.mock.calls.length).toBe(0);
        });
    });

    describe("printUsage", () => {
        test("method exists", () => {
            expect(a.printUsage).toBeDefined();
            expect(typeof a.printUsage).toEqual("function");
        });

        test("writes to console error not console log", () => {
            a.printUsage([], false);
            expect(cons.error.mock.calls.length).toBeGreaterThan(0);
            expect(cons.log.mock.calls.length).toBe(0);
        });

        test("writes usage message if provided in options as string", () => {
            const p = args.create({usage: "@#$usage#@!"}, cons);
            p.printUsage([], false);
            expect(cons.error.mock.calls.length).toBe(1);
            expect(cons.error.mock.calls[0][0]).toEqual("@#$usage#@!");
            expect(cons.log.mock.calls.length).toBe(0);
        });

        test("writes usage message if provided in options as function", () => {
            const usage = jest.fn();
            usage.mockReturnValue("UsAgE++")
            const p = args.create({usage: usage}, cons);
            p.printUsage(["error1", "error2"], false);
            expect(cons.error.mock.calls.length).toBe(3);
            expect(cons.error.mock.calls[2][0]).toEqual("UsAgE++");
            expect(usage.mock.calls.length).toBe(1);
            expect(cons.log.mock.calls.length).toBe(0);
        });
    });

    describe("printVersion", () => {
        test("method exists", () => {
            expect(a.printVersion).toBeDefined();
            expect(typeof a.printVersion).toEqual("function");
        });

        test("writes to console log not console error", () => {
            a.printVersion("VERSION", false);
            expect(cons.log.mock.calls.length).toBeGreaterThan(0);
            expect(cons.error.mock.calls.length).toBe(0);
        });

        test("writes more data when verbose", () => {
            const beforeNonVerbose = cons.log.mock.calls.length;
            a.printVersion("VERSION", false);
            const afterNonVerbose = cons.log.mock.calls.length;
            a.printVersion("VERSION", true);
            const afterVerbose = cons.log.mock.calls.length;
            const withNonVerbose = afterNonVerbose - beforeNonVerbose;
            const withVerbose = afterVerbose - afterNonVerbose;
            expect(withNonVerbose).toBeLessThan(withVerbose);
        });
    });
});