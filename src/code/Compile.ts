import {BlockTypes} from "../spec/block";
import {Block} from "../spec/index";
import Lex, {Lex_Classic} from "./lex";
import Nest, {toIndents, toLines} from "./nest";
import Parse from "./parse";

export interface CompilerOptions {
    lex_mode: 'fast' | 'classic',
    mainFile: string
}

export default function Compile(source: string, options?: CompilerOptions): Block<BlockTypes.Closure> {
    return Parse(Nest(toLines(toIndents(options?.lex_mode === 'fast' ? Lex(source, options?.mainFile) : Lex_Classic(source, options?.mainFile)))));
}