import Operation from "./operation";

describe('Operation', () => {

    it("normalizes simple move", () => {
        const operations = Operation.normalizeOperations([{move: 3}]);
        expect(operations).toMatchObject([{move: 1}, {move: 1}, {move: 1}]);
    });

    it("normalizes simple insert", () => {
        const operations = Operation.normalizeOperations([{insert: "ABC"}]);
        expect(operations).toMatchObject([{insert: "A"}, {insert: "B"}, {insert: "C"}]);
    });

    it("normalizes simple delete", () => {
        const operations = Operation.normalizeOperations([{move: 2}, {delete: 2}]);
        expect(operations).toMatchObject([{delete: 1}, {delete: 1}]);
    });

    it(`normalizes more complex case`, () => {
        const operations = Operation.normalizeOperations([{move: 3}, {delete: 2}, {insert: "ABC"}, {move: 2}]);
        expect(operations).toMatchObject([
            {move: 1}, {delete: 1}, {delete: 1}, {insert: "A"}, {insert: "B"}, {insert: "C"}, {move: 1}, {move: 1}
        ]);
    });

    it(`normalizes overlapping insert and delete`, () => {
        const operations = Operation.normalizeOperations([{insert: "ABC"}, {delete: 2}]);
        expect(operations).toMatchObject([{insert: "A"}]);
    });

    it(`normalizes negative moves within a string`, () => {
        const operations = Operation.normalizeOperations([{move: 2}, {insert: 'A'}, {move: -3}, {insert: "B"}]);
        expect(operations).toMatchObject([{insert: "B"}, {move: 1}, {move: 1}, {insert: "A"}]);
    });

    it(`ignores negative moves outside the string`, () => {
        const operations = Operation.normalizeOperations([{move: 2}, {insert: 'A'}, {move: -6}, {insert: "B"}]);
        expect(operations).toMatchObject([{move: 1}, {move: 1}, {insert: "A"}]);
    });

    it(`denormalizes correctly`, () => {
        const operations = Operation.denormalizeOperations([
            {move: 1}, {delete: 1}, {delete: 1}, {insert: "A"}, {insert: "B"}, {insert: "C"}, {move: 1}, {move: 1}
        ]);
        expect(operations).toMatchObject([{move: 3}, {delete: 2}, {insert: "ABC"}, {move: 2}]);
    });

    it(`combines non-overlapping operations`, () => {
        const op1 = new Operation([{move: 2}, {insert: 'ABC'}, {move: 3}]);
        const op2 = new Operation([{move: 1}, {insert: 'XYZ'}, {move: 1}]);

        const combined = Operation.combine(op1, op2);
        expect(combined.operations).toMatchObject([
            {"move": 1}, {"insert": "XYZ"}, {"move": 1}, {"insert": "ABC"}, {"move": 3}
        ]);
    });

    it(`combines overlapping operations 1`, () => {
        const op1 = new Operation([{move: 1}, {insert: 'ABC'}, {move: 3}, {insert: "UW"}]);
        const op2 = new Operation([{move: 1}, {insert: 'XYZ'}, {move: 3}, {delete: 2}]);

        const combined1 = Operation.combine(op1, op2);
        expect(combined1.operations).toMatchObject([
            {move: 1}, {insert: "ABCXYZ"}, {move: 3}, {delete: 2}, {insert: "UW"}
        ]);

        const combined2 = Operation.combine(op2, op1);
        expect(combined2.operations).toMatchObject([
            {move: 1}, {insert: "XYZABC"}, {move: 3}, {delete: 2}, {insert: "UW"}
        ]);
    });

    it(`combines overlapping operations 2`, () => {
        const op1 = new Operation([{move: 1}, {insert: 'ABC'}, {move: 3}, {insert: "UW"}]);
        const op2 = new Operation([{move: 2}, {insert: 'XYZ'}, {move: 2}, {delete: 2}]);

        const combined1 = Operation.combine(op1, op2);
        expect(combined1.operations).toMatchObject([
            {move: 1}, {insert: "ABC"}, {move: 1}, {insert: 'XYZ'}, {move: 2}, {delete: 2}, {insert: "UW"}
        ]);
    });

    it('static combine gives same results as instance combine', () => {
        const op1 = new Operation([{move: 2}, {insert: 'ABC'}, {move: 3}]);
        const op2 = new Operation([{move: 1}, {insert: 'XYZ'}, {move: 1}]);

        const combinedStatic = Operation.combine(op1, op2);
        op1.combine(op2);
        expect(combinedStatic.operations).toMatchObject(op1.operations);
    });

    it("applies moves without changes within string", () => {
        const op = new Operation([{move: 3}]);
        expect(op.apply("ABCD")).toEqual("ABCD");
    })

    it("applies insert when inside string", () => {
        const op = new Operation([{insert: "XYZ"}]);
        expect(op.apply("ABC")).toEqual("XYZABC");
    })

    it("applies insert when at the end of string", () => {
        const op = new Operation([{move: 3}, {insert: "XYZ"}]);
        expect(op.apply("ABC")).toEqual("ABCXYZ");
    })

    it("applies delete when inside string", () => {
        const op = new Operation([{move: 3}, {delete: 2}]);
        expect(op.apply("ABCD")).toEqual("AD");
    })

    it("applies delete when partially outside string", () => {
        const op = new Operation([{move: 5}, {delete: 3}]);
        expect(op.apply("ABC")).toEqual("AB");
    })

    it("applies complex operation", () => {
        const op = new Operation([{move: 3}, {insert: "XYZ"}, {move: 2}, {delete: 1}, {move: -2}, {insert: "ABC"}]);
        expect(op.apply("abcdefghijk")).toEqual("abcXABCYZdfghijk");
    })

});