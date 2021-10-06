import {BlockTypes, identifier} from "./block";
import {Block, NestedToken, Token} from "./index";
import Parse from "../code/parse";
import {TokenTypes} from "./lexer";
import buildValue, {nestByParentheses, split} from "./valueBuilder";

/**
 * Check if the specified token is a token at all, and confirm its type
 * @param token The object in question
 * @param type a list of accepted types
 * @param src an optional source condition to check the `src` attribute
 */
export function isToken(token: Token | NestedToken, type?: TokenTypes | readonly TokenTypes[] | TokenTypes[], src?: string): boolean {
    if (!token || token instanceof Array || !('src' in token) || !('type' in token))
        return false;

    const match: [boolean, boolean] = [true, true];

    if (type) {
        if (type instanceof Array)
            match[0] = type.includes(token?.type);
        else
            match[0] = type === token?.type;
    }

    if (src)
        match[1] = src === token?.src;

    return match[0] && match[1];
}

/**
 * Parse the declaration field around block expressions
 * @param tokens Block Expression
 * @param blockType Block Type
 */
export function getOptionalDeclarations(tokens: NestedToken, blockType: BlockTypes): {
    body: NestedToken,
    declarations: Token<'name'>[]
} | null {
    if (!isToken(tokens[0], 'keyword', identifier[blockType]))
        return null;

    const declarations: Token<'name'>[] = [];
    if (isToken(tokens[1], '['))
        for (const i of tokens.slice(2))
            if (isToken(i, 'name'))
                declarations.push(i as Token<'name'>);
            else if (isToken(i, ']'))
                return {
                    body: tokens.slice(tokens.findIndex(i => isToken(i, ']')) + 1),
                    declarations: declarations
                };

    return {
        body: tokens.slice(1),
        declarations: declarations
    };
}

export const BlockBuilder: { [K in BlockTypes]: (tokens: NestedToken) => Block<K> } = {
    [BlockTypes.Import](tokens: NestedToken) {
        const allowed: TokenTypes[] = ['name', '.'];
        const val = getOptionalDeclarations(tokens, BlockTypes.Import);

        if (val && val.body.every(i => isToken(i, allowed)))
            return {
                type: BlockTypes.Import,
                symbols: val.body as Token<'name' | '.'>[],
                declarations: val.declarations,
            }
        throw `Invalid Import`;
    },
    [BlockTypes.Closure](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Closure);

        const name = val.body[0];

        if (val && isToken(name, 'name'))
            return Parse(val.body.slice(1), val.declarations, (name as Token<'name'>).src);
        else
            throw `Invalid Closure`;
    },
    [BlockTypes.If](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.If);

        const expr = val.body.findIndex(i => i instanceof Array);

        if (val)
            return {
                type: BlockTypes.If,
                declarations: val.declarations,

                condition: buildValue(nestByParentheses(val.body.slice(0, expr))),
                value: buildValue(nestByParentheses(val.body.slice(expr))),

            }
        else
            throw `Invalid If`;
    },
    [BlockTypes.Else](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Else);

        if (val)
            return {
                type: BlockTypes.Else,
                declarations: val.declarations,

                value: buildValue(nestByParentheses(val.body)),

            }
        else
            throw `Invalid Else`;
    },
    [BlockTypes.Do](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Do);

        if (val)
            return {
                type: BlockTypes.Do,
                declarations: val.declarations,
                steps: split(val.body.slice(val.body.findIndex(i => i instanceof Array)).flat(1), ',').map(i => buildValue(nestByParentheses(i)))
            }
        else
            throw `Invalid Do`;
    },
    [BlockTypes.Each](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Each);

        const expr = val.body.findIndex(i => i instanceof Array);
        if (!isToken(expr[0], 'name'))
            throw `Invalid name`;

        if (val)
            return {
                type: BlockTypes.Each,
                declarations: val.declarations,

                iteratorName: (val.body[0] as Token<'name'>).src,
                iteratee: buildValue(nestByParentheses(val.body.slice(2, expr))),
                value: buildValue(nestByParentheses(val.body.slice(expr)))
            };
        else
            throw `Invalid Each`;
    },
    [BlockTypes.Repeat](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Repeat);

        const expr = val.body.findIndex(i => i instanceof Array);

        if (val)
            return {
                type: BlockTypes.Repeat,
                declarations: val.declarations,

                repeat: buildValue(nestByParentheses(val.body.slice(0, expr))),
                value: buildValue(nestByParentheses(val.body.slice(expr).flat(1)))
            };
        else
            throw `Invalid Repeat`;
    },
    [BlockTypes.Function](tokens: NestedToken) {
        const val = getOptionalDeclarations(tokens, BlockTypes.Function);

        const expr = val.body.findIndex(i => i instanceof Array);
        const name = val.body[0];

        if (!isToken(name, 'name'))
            throw `Expected name`;

        if (val)
            return {
                type: BlockTypes.Function,
                declarations: val.declarations,

                name: (name as Token<'name'>).src,
                args: (val.body.slice(1, expr - 1).filter(i => isToken(i, 'name')) as Token<'name'>[]).map(i => i.src),
                value: buildValue(nestByParentheses(val.body.slice(expr).flat(1)))
            };
        else
            throw `Invalid Each`;
    },
};