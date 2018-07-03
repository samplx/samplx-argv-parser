'use strict';

const args = require('../lib/samplx-argv-parser');
const help = require('../lib/help');

var a = null;
const mockConsole = {
    log: jest.fn(),
    error: jest.fn()
};

describe("help", () => {

    beforeEach(() => {
        mockConsole.log = jest.fn();
        mockConsole.error = jest.fn();
        a = args.create({}, mockConsole);
        a.createOption(["-p"]);
        a.createOption(["--greedy"], {
            hasValue: true,
            greedy: true
        });
    });

    describe("formatter", () => {
        test("function exists", () => {
            expect(help.formatter).toBeDefined();
            expect(typeof help.formatter).toBe("function");
        });

        test("does not write to console", () => {
            const result = help.formatter(a);
            expect(mockConsole.log.mock.calls.length).toBe(0);
            expect(mockConsole.error.mock.calls.length).toBe(0);
        });

        test("uses an custom formatter if passed in options", () => {
            const formatter = jest.fn();
            formatter.mockReturnValue('custom formatter result');
            const p = args.create({ formatter: formatter });
            const result = help.formatter(p);
            expect(result).toEqual('custom formatter result');
            expect(formatter.mock.calls.length).toBe(1);
        });

        test("throws error if custom formatter is not a function", () => {
            const formatter = {};
            const p = args.create({ formatter: formatter });
            const format = () => help.formatter(p);
            expect(format).toThrow();
        });

        test("includes nane of operand", () => {
            const operandName = "OpErAnD";
            a.createOperand(operandName);
            const result = help.formatter(a);
            expect(result.indexOf(operandName)).toBeGreaterThan(-1);
        });

        test("includes a + suffix if operand is greedy", () => {
            const operandName = "OpErAnD";
            a.createOperand(operandName, { greedy: true });
            const result = help.formatter(a);
            expect(result.indexOf(operandName + "+")).toBeGreaterThan(-1);
        });

        test("includes description of operand if defined", () => {
            const operandName = "OpErAnD";
            const description = "The description of " + operandName;
            a.createOperand(operandName, { description: description });
            const result = help.formatter(a);
            expect(result.indexOf(description)).toBeGreaterThan(-1);
        });

        test("hide description of operand if description === false", () => {
            const operandName = "OpErAnD";
            a.createOperand(operandName, { description: false });
            const result = help.formatter(a);
            expect(result.indexOf(operandName)).toBe(-1);
        });

        test("includes description of option value", () => {
            const valueName = "URI!";
            a.createOption(["--url"], {
                hasValue: true,
                valueName: valueName
            });
            const result = help.formatter(a);
            expect(result.indexOf(valueName)).toBeGreaterThan(-1);
        });

        test("includes description of option if defined", () => {
            const description = "A Really great option!";
            a.createOption(["--url"], {
                hasValue: true,
                description: description
            });
            const result = help.formatter(a);
            expect(result.indexOf(description)).toBeGreaterThan(-1);
        });

        test("hides option if description === false", () => {
            a.createOption(["--hide"], {
                hasValue: true,
                description: false
            });
            const result = help.formatter(a);
            expect(result.indexOf("--hide")).toBe(-1);
        });

        test("includes default value if defined", () => {
            a.createOption(["--url"], {
                hasValue: true,
                defaultValue: "http://example.com/"
            });
            const result = help.formatter(a);
            expect(result.indexOf("[http://example.com/]")).toBeGreaterThan(-1);
        });
    });

    describe("printHelp", () => {
        test("function exists", () => {
            expect(help.printHelp).toBeDefined();
            expect(typeof help.printHelp).toBe("function");
        });

        test("writes formatted help to parser.log", () => {
            const text = help.formatter(a);
            help.printHelp(a);

            expect(mockConsole.log.mock.calls.length).toBe(1);
            expect(mockConsole.log.mock.calls[0][0]).toEqual(text);
        });
    });

    describe("printVersion", () => {
        test("function exists", () => {
            expect(help.printVersion).toBeDefined();
            expect(typeof help.printVersion).toBe("function");
        });
    });

    describe("printErrors", () => {
        test("function exists", () => {
            expect(help.printErrors).toBeDefined();
            expect(typeof help.printErrors).toBe("function");
        });
    });

    describe("getUsage", () => {
        test("function exists", () => {
            expect(help.getUsage).toBeDefined();
            expect(typeof help.getUsage).toBe("function");
        });
    });

    describe("printUsage", () => {
        test("function exists", () => {
            expect(help.printUsage).toBeDefined();
            expect(typeof help.printUsage).toBe("function");
        })

        test("writes formatted usage to parser.error if not verbose", () => {
            const text = help.getUsage(a);
            const usage2 = help.getUsage(a);
            expect(usage2).toEqual(text);
            help.printUsage(a, false);

            expect(mockConsole.log.mock.calls.length).toBe(0);
            expect(mockConsole.error.mock.calls.length).toBe(1);
            expect(mockConsole.error.mock.calls[0][0]).toEqual(text);
        });

        test("writes formatted usage and help to parser.error if  verbose", () => {
            const usage = help.getUsage(a);
            const helpText = help.formatter(a);
            help.printUsage(a, true);

            expect(mockConsole.error.mock.calls.length).toBe(2);
            expect(mockConsole.error.mock.calls[0][0]).toEqual(usage);
            expect(mockConsole.error.mock.calls[1][0]).toEqual(helpText);
        });
    });
    
});
