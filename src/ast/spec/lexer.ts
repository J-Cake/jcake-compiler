export const keywords = ['if', 'else', 'do', 'each', 'repeat', 'import', 'closure', 'fn'] as const;
export const operators: Record<string, readonly [precedence: number, left_assosciative: boolean]> = {
    '+': [1, true],
    '-': [1, true],
    '*': [2, true],
    '/': [2, true],
    '%': [2, true],
    '**': [3, false],

    '==': [0, true],
    '>': [0, true],
    '<': [0, true],
    '>=': [0, true],
    '<=': [0, true],

    'and': [0, true],
    'or': [0, true],
    'not': [0, false],
    'nor': [0, true],
    'nand': [0, true],
    'xor': [0, true],
    'xnor': [0, true]
} as const;

export const assignments: readonly string[] = [
    '=',
    '+=',
    '*=',
    '-=',
    '/=',
    '%=',
    '**='
]

const tokenNames = [
    'float',
    'scientific',
    'binary',
    'octal',
    'decimal',
    'hexadecimal',
    'boolean',
    'string',
    'operator',
    'assignment',
    'name',
    'keyword',
    'return',
    '(',
    '[',
    '{',
    ')',
    ']',
    '}',
    ':',
    '.',
    ',',
    '=>',
    'whitespace',
    'newline',
    'comment'
] as const;

export type TokenTypes = (typeof tokenNames)[number];

export const matchers: Record<TokenTypes, RegExp | readonly string[] | ((token: string) => boolean)> = {
    float: /^-?\d+\.\d+$/,
    scientific: /^-?\d+(\.\d+)?[eE]-?\d+$/,
    binary: /^-?0b[0-1]+$/,
    octal: /^-?0o[0-7]+$/,
    decimal: /^-?(0d)?[0-9]+$/,
    hexadecimal: /^-?0x[0-9a-fA-F]+$/,
    boolean: ['true', 'false'],
    string: /(^".*"$)|(^'.*'$)/,

    operator: Object.keys(operators),
    assignment: assignments,
    '=>': ['=>'],

    keyword: keywords,
    return: ['return'],
    name: /^[$_a-zA-Z][$_a-zA-Z0-9]*$/,

    whitespace: /^[ \f\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/,
    newline: /^\n+$/,
    comment: token => token.startsWith('#') && !token.includes('\n'),

    "(": ['('],
    "[": ['['],
    "{": ['{'],
    ")": [')'],
    "]": [']'],
    "}": ['}'],
    ":": [':'],
    ".": /^!?(\.|:{2,})$/,
    ",": [',', ';'],
} as const;