function set(name, value) {
    return {name, value};
}

function get(name) {
    return {name};
}

function reset() {
    return true;
}

export {
    set,
    get,
    reset
};
