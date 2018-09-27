"use strict";

/*jslint maxlen: 100 */
const args = require("./../lib/samplx-argv-parser");
const when = require("when");

var a = null;

beforeEach(function () {
    a = args.create();
});

function checkCreateOptionThrows(args) {
    expect(function () {
        a.createOption(args);
    }).toThrow();
}

function checkCreateOption(args) {
  expect(function () {
      a.createOption(args);
  }).not.toThrow();
}

describe("Short options", function () {
    test("test one option", done => {
        function callback(errors, options) {
          expect(options["-p"].isSet).toBeTruthy();
          expect(options["-p"].timesSet).toBe(1);
          done();
        }

        a.createOption(["-p"]);
        a.parse(["-p"], callback);
    });

    describe("test with multiple characters", function () {
        test("-pf throws exception", function () {
            checkCreateOptionThrows(["-pf"]);
        });

        test("-- does not throw exception", function () {
            checkCreateOption(["--"]);
        });

        test("-pff throws exception", function () {
            checkCreateOptionThrows(["-pff"]);
        });

        test("-p-f throws exception", function () {
            checkCreateOptionThrows(["-p-f"]);
        });

        test("['-p', '-pfff'] throws exception", function () {
            checkCreateOptionThrows(["-p", "-pfff"]);
        });

    });

    test("one option twice as separate options", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(2);
            done();
        }

        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-p", "-p"], callback);
    });

    test("one option thrice as separate options", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(3);
            done();
        }

        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-p", "-p", "-p"], callback);
    });

    test("one option twice as one grouped option", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(2);
            done();
        }

        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-pp"], callback);
    });

    test("one option thrice as one grouped option", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(3);
            done();
        }

        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-ppp"], callback);
    });

    test("one option thrice as both grouped and separate", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(3);
            done();
        }

        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-p", "-pp"], callback);
    });

    test("test one option thrice as one grouped option", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(3);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.parse(["-ppp"], callback);
    });

    test("test two options as separate args", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-z"].isSet).toBeTruthy();
            expect(options["-z"].timesSet).toBe(1);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-p", "-z"], callback);
    });

    test("test two options as one arg", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-z"].isSet).toBeTruthy();
            expect(options["-z"].timesSet).toBe(1);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-pz"], callback);
    });


    test("test two options two times grouped with self", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(2);
            expect(options["-z"].isSet).toBeTruthy();
            expect(options["-z"].timesSet).toBe(2);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-pp", "-zz"], callback);
    });

    test("test two options two times grouped with other", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(2);
            expect(options["-z"].isSet).toBeTruthy();
            expect(options["-z"].timesSet).toBe(2);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-pz", "-zp"], callback);
    });

    test("test two options where only one occurs", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-p"], callback);
    });

    test("test two options each occurring thrice", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(3);
            expect(options["-z"].isSet).toBeTruthy();
            expect(options["-z"].timesSet).toBe(3);
            done();
        }
        a.createOption(["-p"], { allowMultiple: true });
        a.createOption(["-z"], { allowMultiple: true });
        a.parse(["-pzz", "-zpp"], callback);
    });

    test("test option with value", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].timesSet).toBe(1);
            expect(options["-p"].value).toEqual("foo");
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["-pfoo"], callback);
    });

    test("test option with value but no value passed", done => {
        function callback(errors, options) {
            expect(errors).toBeTruthy();
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/-p/);
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["-p"], callback);
    });

    test("option with empty value", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("");
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["-p", ""], callback);
    });

    test("test option with value and default value", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("foo");
            done();
        }
        a.createOption(["-p"], { hasValue: true, defaultValue: "bar" });
        a.parse(["-pfoo"], callback);
    });

    test("test option without value but with a default value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/-p/);
            done();
        }
        a.createOption(["-p"], { hasValue: true, defaultValue: "bar" });
        a.parse(["-p"], callback);
    });

    test("test option having value and accepting not getting one passed", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toBeUndefined();
            done();
        }
        a.createOption(["-p"], { hasValue: true, requiresValue: false });
        a.parse(["-p"], callback);
    });

    test("test passing value matching other option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("z");
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["-pz"], callback);
    });

    test("test passing value matching other option as well as that other option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("z");
            expect(options["-z"].isSet).toBeTruthy();
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["-pz", "-z"], callback);
    });

    test("test passing value to option with value with space between option and value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("foo");
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["-p", "foo"], callback);
    });

    test("test passing value to option without value with space between option and value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            expect(error).toMatch(/foo/);
            done();
        }
        a.createOption(["-p"], { hasValue: false });
        a.parse(["-p", "foo"], callback);
    });

    test("test passing value to option with value using equals", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("foo");
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["-p=foo"], callback);
    });

    test("test passing value to option without value using equals", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/does not take a value/i);
            expect(error).toMatch(/-p/);
            done();
        }
        a.createOption(["-p"], { hasValue: false });
        a.parse(["-p=foo"], callback);
    });

    test("test equals sign with space", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(options["-p"].value).toEqual("=");
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["-p", "="], callback);
    });

    test("test equals sign with spaces and extra value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            expect(error).toMatch(/123/);
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["-p", "=", "123"], callback);
    });

    test("test after operand separator", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown operand/i);
            expect(error).toMatch(/-p/);
            done();
        }
        a.createOption(["-p"], { hasValue: true });
        a.parse(["--", "-p"], callback);
    });

    test("test option set twice but not allowMultiple", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/value already set for/i);
            expect(error).toMatch(/-p/);
            done();
        }
        a.createOption(["-p"], { allowMultiple: false });
        a.parse(["-p", "-p"], callback);
    });

    test("test option with argument set multiple times", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(Array.isArray(options["-p"].value)).toBeTruthy();
            expect(options["-p"].value.length).toBe(2);
            expect(options["-p"].value[0]).toBe("12");
            expect(options["-p"].value[1]).toBe("34");
            done();
        }
        a.createOption(["-p"], { hasValue: true, allowMultiple: true });
        a.parse(["-p12", "-p34"], callback);
    });

    test("test options with allowOverride set multiple times", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["-p"].isSet).toBeTruthy();
            expect(Array.isArray(options["-p"].value)).toBeFalsy();
            expect(options["-p"].value).toBe("34");
            done();
        }
        a.createOption(["-p"], { hasValue: true, allowOverride: true });
        a.parse(["-p12", "-p34"], callback);
    });
});

describe("Long options", function () {
    test("test one option", done => {
        function callback(errors, options) {
          expect(options["--port"].isSet).toBeTruthy();
          expect(options["--port"].timesSet).toBe(1);
          done();
        }

        a.createOption(["--port"]);
        a.parse(["--port"], callback);
    });

    test("test containing a dash", done => {
        function callback(errors, options) {
          expect(options["--port-it"].isSet).toBeTruthy();
          expect(options["--port-it"].timesSet).toBe(1);
          done();
        }

        a.createOption(["--port-it"]);
        a.parse(["--port-it"], callback);
    });

    test("test containing a dash and has value", done => {
        function callback(errors, options) {
          expect(options["--port-it"].isSet).toBeTruthy();
          expect(options["--port-it"].timesSet).toBe(1);
          expect(options["--port-it"].value).toEqual("1234")
          done();
        }

        a.createOption(["--port-it"], { hasValue: true });
        a.parse(["--port-it", "1234"], callback);
    });

    test("test one option twice as separate options", done => {
        function callback(errors, options) {
          expect(options["--port"].isSet).toBeTruthy();
          expect(options["--port"].timesSet).toBe(2);
          done();
        }

        a.createOption(["--port"], { allowMultiple: true });
        a.parse(["--port", "--port"], callback);
    });

    test("test one option thrice as separate options", done => {
        function callback(errors, options) {
          expect(options["--port"].isSet).toBeTruthy();
          expect(options["--port"].timesSet).toBe(3);
          done();
        }

        a.createOption(["--port"], { allowMultiple: true });
        a.parse(["--port", "--port", "--port"], callback);
    });

    test("test two options both being set", done => {
        function callback(errors, options) {
          expect(options["--port"].isSet).toBeTruthy();
          expect(options["--port"].timesSet).toBe(1);
          expect(options["--zap"].isSet).toBeTruthy();
          expect(options["--zap"].timesSet).toBe(1);
          done();
        }

        a.createOption(["--port"]);
        a.createOption(["--zap"]);
        a.parse(["--port", "--zap"], callback);
    });

    test("test option with value", done => {
        function callback(errors, options) {
          expect(options["--port"].isSet).toBeTruthy();
          expect(options["--port"].timesSet).toBe(1);
          expect(options["--port"].value).toBe("foo");
          done();
        }

        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port", "foo"], callback);
    });

    test("test option with value but no value passed", done => {
        function callback(errors, options) {
            expect(errors).toBeTruthy();
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port"], callback);
    });

    test("option with empty value", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("");
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port", ""], callback);
    });

    test("test option with value and default value", done => {
        function callback(errors, options) {
            expect(errors).toBeNull();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("foo");
            done();
        }
        a.createOption(["--port"], { hasValue: true, defaultValue: "bar" });
        a.parse(["--port", "foo"], callback);
    });

    test("test option without value but with a default value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { hasValue: true, defaultValue: "bar" });
        a.parse(["--port"], callback);
    });

    test("test option having value and accepting not getting one passed", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toBeUndefined();
            done();
        }
        a.createOption(["--port"], { hasValue: true, requiresValue: false });
        a.parse(["--port"], callback);
    });

    test("test passing value matching other option", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/no value specified/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.createOption(["--zap"]);
        a.parse(["--port", "--zap"], callback);
    });

    test("test passing value not matching other options", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("--doit");
            expect(options["--zap"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.createOption(["--zap"]);
        a.parse(["--port", "--doit"], callback);
    });

    test("test passing value to option with value with space between option and value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("foo");
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["--port", "foo"], callback);
    });

    test("test passing value to option without value with space between option and value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            expect(error).toMatch(/foo/);
            done();
        }
        a.createOption(["--port"], { hasValue: false });
        a.parse(["--port", "foo"], callback);
    });

    test("test passing value to option with value using equals", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("foo");
            expect(options["-z"].isSet).toBeFalsy();
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.createOption(["-z"]);
        a.parse(["--port=foo"], callback);
    });

    test("test passing value to option without value using equals", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/does not take a value/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { hasValue: false });
        a.parse(["--port=foo"], callback);
    });

    test("test equals sign with space", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(options["--port"].value).toEqual("=");
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port", "="], callback);
    });

    test("test equals sign with spaces and extra value", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown argument/i);
            expect(error).toMatch(/123/);
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--port", "=", "123"], callback);
    });

    test("test after operand separator", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/unknown operand/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { hasValue: true });
        a.parse(["--", "--port"], callback);
    });

    test("test option set twice but not allowMultiple", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBeGreaterThan(0);
            const error = errors[0];
            expect(error).toMatch(/value already set for/i);
            expect(error).toMatch(/--port/);
            done();
        }
        a.createOption(["--port"], { allowMultiple: false });
        a.parse(["--port", "--port"], callback);
    });

    test("test option with argument set multiple times", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(Array.isArray(options["--port"].value)).toBeTruthy();
            expect(options["--port"].value.length).toBe(2);
            expect(options["--port"].value[0]).toBe("12");
            expect(options["--port"].value[1]).toBe("34");
            done();
        }
        a.createOption(["--port"], { hasValue: true, allowMultiple: true });
        a.parse(["--port=12", "--port=34"], callback);
    });

    test("test options with allowOverride set multiple times", done => {
        function callback(errors, options) {
            expect(Array.isArray(errors)).toBeFalsy();
            expect(options["--port"].isSet).toBeTruthy();
            expect(Array.isArray(options["--port"].value)).toBeFalsy();
            expect(options["--port"].value).toBe("34");
            done();
        }
        a.createOption(["--port"], { hasValue: true, allowOverride: true });
        a.parse(["--port=12", "--port=34"], callback);
    });

    test("known short option followed by an unknown one", done => {
        const callback = (errors, options) => {
            expect(Array.isArray(errors)).toBeTruthy();
            expect(errors.length).toBe(1);
            const error = errors[0];
            expect(error).toMatch(/-z/);
            done();
        };
        a.createOption(["-p"]);
        a.parse(["-pz"], callback);
    });

    test('shorthand does not expand to right of =', done => {
        const callback = (errors, options) => {
            expect(errors).toBeNull();
            expect(options['--ip']).toBeDefined();
            expect(Array.isArray(options['--ip'].value)).toBeTruthy();
            const v = options['--ip'].value[0];
            expect(v).toBe('127.0.0.1');
            done();
        };
        a.createOption(['--time-slot'], { hasValue: true});
        a.addShorthand('-1', ['--time-slot', 'Infinity']);
        a.createOption(['--ip'], { allowMultiple: true, hasValue: true });
        a.parse(['--ip=127.0.0.1'], callback);
    });
});

//     "test multiple operands": function (done) {
//         this.a.createOperand("opd1");
//         this.a.createOperand("opd2");
//         this.a.createOperand("opd3");
//
//         this.a.parse(["foo", "bar", "baz"], done(function (errors, options) {
//             assert.equals(options.opd1.value, "foo");
//             assert.equals(options.opd2.value, "bar");
//             assert.equals(options.opd3.value, "baz");
//         }));
//     },
