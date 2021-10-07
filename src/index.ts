import fs from 'fs';
import path from 'path';
import url from "url";

import Compile, {CompilerOptions} from "./ast/Compile";

const argvSep = process.argv.indexOf('--');

const argv = argvSep > 0 ? process.argv.slice(0, argvSep) : process.argv;
const programArgv = argvSep > 0 ? process.argv.slice(argvSep + 1) : [];

/**
 * Search for an argument in the CLI arg list
 * @param str
 * @param fallback
 */
const arg = function (str: string, fallback: string): string {
    const index = argv.lastIndexOf(str);
    if (index > 0)
        return argv[index + 1];

    return fallback;
}

const argAll = function (str: string): string[] {
    const values: string[] = [];

    let prevIndex: number = 0;

    while ((prevIndex = argv.findIndex(i => i === str, prevIndex)) > 0)
        values.push(values[prevIndex + 1]);

    return values;
}

const mainFile = path.resolve(arg('--main', '') ?? path.join(process.cwd(), 'main.ark'));
const fast_lex = arg('--lex-mode', 'fast') === 'fast';
const out = arg('--out', arg('-o', null));

const libdir = url.fileURLToPath(path.join(import.meta.url, '../../lib/'));

export const options: CompilerOptions = {
    mainFile: mainFile,
    lex_mode: fast_lex ? 'fast' : 'classic',
    out: out,
    path: [libdir, ...fs.readdirSync(libdir).map(i => path.join(libdir, i)), ...argAll('-p')],
    argv: programArgv
};

if (fs.existsSync(mainFile)) {
    const source = await fs.promises.readFile(mainFile, 'utf8');

    const AST = Compile(source, options.mainFile);
}