import {useCachedPropertyStore} from '../stores/CachedPropertyStore';
const [cachedPropertyStore, setCachedPropertyStore] = useCachedPropertyStore();

function set(name, value) {
    cachedPropertyStore.onSet({name, value});
    return {name, value};
}

function get(name) {
    cachedPropertyStore.onGet({name});
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
