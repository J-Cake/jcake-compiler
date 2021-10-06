import fs from 'fs';
import path from 'path';
import util from "util";

import Lex, {Lex_Classic} from "./code/lex";
import Nest, {toIndents, toLines} from "./code/nest";
import Parse from "./code/parse";

/**
 * Search for an argument in the CLI arg list
 * @param str
 * @param fallback
 */
const arg = function (str: string, fallback: string): string {
    const index = process.argv.lastIndexOf(str);
    if (index > 0)
        return process.argv[index + 1];

    return fallback;
}

const mainFile = path.resolve(arg('--main', '') ?? path.join(process.cwd(), 'main.ark'));
const fast_lex = arg('--lex-mode', 'fast') === 'fast';

if (fs.existsSync(mainFile)) {
    const source = await fs.promises.readFile(mainFile, 'utf8');

    const tokens = fast_lex ? Lex(source, mainFile) : Lex_Classic(source, mainFile);
    const nestedTokens = Nest(toLines(toIndents(tokens)));
    const AST = Parse(nestedTokens);

    console.log(util.inspect(AST, false, null, true));
}