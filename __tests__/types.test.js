"use strict";

const args = require("../lib/samplx-argv-parser");
const t = args.types;

var a = null;

function throwOMG() {
    throw new Error("OMG");
}

function doNothing() {}

function checkErrors(errors, option, typeName) {
    expect(Array.isArray(errors)).toBeTruthy();
    const error = errors[0];
    expect(error.indexOf(option)).toBeGreaterThan(-1);
    expect(error.indexOf(typeName)).toBeGreaterThan(-1);
}

function checkOMG(errors) {
    expect(Array.isArray(errors)).toBeTruthy();
    const error = errors[0];
    expect(error.indexOf("OMG")).toBeGreaterThan(-1);
}

beforeEach(function () {
    a = args.create();
});

describe("types", function () {
    describe("integer", function () {
        test("validates value as integer", done => {
            function callback(errors) {
                checkErrors(errors, "-p", "integer");
                done();
            }

            a.createOption(["-p"], t.integer());
            a.parse(["-p", "abc"], callback);
        });

        test("validates with additional validators", done => {
            const myValidators = [ throwOMG ];
            function callback(errors) {
                checkOMG(errors);
                done();
            }
            a.createOption(["-p"], t.integer({ validators: myValidators }));
            a.parse(["-p", "abc"], callback);
        });

        test("validates integer with additional validators", done => {
            const myValidators = [ doNothing ];
            function callback(errors) {
                checkErrors(errors, "-p", "integer");
                const error = errors[0];
                expect(error.indexOf("abc")).toBeGreaterThan(-1);
                done();
            }
            a.createOption(["-p"], t.integer({ validators: myValidators }));
            a.parse(["-p", "abc"], callback);
        });

        test("produces number value", done => {
            function callback(errors, options) {
                expect(options["-p"].value).toBe(1111);
                done();
            }
            a.createOption(["-p"], t.integer());
            a.parse(["-p", "1111"], callback);
        });

        test("produces number with radix 10 by default", done => {
          function callback(errors, options) {
              expect(options["-p"].value).toBe(8);
              done();
          }
          a.createOption(["-p"], t.integer());
          a.parse(["-p", "08"], callback);
        });

        test("produces number with custom radix", done => {
          function callback(errors, options) {
              expect(options["-p"].value).toBe(8);
              done();
          }
          a.createOption(["-p"], t.integer({ radix: 8 }));
          a.parse(["-p", "10"], callback);
        });
    });

    describe("number", function () {
        test("validates value as number", done => {
            function callback(errors) {
                checkErrors(errors, "-p", "number");
                done();
            }

            a.createOption(["-p"], t.number());
            a.parse(["-p", "abc"], callback);
        });

        test("validates with additional validators", done => {
            const myValidators = [ throwOMG ];
            function callback(errors) {
                checkOMG(errors);
                done();
            }
            a.createOption(["-p"], t.number({ validators: myValidators }));
            a.parse(["-p", "abc"], callback);
        });

        test("validates integer with additional validators", done => {
            const myValidators = [ doNothing ];
            function callback(errors) {
                checkErrors(errors, "-p", "number");
                const error = errors[0];
                expect(error.indexOf("abc")).toBeGreaterThan(-1);
                done();
            }
            a.createOption(["-p"], t.number({ validators: myValidators }));
            a.parse(["-p", "abc"], callback);
        });

        test("produces number value", done => {
            function callback(errors, options) {
                expect(options["-p"].value).toBe(11.1);
                done();
            }
            a.createOption(["-p"], t.number());
            a.parse(["-p", "11.1"], callback);
        });

    });

    describe("enum", function () {
        test("throws without values", function() {
            function createEnum() {
              return t.enum();
            }

            expect(createEnum).toThrow();
        });

        test("validates values provided", done => {
            function callback(errors, options) {
              expect(Array.isArray(errors)).toBeTruthy();
              const error = errors[0];
              expect(error.indexOf("-t")).toBeGreaterThan(-1);
              done();
            }

            a.createOption(["-p"], t.enum(["1", "2", "3", "4"]));
            a.createOption(["-t"], t.enum(["1", "2", "3", "4"]));
            a.parse(["-p", "1", "-t", "5"], callback);
        })

    })
});
