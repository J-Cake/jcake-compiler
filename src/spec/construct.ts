import {Token, Value, valueTokenTypes} from "./index";

export type ValueToken = Token<typeof valueTokenTypes[number]>;
export type AccessorChain = (ValueToken[] | AccessorChain)[];

/*
        - Array - tuples - iterator
values -
        - Object

 */

export type Call = {
    value: Value,
    args: {
        [arg: string]: Value
    }
};
export type Access = {
    value: Value,
    key: Value
};
export type Chain = {
    value: Value,
    accessorList: ValueToken[]
};
export type Lambda = {
    args: string[],
    value: Value,
};
export type Dictionary = {
    values: Map<Value, Value>
};
export type Return = {
    value: Value
};
export type Expression = {
    expression: (Token<'operator'> | Value)[]
};
export type Assignment = {
    assignment: [rhs: Value, op: Token<'assignment'>, lhs: Value]
};