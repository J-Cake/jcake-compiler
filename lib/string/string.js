export const sliceFn = {
    name: 'slice',
    args: ['string', 'start', 'end'],
    callback(args) {
        // return args[0].slice(args[1], args[2]);
    }
};

export const concatFn = {
    name: 'concat',
    args: ['a', 'b'],
    callback(args) {

    }
}

export default function() {
    return {
        slice: sliceFn,
        concat: concatFn
    }
}