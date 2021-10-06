import type {Construct, NestedToken, Token, Value} from "./index";
import {valueTokenTypes} from "./index";
import buildValue, {hasTopLevelToken, postfixExpression, split} from "./valueBuilder";
import {isToken} from "./blockBuilder";
import {ValueToken} from "./construct";

export enum ConstructType {
    Return,
    Call,
    Access,
    Chain,
    Lambda,
    Dictionary,
    Operation,
    Assignment,
}

export const matchers: { [K in ConstructType]: (body: NestedToken) => Construct<K> } = {
    [ConstructType.Return](body: NestedToken): Construct<ConstructType.Return> {
        if (isToken(body[0], 'return'))
            return {
                type: ConstructType.Return,
                value: buildValue(body.slice(1))
            };
    },
    [ConstructType.Call](body: NestedToken): Construct<ConstructType.Call> {
        if (!isToken(body[body.length - 1], ')') || !isToken(body[body.length - 3], '(') || !(body[body.length - 2] instanceof Array) || hasTopLevelToken(body, ['=>']))
            return null;

        const value = body.slice(0, -3);

        if (value.length <= 0)
            return null;

        const arglist: NestedToken = body[body.length - 2] as NestedToken;
        const args = arglist.length > 0 ? split(arglist, ',') : [];

        const params: { [key: string]: Value } = {};

        for (const [a, i] of args.entries()) {
            const argName: [string, NestedToken] = (isToken(i[0], 'name') && isToken(i[1], ':') ? [(i[0] as Token<'name'>).src, i.slice(2)] : [String(a), i]);

            params[argName[0]] = buildValue(argName[1]);
        }

        return {
            type: ConstructType.Call,
            args: params,
            value: buildValue(value)
        };
    },
    [ConstructType.Access](body: NestedToken): Construct<ConstructType.Access> {
        if (!body.some(i => isToken(i, '[')) || !isToken(body[body.length - 1], ']') || hasTopLevelToken(body, ['=>']))
            return null;

        let bracket: number = 0;

        const backwards: NestedToken = Array.from(body).reverse();

        for (const [a, i] of backwards.entries())
            if (isToken(i, '[')) {
                if (--bracket === 0)
                    return {
                        type: ConstructType.Access,
                        key: buildValue(body.slice(body.length - a, -1)),
                        value: buildValue(body.slice(0, -1 - a))
                    };
            } else if (isToken(i, ']'))
                bracket++;
    },
    [ConstructType.Chain](body: NestedToken): Construct<ConstructType.Chain> {
        if (body.length > 0) {
            const index = body.findIndex(i => isToken(i, '.'));
            const value = body.slice(0, index);
            const chain = body.slice(index);

            if (!chain.every(i => isToken(i, [...valueTokenTypes, '.'])) || !chain.some(i => isToken(i, '.')) || hasTopLevelToken(body, ['=>']))
                return null;

            return {
                accessorList: (chain.filter(i => isToken(i, valueTokenTypes))) as ValueToken[],
                type: ConstructType.Chain,
                value: buildValue(value)
            }
        }
    },
    [ConstructType.Lambda](body: NestedToken): Construct<ConstructType.Lambda> {
        const marker = body.findIndex(i => isToken(i, '=>')); // args => args[0] is picked up as an `access` type.

        if (marker < 0)
            return null;

        const argList = body.slice(0, marker).flat(1);
        const fn = body.slice(marker + 1);

        if (!isToken(argList[0], ['name', '(']))
            return null;

        const argNames: string[] = [];

        if (argList.length > 0 && isToken(argList[0], '(') && isToken(argList[argList.length - 1], ')'))
            for (const i of split(argList.slice(1, -1), ','))
                if (i.length === 1 && isToken(i[0], 'name'))
                    argNames.push((i[0] as Token<'name'>).src);
                else
                    return null;
        else if (argList.some(i => isToken(i, 'name')))
            argNames[0] = (argList.find(i => isToken(i, 'name')) as Token<'name'>).src;

        return {
            type: ConstructType.Lambda,
            args: argNames,
            value: buildValue(fn)
        };
    },
    [ConstructType.Dictionary](body: NestedToken): Construct<ConstructType.Dictionary> {
        if (isToken(body[0], '{') && isToken(body[body.length - 1], '}')) {
            const values: Map<Value, Value> = new Map<Value, Value>();

            for (const [a, i] of split(body.slice(1, -1), ',').entries()) {
                const index = hasTopLevelToken(i, [':'])
                if (index !== null)
                    values.set(buildValue(i.slice(0, index)), buildValue(i.slice(index + 1)));
                else
                    values.set({
                        type: 'decimal',
                        src: a.toString()
                    }, buildValue(i));
            }

            return {
                type: ConstructType.Dictionary,
                values: values
            };
        }
    },
    [ConstructType.Operation](body: NestedToken): Construct<ConstructType.Operation> {
        if ((hasTopLevelToken(body, ['operator']) ?? -1) < (hasTopLevelToken(body, ['assignment']) ?? Infinity)) {
            // If we see an operator and an assignment, the operator must come first, otherwise, it's an assignment
            const expr = postfixExpression(body);

            if (expr)
                return {
                    type: ConstructType.Operation,
                    expression: expr
                }
        }
    },
    [ConstructType.Assignment](body: NestedToken): Construct<ConstructType.Assignment> {
        const index = hasTopLevelToken(body, ['assignment']);

        if (index && (hasTopLevelToken(body, ['operator']) ?? -1) > (index ?? -1))
            return {
                type: ConstructType.Assignment,
                assignment: [
                    buildValue(body.slice(0, index)),
                    body[index] as Token<'assignment'>,
                    buildValue(body.slice(index + 1))
                ]
            };
    },
};