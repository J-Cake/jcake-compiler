import {BlockTypes} from "./spec/block";
import {Block} from "./spec/index";
import Lex, {Lex_Classic} from "./lex";
import Nest, {toIndents, toLines} from "./nest";
import Parse from "./parse";
import {options} from "../index";

export interface CompilerOptions {
    lex_mode: 'fast' | 'classic',
    mainFile: string,
    path: string[],
    out: string,
    argv: string[]
}

export default function Compile(source: string, file: string): Block<BlockTypes.Closure> {
    return Parse(Nest(toLines(toIndents(options?.lex_mode === 'fast' ? Lex(source, file) : Lex_Classic(source, file)))));
}