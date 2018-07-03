"use strict";

const args = require("./../lib/samplx-argv-parser");
const shorthand = require("./../lib/shorthand");

// return a function to add a shorthand.
// used inside of expect(...).toThrow() expressions.
function checkShorthand(flag, argv) {
    return function () {
        a.addShorthand(flag, argv);
    };
}

var a = null;

beforeEach(function () {
    a = args.create();
});

describe("Shorthands", function () {

    test("test creating shorthand for option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            done();
        }

        a.createOption(["--port"]);
        a.addShorthand("-p", ["--port"]);

        a.parse(["-p"], callback);
    });

    test("test shorthand for option with value and setting value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toBe("1234");
            done();
        }

        a.createOption(["--port"], { hasValue: true });
        a.addShorthand("-p", ["--port", "1234"]);

        a.parse(["-p"], callback);
    });

    test("test shorthand for option with value not setting value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/--port/);
            done();
        }

        a.createOption(["--port"], { hasValue: true });
        a.addShorthand("-p", ["--port"]);

        a.parse(["-p"], callback);
    });

    test("test shorthand expanding to none existing options", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            done();
        }

        a.addShorthand("-p", ["--port"]);

        a.parse(["-p"], callback);
    });

    test("test duplicate shorthand", function () {
        function addDashP() {
            a.addShorthand("-p", [ "--port" ]);
        }

        addDashP();
        expect(addDashP).toThrow();
    });

    test("test shorthand for option that already exists", function () {
        function addDashP() {
            a.addShorthand("-p", [ "--port" ]);
        }

        a.createOption(["-p"]);
        expect(addDashP).toThrow();
    });

    describe("shorthand that isn't a valid flag", function () {
        const argv = [ "--port" ];
        test("cake is not a valid flag", function () {
            expect(checkShorthand("cake", argv)).toThrow();
        });
        test("1234 is not a valid flag", function () {
            expect(checkShorthand("1234", argv)).toThrow();
        });
        test("p- is not a valid flag", function () {
            expect(checkShorthand("p-", argv)).toThrow();
        });
    });

    test("test shorthand without option", function () {
        expect(checkShorthand(null, [ "--port"] )).toThrow();
    });

    test("test shorthand without argv", function () {
        expect(checkShorthand("-p", null)).toThrow();
    });

    test("test operand and shorthand integration", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-e"].isSet).toBeTruthy();
            expect(options["-e"].value).toEqual("node");
            expect(options.OPD.value).toEqual("foo");
            done();
        }

        a.createOption(["-e"], { hasValue: true });
        a.createOperand();
        a.addShorthand("--node", ["-e", "node"]);

        a.parse(["--node", "foo"], callback);
    });

    test("test shorthand first followed by short option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-t"].isSet).toBeTruthy();
            expect(options["--width"].isSet).toBeTruthy();
            expect(options["--width"].value).toEqual("1");
            done();
        }

        a.createOption(["-t", "--terse"]);
        a.createOption(["--width"], { hasValue: true });
        a.addShorthand("-1", ["--width", "1"]);

        a.parse(["-1t"], callback);
    });

    test("test short option followed by shorthand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-t"].isSet).toBeTruthy();
            expect(options["--width"].isSet).toBeTruthy();
            expect(options["--width"].value).toEqual("1");
            done();
        }

        a.createOption(["-t", "--terse"]);
        a.createOption(["--width"], { hasValue: true });
        a.addShorthand("-1", ["--width", "1"]);

        a.parse(["-t1"], callback);
    });

    test("test two shorthands followed by short option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-t"].isSet).toBeTruthy();
            expect(options["--width"].isSet).toBeTruthy();
            expect(options["--width"].value).toEqual("1");
            expect(options["--depth"].isSet).toBeTruthy();
            expect(options["--depth"].value).toEqual("2");
            done();
        }

        a.createOption(["-t", "--terse"]);
        a.createOption(["--width"], { hasValue: true });
        a.createOption(["--depth"], { hasValue: true });
        a.addShorthand("-1", ["--width", "1"]);
        a.addShorthand("-2", ["--depth", "2"]);

        a.parse(["-12t"], callback);
    });
});


describe("expand", function () {
    var sh = null;

    beforeEach(function () {
        sh = shorthand.create("-x", ["--zuul", "dana"]);
    });

    test("returns args unchanged if shorthand is not present", function () {
        const args = ["-a", "42", "--help"];

        expect(sh.expand(args)).toEqual(args);
    });

    test("expands shorthand for the last option", function () {
        const args = [ "-a", "42", "-x" ];
        const result = sh.expand(args);

        expect(result).toEqual(["-a", "42", "--zuul", "dana"]);
    });

    test("expands shorthand for the middle option", function () {
        const args = [ "-a", "42", "-x", "--yo", "mister" ];
        const result = sh.expand(args);

        expect(result).toEqual(["-a", "42", "--zuul", "dana", "--yo", "mister"]);
    });

    test("expands all occurrences of shorthand", function () {
        const args = [ "-x", "-x", "--yo" ];
        const result = sh.expand(args);

        expect(result).toEqual(["--zuul", "dana", "--zuul", "dana", "--yo"]);
    });

    test("does not modify argument", function () {
        const args = [ "-x", "-x", "--yo" ];
        const result = sh.expand(args);

        expect(args).toEqual([ "-x", "-x", "--yo" ]);
        expect(result).toEqual(["--zuul", "dana", "--zuul", "dana", "--yo"]);
    });

    test("should handle arg with trailing dash", function () {
        const args = [ "should-" ];
        function checkExpand() {
            sh.expand(args);
        }

        expect(checkExpand).not.toThrow();
    })
});
