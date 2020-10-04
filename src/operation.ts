interface SingleMove {move: number}
interface SingleInsert {insert: string}
interface SingleDelete {delete: number}

type SingleOperation = SingleMove | SingleInsert | SingleDelete;

interface SingleUnified {
    move: number;
    insert: string;
    insertCount: number;
    delete: number
}


export default class Operation {
    private _normalizedOperations: SingleOperation[];

    constructor(private _operations: SingleOperation[]) {
        this._normalizedOperations = Operation.normalizeOperations(_operations);
    }

    /*
    * Normalization is about making all operations are converted into single character operations.
    * Additionally all move will only happen to the right.
    * Moves before deletes are removed
    * */
    static normalizeOperations = (operations: SingleOperation[]) => {
        const result: SingleOperation[] = [];
        const resultOrEmpty = (index) => {
            if(index<0 || index>=result.length) {
                return {}
            } else {
                return result[index];
            }
        }
        let caretLocation = 0;
        operations.forEach(op => {
           if('move' in op) {
               const sign = Math.sign(op.move);
               let i = 0;
               while(i<Math.abs(op.move)) {
                   // ignore deleted items as they don't exist anymore, do not count as iterated character
                   if(!('delete' in resultOrEmpty(caretLocation))) {
                       i++;
                   }
                   caretLocation+=sign;
                   if(caretLocation >= result.length) {
                       result.splice(caretLocation, 0, {move: 1});
                   }
               }
           } else if('insert' in op) {
               let i = 0;
               while(i<op.insert.length) {
                   if(!('delete' in resultOrEmpty(caretLocation))) {
                       if(caretLocation >= 0) {
                           result.splice(caretLocation, 0, {insert: op.insert.charAt(i)});
                       }
                       i++;
                   }
                   caretLocation++;
               }
           } else if('delete' in op) {
               let i = 0;
               while(i<op.delete) {
                   caretLocation--;
                   const current = resultOrEmpty(caretLocation);
                   if ('insert' in current){
                       // if delete encounters insert the insert should be shortened
                       result.splice(caretLocation, 1);
                   } else if('move' in current){
                       // move is replaced with a delete
                       result.splice(caretLocation, 1, {delete: 1});
                   }


                   if(! ('delete' in current)){
                       i++;
                   }
               }
           }
        });
        return result;
    }
    private static _addMovesBeforeDeletes = (denormalized: SingleOperation[]) => {
        const withAddedMoves: SingleOperation[] = [];
        denormalized.forEach((op) => {
            if('delete' in op) {
                const prevOp = (withAddedMoves.length > 0) ? withAddedMoves[withAddedMoves.length-1] : {} as SingleOperation;
                if('move' in prevOp) {
                    prevOp.move = prevOp.move + op.delete;
                } else {
                    withAddedMoves.push({move: op.delete});
                }
            }
            withAddedMoves.push(op);
        });
        return withAddedMoves;
    }

    /*
    Denormalization is just adding up consecutive same operations.
    So 3 moves in a row by 1 character become 1 move by 3 characters
     */
    static denormalizeOperations = (normalized: SingleOperation[]) => {
        const result: SingleOperation[] = [];
        if(normalized.length === 0){
            return result;
        }

        let lastOp: SingleOperation = normalized[0];
        for(let i=1; i<normalized.length; ++i) {
            const op = normalized[i];
            if('move' in op && 'move' in lastOp) {
                lastOp = {move: lastOp.move+1};
            } else if('insert' in op && 'insert' in lastOp) {
                lastOp = {insert: lastOp.insert+op.insert};
            } else if('delete' in op && 'delete' in lastOp) {
                lastOp = {delete: lastOp.delete+1};
            } else {
                // op and lastOp are different operations so it's time to put lastOp into the result array
                result.push(lastOp);
                lastOp = op;
            }
        }
        result.push(lastOp);
        // add corresponding move before each delete
        // this is because during normalization each valid delete removed one move
        return Operation._addMovesBeforeDeletes(result);
    }

    private static _toSingleUnified = (op: SingleOperation | {}): SingleUnified => {
        return {
            move: op['move'] || 0,
            insert: op['insert'] || '',
            delete: op['delete'] || 0,
            insertCount: (op['insert'] || '').length,
        }
    }

    static combineNormalized = (normalized1: SingleOperation[], normalized2: SingleOperation[]) => {
        const result: SingleOperation[] = [];
        let i1 = 0;
        let i2 = 0;
        while(i1 < normalized1.length || i2 < normalized2.length) {
            const cur1 = Operation._toSingleUnified(i1 < normalized1.length ? normalized1[i1] : {} as SingleOperation);
            const cur2 = Operation._toSingleUnified(i2 < normalized2.length ? normalized2[i2] : {} as SingleOperation);
            const merged = {
                move: cur1.move + cur2.move,
                insert: cur1.insert + cur2.insert,
                delete: cur1.delete + cur2.delete,
                insertCount: cur1.insertCount + cur2.insertCount,
            };

            // deletes execute first always
            if(merged.delete === 2 || merged.delete === 1) {
                // delete is always pushed
                result.push({delete: 1});
                // deletes and moves are executed now, insert has to wait for another round
                i1 += cur1.move + cur1.delete;
                i2 += cur2.move + cur2.delete;
            } else if (merged.insertCount === 2) {
                // no deletes so there will be only moves or inserts
                // move awaits for insert and in case of 2 inserts the 2nd insert awaits for the first one
                result.push({insert: cur1.insert});
                i1 += cur1.insertCount;
            } else if (merged.insertCount == 1) {
                result.push({insert: merged.insert});
                i1 += cur1.insertCount;
                i2 += cur2.insertCount;
            } else {
                // moves here only
                result.push({move: 1});
                i1++;
                i2++;
            }
        }
        return result;
    }

    apply = (s: string) => {
        const result = s.split('');
        let currentChar = 0;
        this._normalizedOperations.forEach(op => {
            if('move' in op) {
                // advancing in the string because this is move operation
                currentChar++;
            } else if('insert' in op) {
                result.splice(currentChar, 0, op.insert);
                currentChar++;
            } else if('delete' in op){
                result.splice(currentChar, op.delete);
            }
        });
        return result.join('');
    }

    combine = (operation: Operation) => {
        const combined = Operation.combine(this, operation);
        this._operations = [...combined._operations];
        this._normalizedOperations = [...combined._normalizedOperations];
    }

    static combine = (op1: Operation, op2: Operation) => {
        const combinedNormalized = Operation.combineNormalized(op1._normalizedOperations, op2._normalizedOperations);
        const combined = Operation.denormalizeOperations(combinedNormalized);
        return new Operation(combined);
    }

    toString = () => {
        return JSON.stringify(this._operations);
    }

    get operations() {
        return [...this._operations];
    }

}

