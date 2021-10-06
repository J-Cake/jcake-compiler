# J-Cake Compiler

> **Warning**: Incomplete

My little compiler project is not really a compiler, but moreso a program which understands a language.

### Building

```bash
$ pnpm install
$ pnpx tsc # Find typing errors (not actually required)
$ pnpm build:compiler # Creates a bundle to use

$ pnpm compile --main ./test/main.ark --lex-mode classic # classic lex mode seems to have better support for string parsing
```