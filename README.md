# nodejs text collision resolving

## Description

I implemented following methods:
- `Operation.prototype.combine(operation)` Updates the operation by combining it with another colliding operation
- `Operation.combine(op1, op2)` Static method that returns a new operation by combining the arguments without mutating them
- `Operation.prototype.apply(string)` Applies the operation to the provided argument

When a new `Operation` object is created all single operations are normalized:
- all operations affecting more than 1 character are splitted into smaller operations
- all operations are rearranged to get rid of negative `move` operations
- `insert` operations get shortened if they get into the range of `delete`
- each `move` in normalized form denotes one unchanged character from the original string
- each `delete` in normalized form denotes one deleted character. `move` affected by `delete` is replaced with `delete`.

Sample normalization conversions:
| Original operation                      | normalized form                  |
| --------------------------------------- | -------------------------------- |
| {move: 3}                               | {move: 1}, {move: 1}, {move: 1}  |
| {insert: "A"}, {move: -1}, {insert: "B"}| {insert: "B"}, {insert: "A"}     |
| {move: 1}, {insert: "AB"}, {delete: 1}  | {move: 1}, {insert: "A"}         |

Once all operations are normalized it is easier to combine 2 colliding edits into 1. This is because normalized operations are lists of operations on just one character so combining algorithm has to solve only 6 possible combinations of operations. Combining operations happens according to the table below:

| operation 1| operation 2| outcome                                                                           |
| ---------- | ---------- | --------------------------------------------------------------------------------- |
| delete     | delete     | delete                                                                            |
| delete     | move       | delete                                                                            |
| delete     | insert     | delete (insert awaits for another operation)                                      |
| insert     | insert     | insert from operation 1 goes first, 2nd insert awaits for another operation       |
| insert     | move       | insert goes first, move awaits for another operation                              |
| move       | move       | move                                                                              |

Sample edit collision that gives different results depending on the direction of combine:  

op1: ```[{move: 1}, {insert: 'ABC'}, {move: 3}, {insert: "UW"}]```  
op2: ```[{move: 1}, {insert: 'XYZ'}, {move: 3}, {delete: 2}]```  

op1 combined with op2: ```[{move: 1}, {insert: "ABCXYZ"}, {move: 3}, {delete: 2}, {insert: "UW"}]```  
op2 combined with op1: ```[{move: 1}, {insert: "XYZABC"}, {move: 3}, {delete: 2}, {insert: "UW"}]```  
## Project setup
```
yarn install
```

### Runs the application
```
yarn start
```

### Runs all tests
```
yarn test
```