import {Block, Token, Value} from "./index";

export enum BlockTypes {
    Import,
    Closure,
    If,
    Else,
    Do,
    Each,
    Repeat,
    Function,
}

export const identifier: Record<BlockTypes, string> = {
    [BlockTypes.Import]: 'import',
    [BlockTypes.Closure]: 'closure',
    [BlockTypes.If]: 'if',
    [BlockTypes.Else]: 'else',
    [BlockTypes.Do]: 'do',
    [BlockTypes.Each]: 'each',
    [BlockTypes.Repeat]: 'repeat',
    [BlockTypes.Function]: 'fn',
}

export function detectBlockType(token: Token): BlockTypes {
    if (token.type !== 'keyword')
        return null;

    for (const i in identifier)
        if (identifier[i] === token.src)
            return Number(i) as BlockTypes;

    return null;
}

export type Import = {
    symbols: Token[]
};
export type Closure = {
    name: string,
    symbols: Block[],
};
export type Fn = {
    name: string,
    args: string[],
    value: Value
};
export type Do = {
    steps: Value[]
};
export type If = {
    condition: Value,
    value: Value
};
export type Else = {
    value: Value
};
export type Repeat = {
    repeat: Value,
    value: Value
};

export type Each = {
    iteratorName: string,
    iteratee: Value,
    value: Value
};