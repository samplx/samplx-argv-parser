"use strict";

const args = require("./../lib/samplx-argv-parser");
const when = require("when");

var a = null;

beforeEach(function () {
    a = args.create();
});

describe("Operands", function () {

    test("test plain operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOperand();
        a.parse(["123abc"], callback);
    });

    test("test single dash option and operand with option first", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["-p"]);
        a.createOperand();
        a.parse(["-p", "123abc"], callback);
    });

    test("test single dash option and operand with operand first", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["-p"]);
        a.createOperand();
        a.parse(["123abc", "-p"], callback);
    });

    test("test single dash option with value and operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeFalsy();
            done();
        }

        a.createOption(["-p"], { hasValue: true });
        a.createOperand();
        a.parse(["-p", "123abc"], callback);
    });

    test("test single dash option with value and operand without option after operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["-p"], { hasValue: true });
        a.createOperand();
        a.parse(["123abc", "-p", "test"], callback);
    });

    test("test double dash option and operand with option first", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["--port"]);
        a.createOperand();
        a.parse(["--port", "123abc"], callback);
    });

    test("test double dash option and operand with operand first", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["--port"]);
        a.createOperand();
        a.parse(["123abc", "--port"], callback);
    });

    test("test double dash option with value and operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeFalsy();
            done();
        }

        a.createOption(["--port"], { hasValue: true });
        a.createOperand();
        a.parse(["--port", "123abc"], callback);
    });

    test("test double dash option with value and operand without option after operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("123abc");
            done();
        }

        a.createOption(["--port"], { hasValue: true });
        a.createOperand();
        a.parse(["123abc", "--port", "test"], callback);
    });

    test("test not setting operand with required validator", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            done();
        }

        a.createOperand({ validators: [args.validators.required()]});
        a.parse([], callback);
    });

    test("test creating option with operand present", function () {
        a.createOperand(args.OPD_DIRECTORY);

        function checkCreateOption() {
            a.createOption(["-p"]);
        }

        expect(checkCreateOption).not.toThrow();
    });

    test("test specifying operand after double dash", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("gocha")
            done();
        }

        a.createOption(["-p"]);
        a.createOperand();
        a.parse(["-p", "--", "gocha"], callback);
    });

    test("test specifying operand starting with dash after double dash", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual("-gocha")
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("rest");
        a.parse(["-p", "--", "-gocha"], callback);
    });

    test("test specifying multiple operands after double dash", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.opd1.isSet).toBeTruthy();
            expect(options.opd1.value).toEqual("foo");
            expect(options.opd2.isSet).toBeTruthy();
            expect(options.opd2.value).toEqual("bar")
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("opd1");
        a.createOperand("opd2");
        a.parse(["-p", "--", "foo", "bar"], callback);
    });

    test("test multiple operands starting with a dash", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.opd1.isSet).toBeTruthy();
            expect(options.opd1.value).toEqual("-foo");
            expect(options.opd2.isSet).toBeTruthy();
            expect(options.opd2.value).toEqual("--bar")
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("opd1");
        a.createOperand("opd2");
        a.parse(["-p", "--", "-foo", "--bar"], callback);
    });

    test("test greedy operand with no value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.rest.isSet).toBeFalsy();
            expect(options.rest.value).toEqual([]);
            done();
        }

        a.createOperand("rest", { greedy: true });
        a.parse([], callback);
    });

    test("test greedy operand with one value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo"]);
            done();
        }

        a.createOperand("rest", { greedy: true });
        a.parse(["foo"], callback);
    });

    test("test greedy operand with multiple values", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar", "baz"]);
            done();
        }

        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "bar", "baz"], callback);
    });

    test("test greedy operand with operand values before and after double dash", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar", "baz"]);
            done();
        }

        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "--", "bar", "baz"], callback);
    });

    test("test greedy operand preceded by option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("rest", { greedy: true });
        a.parse(["-p", "foo", "bar"], callback);
    });

    test("test greedy operand followed by option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "bar", "-p"], callback);
    });

    test("test greedy operand with option in between", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"]);
        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "-p", "bar"], callback);
    });

    test("test greedy operand preceded by option with value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-p"].value).toEqual("1234")
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"], { hasValue: true });
        a.createOperand("rest", { greedy: true });
        a.parse(["-p", "1234", "foo", "bar"], callback);
    });

    test("test greedy operand followed by option with value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-p"].value).toEqual("1234")
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"], { hasValue: true });
        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "bar", "-p", "1234"], callback);
    });

    test("test greedy operand with option with value in between", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-p"].value).toEqual("1234")
            expect(options.rest.isSet).toBeTruthy();
            expect(options.rest.value).toEqual(["foo", "bar"]);
            done();
        }

        a.createOption(["-p"], { hasValue: true });
        a.createOperand("rest", { greedy: true });
        a.parse(["foo", "-p", "1234", "bar"], callback);
    });

    test("test greedy operand preceded by non-greedy operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.opd1.isSet).toBeTruthy();
            expect(options.opd1.value).toEqual("foo");
            expect(options.opd2.isSet).toBeTruthy();
            expect(options.opd2.value).toEqual(["bar", "baz"]);
            done();
        }

        a.createOperand("opd1", { greedy: false });
        a.createOperand("opd2", { greedy: true });
        a.parse(["foo", "bar", "baz"], callback);
    });

    test("test greedy operand followed by non-greedy operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options.opd1.isSet).toBeTruthy();
            expect(options.opd1.value).toEqual(["foo", "bar", "baz"]);
            expect(options.opd2.isSet).toBeFalsy();
            done();
        }

        a.createOperand("opd1", { greedy: true });
        a.createOperand("opd2", { greedy: false });
        a.parse(["foo", "bar", "baz"], callback);
    });

    test("test double dash option with value before operand", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].timesSet).toBe(1);
            expect(options["--port"].value).toEqual("4224")
            expect(options.OPD.isSet).toBeTruthy();
            expect(options.OPD.value).toEqual("baz");
            done();
        }

        a.createOperand();
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port", "4224", "baz"], callback);
    });

    test("superfluous operand causes error", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toMatch(/operand 'foo'/);
            done();
        }

        a.createOption(["-a"]);
        a.parse(["-a", "--", "foo"], callback);
    });
});
