import fs from 'fs';
import path from 'path';
import Compile from "./code/Compile";

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
const out = arg('--out', arg('-o', null));

if (fs.existsSync(mainFile)) {
    const source = await fs.promises.readFile(mainFile, 'utf8');

    const AST = Compile(source, {
        mainFile: mainFile,
        lex_mode: fast_lex ? 'fast' : 'classic'
    });

    // We can assemble the AST and dump it at `out`, or we can interpret it
}