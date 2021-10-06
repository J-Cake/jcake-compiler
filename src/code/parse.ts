import {Block, NestedToken, Token} from "../spec/index";
import {BlockTypes, detectBlockType} from "../spec/block";
import {BlockBuilder} from "../spec/blockBuilder";

/**
 * Parse a list of tokens to a `Block`
 * @param symbol tokens
 */
export function toBlock(symbol: NestedToken): Block {
    if (!('type' in symbol[0])) {
        process.stderr.write(`Unexpected Block\n`);
        return process.exit(-1);
    }

    const blockType = detectBlockType(symbol[0]);

    if (blockType === null) {
        process.stderr.write(`Unexpected Token\n`);

        if ('origin' in symbol[0])
            process.stderr.write(`  at ${symbol[0].origin?.file}:${symbol[0].origin?.line}:${symbol[0].origin?.char}\n`);
        else
            process.stderr.write(`  at <unknown>`)
        return process.exit(-1);
    }

    return BlockBuilder[blockType](symbol);
}

/**
 * Fetch a list of top-level symbols
 * @param tokens tokens
 */
export function fetchSymbols(tokens: NestedToken): Block[] {
    const symbols: Block[] = [];

    const group: NestedToken = [];

    for (const i of tokens)
        if (!(i instanceof Array) && i.type === 'newline') {
            if (group.length > 0)
                symbols.push(toBlock(group.splice(0, group.length)));
        } else
            group.push(i);

    if (group.length > 0)
        symbols.push(toBlock(group.splice(0, group.length)));

    return symbols;
}

/**
 * Parse a closure
 * @param tokens The closure source
 * @param declarations optional declarations
 * @param name closure name
 * @constructor
 */
export default function Parse(tokens: NestedToken, declarations: Token<'name'>[] = [], name: string = "main"): Block<BlockTypes.Closure> {
    return {
        type: BlockTypes.Closure,
        declarations: declarations,
        symbols: fetchSymbols(tokens),
        name: name
    };
}