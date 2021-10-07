import {NestedToken, Token, Value, valueTokenTypes} from "./index";
import {operators, TokenTypes} from "./lexer";
import {isToken} from "./blockBuilder";
import {Expression} from "./construct";
import {detectBlockType} from "./block";
import {toBlock} from "../parse";
import {matchers} from "./value";

/**
 * Splits a NestedToken into subcomponents by a given delimiter
 * @param tokens The list to split
 * @param delimiter The token **types** to delimit by
 * @param keepDelimiter Places the delimiting token at the beginning of the following element
 */
export function split(tokens: NestedToken, delimiter: TokenTypes, keepDelimiter: boolean = false): NestedToken[] {
    if (tokens.length <= 0)
        return [];

    const brackets: [parentheses: number, brackets: number, braces: number] = [0, 0, 0];
    const all0 = () => brackets[0] === 0 && brackets[1] === 0 && brackets[2] === 0;

    const out: NestedToken[] = [[]];

    for (const i of tokens) {
        if (isToken(i, '('))
            brackets[0]++;
        else if (isToken(i, '['))
            brackets[1]++;
        else if (isToken(i, '{'))
            brackets[2]++;
        else if (isToken(i, ')'))
            brackets[0]--;
        else if (isToken(i, ']'))
            brackets[1]--;
        else if (isToken(i, '}'))
            brackets[2]--;

        if (isToken(i, delimiter) && all0())
            out.push(keepDelimiter ? [i] : []);
        else out[out.length - 1].push(i);
    }

    return out;
}

/**
 * This function takes a given NestedToken and places all parenthesised tokens in a subarray
 * @param tokens content to be parenthesised
 */
export function nestByParentheses(tokens: NestedToken): NestedToken {
    let parentheses: number = 0;

    const out: NestedToken = [];
    const bracket: NestedToken = [];

    for (const i of tokens) {
        if (isToken(i, '('))
            parentheses++;
        else if (isToken(i, ')'))
            if (--parentheses === 0)
                out.push(bracket.shift(), nestByParentheses(bracket.splice(0, bracket.length)));

        if (parentheses > 0)
            bracket.push(i);
        else
            out.push(i);
    }

    if (bracket.length > 1 && isToken(bracket[0], '('))
        out.push(bracket.shift(), nestByParentheses(bracket.splice(0, bracket.length)));

    return out;
}

/**
 * Find / Determine if a given type of tokens exists outside of any bracket type
 * @param tokens The NestedToken to search
 * @param types The types of tokens to search for
 */
export function hasTopLevelToken(tokens: NestedToken, types: TokenTypes[] = []): number {
    const brackets: [parentheses: number, brackets: number, braces: number] = [0, 0, 0];
    const all0 = () => brackets[0] === 0 && brackets[1] === 0 && brackets[2] === 0;

    for (const [a, i] of tokens.entries()) {
        if (isToken(i, '('))
            brackets[0]++;
        else if (isToken(i, '['))
            brackets[1]++;
        else if (isToken(i, '{'))
            brackets[2]++;
        else if (isToken(i, ')'))
            brackets[0]--;
        else if (isToken(i, ']'))
            brackets[1]--;
        else if (isToken(i, '}'))
            brackets[2]--;

        if (isToken(i, types) && all0())
            return a;
    }

    return null;
}

/**
 * Convert an infix expression into a postfix expression
 * @param tokens The expression
 */
export function postfixExpression(tokens: NestedToken): Expression['expression'] {
    if (tokens.length <= 0)
        throw `SyntaxError: No Expression`;

    const out: Expression['expression'] = [];
    const opstack: Token<'operator'>[] = [];

    const expression: Array<Token<'operator'> | Value> = [];
    for (const i of split(tokens, 'operator', true))
        if (isToken(i[0], 'operator')) {
            expression.push(i[0] as Token<'operator'>);

            if (isToken(i[1], '(') && isToken(i[i.length - 1], ')'))
                expression.push(buildValue(i.slice(2, -1).flat(1)))
            else
                expression.push(buildValue(i.slice(1)));
        } else
            expression.push(buildValue(i));

    const precedence = (token: Token<'operator'>): number => operators[token.src][0];
    const isLeftAssociative = (token: Token<'operator'>): boolean => operators[token.src][1];
    const top = (): Token<'operator'> => opstack[opstack.length - 1];

    for (const i of expression.filter(i => i))
        if ('src' in i && 'type' in i ? isToken(i, 'operator') : false) {
            if (opstack.length > 0)
                if ((precedence(top()) > precedence(i as Token<'operator'>)) ||
                    (precedence(top()) === precedence(i as Token<'operator'>) &&
                        isLeftAssociative(i as Token<'operator'>)))
                    out.push(opstack.pop());
            opstack.push(i as Token<'operator'>);
        } else
            out.push(i);

    out.push(...opstack.reverse());

    return out;
}

export type DeepArray<T> = T[] | DeepArray<T>[];
export const flatten: <T>(arr: DeepArray<T>) => T[] = <T>(arr: DeepArray<T>, res: T[] = []) => res.concat(...arr.map(el => (Array.isArray(el)) ? flatten(el) : el));

/**
 * Parse a list of tokens into a Value
 * @param tokens The tokens to ast
 */
export default function buildValue(tokens: NestedToken): Value {
    const expression = tokens.filter(i => !isToken(i, 'newline'));

    if (expression.length > 0) {
        if (isToken(expression[0], 'keyword') && detectBlockType(expression[0] as Token<'keyword'>))
            return toBlock(expression);
        else if (expression.length === 1 && expression[0] && isToken(expression[0], valueTokenTypes))
            return expression[0] as Token<typeof valueTokenTypes[number]>;
        else if (expression.length === 3 && isToken(expression[0], '(') && expression[1] instanceof Array && isToken(expression[2], ')')) // Bracketed expressions
            return buildValue(expression[1]);
        else {
            const flat = nestByParentheses(flatten(expression).filter(i => !isToken(i, 'newline')));
            // Since unlike blocks, constructs don't rely on newlines, we can get rid of the nesting, unfortunately, the parenthesised nesting is useful, so restore that.

            for (const i in matchers) {
                const construct = matchers[i](flat);
                if (construct)
                    return construct;
            }
        }
    }

    const errToken: Token = tokens.flat(20)[0] as Token;

    process.stderr.write(`SyntaxError: Unexpected token\n`);
    if (errToken && isToken(errToken))
        process.stderr.write(`  at ${errToken?.origin?.file ?? '<anonymous>'}:${errToken?.origin?.line ?? '?'}:${errToken?.origin?.char ?? '?'}\n`);
    else if (expression.length <= 0)
        process.stderr.write(`  no expression\n`);
    else
        process.stderr.write(`  unknown reason\n`);
    process.exit(-1);
}