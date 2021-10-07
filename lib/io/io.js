export const println_out = {
    name: 'println_out',
    args: ['values'],
    callback(args) {
        console.log(args);
    }
}

export const println_err = {
    name: 'println_err',
    args: ['values'],
    callback(args) {
        console.log(args);
    }
}

export const print_out = {
    name: 'print_out',
    args: ['values'],
    callback(args) {
        console.log(args);
    }
}

export const print_err = {
    name: 'print_err',
    args: ['values'],
    callback(args) {
        console.log(args);
    }
}

export default function() {
    return {
        println_out,
        println_err,
        print_out,
        print_err
    }
}