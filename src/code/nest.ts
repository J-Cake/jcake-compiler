import {NestedToken, Token} from "../spec/index";

/**
 * Convert a list of lines into a NestedToken, taking whitespace and indents into account
 * @param lines lines
 * @constructor
 */
export default function Nest(lines: Token[][]): NestedToken {
    const out: NestedToken = [];
    const indent = lines[0][0].type === 'whitespace' ? lines[0][0].src : '';

    const body: Token[][] = [];
    for (const i of lines)
        if ((i[0].type === 'whitespace' && i[0].src === indent) || i[0].type !== 'whitespace') {
            if (body.length > 0)
                out.push(Nest(body.splice(0, body.length)))
            out.push({
                type: 'newline',
                src: '\n'
            }, ...i);
        } else
            body.push(i);

    if (body.length > 0)
        out.push(Nest(body));

    return out.filter(i => i instanceof Array ? i.length > 0 : (i.type !== 'whitespace'));
}

/**
 * Split the list of tokens by newlines. This produces a 2D array of tokens, irrespective of parenthesised or continuing expressions
 * @param tokens
 */
export function toLines(tokens: Token[]): Token[][] {
    const lines: Token[][] = [];
    const line: Token[] = [];

    for (const i of tokens) {
        if (i.type === 'newline')
            lines.push(line.splice(0, line.length));
        else
            line.push(i);
    }

    return [...lines, line].filter(i => i.length > 0);
}

/**
 * Collapse all whitespace into indents, allowing easy nesting
 * @param tokens
 */
export function toIndents(tokens: Token[]): Token[] {
    const out: Token[] = [];

    let indent: string;
    const getIndent = function (string: string): number {
        if (!indent) {
            indent = string;
            return 1;
        } else
            return string.length / indent.length;
    }

    let prevWasNewline = false;
    for (const i of tokens) {
        if (i.type === 'whitespace') {
            if (prevWasNewline) {
                out.push({
                    type: 'whitespace',
                    src: new Array(getIndent(i.src)).fill(indent).join(''),
                    charIndex: i.charIndex,
                    origin: i.origin
                });
            }
        } else if ((prevWasNewline = i.type === 'newline'))
            out.push({
                type: 'newline',
                src: '\n',
                charIndex: i.charIndex,
                origin: i.origin
            });
        else
            out.push(i);

    }

    return out;
}