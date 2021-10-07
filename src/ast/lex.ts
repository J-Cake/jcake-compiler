import {matchers} from "./spec/lexer";
import {Token} from "./spec/index";

/**
 * checks to ensure the given token matches a provided matcher function.
 * @param token
 * @param matcher
 */
const checkMatcher = function (token: string, matcher: string[] | RegExp | ((token: string) => boolean)): boolean {
    if (matcher instanceof Array)
        return matcher.includes(token);
    else if (matcher instanceof RegExp)
        return matcher.test(token);
    else if (typeof matcher === 'function')
        return matcher(token);

    return false;
}

/**
 * Extremely fast linear lexing function. Makes assumptions to cut corners, and gain additional speed
 * @param input
 * @param file
 * @constructor
 */
export default function Lex(input: string, file?: string): Token[] {
    const tokens: Token[] = [];

    Array.from(input + ' ').reduce(function (accumulator: string, char: string, index: number): string {
        for (const i in matchers)
            if (checkMatcher(accumulator + char, matchers[i]))
                return accumulator + char;

        for (const i in matchers)
            if (checkMatcher(accumulator, matchers[i])) {
                tokens.push({
                    charIndex: index,
                    origin: {
                        get src() {
                            return input
                        },
                        file: file ?? "<anonymous>",
                        get line(): number {
                            return input.slice(0, index).split('\n').length + 1;
                        },
                        get char(): number {
                            return index - input.slice(0, index).split('\n').slice(0, -1).join('\n').length;
                        }
                    },
                    src: accumulator,
                    type: i as keyof typeof matchers
                });
                break;
            }

        return char;
    }, "");

    return tokens.filter(i => i.type !== 'comment');
};

/**
 * Thorough lexing function ensures all tokens are matched most accurately
 * @param input
 * @param file
 * @constructor
 */
export function Lex_Classic(input: string, file?: string): Token[] {
    const tokens: Token[] = [];

    let index: number = 0;
    const source = Array.from(input);

    while (source.length > 0) {
        let accumulator: string = ``;
        let potentialTokens: Token[] = [];

        for (const i of source) {
            accumulator += i;

            for (const i in matchers)
                if (checkMatcher(accumulator, matchers[i]))
                    potentialTokens.unshift({
                        charIndex: index,
                        origin: {
                            get src() {
                                return input
                            },
                            file: file ?? "<anonymous>",
                            line: input.slice(0, index).split('\n').length,
                            char: index - input.slice(0, index).split('\n').slice(0, -1).join('\n').length
                        },
                        src: accumulator,
                        type: i as keyof typeof matchers
                    });
        }

        const token = potentialTokens.find(i => ['keyword', 'return'].includes(i.type)) ?? potentialTokens[0];

        if (potentialTokens.length === 0 || token.src.length <= 0) {
            process.stderr.write(`Unexpected token\n`);
            process.stderr.write(`  at ${file}:${input.slice(0, index).split('\n').length}:${index - input.slice(0, index).split('\n').slice(0, -1).join('\n').length}\n`);
            process.exit(-1);
        } else {
            tokens.push(token);
            index += source.splice(0, token.src.length).length;
        }
    }

    return tokens.filter(i => i.type !== 'comment');
}