import Operation from './operation';

const runExample = () => {
    const s = "abcdefg";
    const op1 = new Operation([{ move: 1 }, { insert: "FOO" }]);
    const op2 = new Operation([{ move: 3 }, { insert: "BAR" }]);

    op1.apply(s); // => "aFOObcdefg"
    op2.apply(s); // => "abcBARdefg"

    const combined1 = Operation.combine(op1, op2); // => [{ move: 1 }, { insert: 'FOO' }, { move: 2}, { insert: 'BAR' } ]
    console.log(combined1.apply(s)); // => "aFOObcBARdefg"

    const combined2 = Operation.combine(op2, op1);
    console.log(combined2.toString());
}
const show = () => {
    console.log(Operation.normalizeOperations([{move: 1}, {insert: "AB"}, {delete: 1} ]));
}

// runExample();
show();