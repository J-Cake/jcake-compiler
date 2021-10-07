import {TokenTypes} from "./lexer";
import * as Blocks from "./block";
import {BlockTypes} from "./block";
import * as Constructs from "./construct";
import {ConstructType} from "./value";

export type Token<Type extends TokenTypes = TokenTypes> = {
    src: string,
    type: Type,

    origin?: {
        get src(): string;
        file: string;

        get line(): number;
        get char(): number;
    },

    charIndex?: number,
}

export type BlockContainer<Type extends BlockTypes, Data extends {}> = Data & {
    type: Type,
    declarations: Token<'name'>[],
    origin: Token['origin']
    // Other common properties
};

export type Block<Type extends BlockTypes = BlockTypes> = BlockContainer<Type,
    Type extends BlockTypes.Import ? Blocks.Import :
        Type extends BlockTypes.Closure ? Blocks.Closure :
            Type extends BlockTypes.Function ? Blocks.Fn :
                Type extends BlockTypes.Do ? Blocks.Do :
                    Type extends BlockTypes.If ? Blocks.If :
                        Type extends BlockTypes.Else ? Blocks.Else :
                            Type extends BlockTypes.Repeat ? Blocks.Repeat :
                                Type extends BlockTypes.Each ? Blocks.Each : never>;

export type ConstructContainer<Type extends ConstructType, Data extends {}> = Data & {
    type: Type
};

export type Construct<Type extends ConstructType = ConstructType> = ConstructContainer<Type,
    Type extends ConstructType.Call ? Constructs.Call :
        Type extends ConstructType.Access ? Constructs.Access :
            Type extends ConstructType.Chain ? Constructs.Chain :
                Type extends ConstructType.Lambda ? Constructs.Lambda :
                    Type extends ConstructType.Dictionary ? Constructs.Dictionary :
                        Type extends ConstructType.Return ? Constructs.Return :
                            Type extends ConstructType.Operation ? Constructs.Expression :
                                Type extends ConstructType.Assignment ? Constructs.Assignment : never>;

export const valueTokenTypes: readonly TokenTypes[] = ['string', 'binary', 'octal', 'decimal', 'hexadecimal', 'float', 'boolean', 'name'] as const;

export type Value =
    Token<typeof valueTokenTypes[number]>
    | Construct
    | Block;

export type NestedToken = (Token | NestedToken)[];