"use strict";

const args = require("./../lib/samplx-argv-parser");
const p = require("../lib/parser");

var a = null;

beforeEach(function () {
    a = args.create();
});

describe("parser", function () {
    describe("expandShorthands", function () {
        beforeEach(function () {
          a.createOption(["-p", "--port"], { hasValue: true });
          a.createOption(["-h", "--help"]);
          a.createOption(["-l", "--log-level"], { hasValue: true });
        });

        test("returns arguments untouched when no shorthands", function() {
            const originalArgs = [ "-h", "-p", "1337" ];
            const args = p.expandShorthands(originalArgs, a.options);
            expect(args).toBe(originalArgs);
        });

        test("expands shorthand", function () {
            a.addShorthand("-P", ["-p", "80"]);

            const originalArgs = [ "-h", "-P" ];
            const args = p.expandShorthands(originalArgs, a.options);

            expect(args).toEqual([ "-h", "-p", "80" ]);
        });

        test("expands all shorthands", function () {
            a.addShorthand("-P", ["-p", "80"]);
            a.addShorthand("-H", ["--help"]);
            const originalArgs = [ "-H", "-P" ];
            const args = p.expandShorthands(["-H", "-P"], a.options);

            expect(args).toEqual([ "--help", "-p", "80" ]);
        });
    });
});
