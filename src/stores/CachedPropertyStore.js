import { createStore } from 'solid-js/store'
import Immutable from "immutable";
import iDB from "idb-instance";
//import CachedPropertyActions from "actions/CachedPropertyActions";

/*
this.bindListeners({
    onSet: CachedPropertyActions.set,
    onGet: CachedPropertyActions.get
});
*/

const [cachedPropertyStore, setCachedPropertyStore] = createStore({
    props: Immutable.Map(),
    get(name) {
        return cachedPropertyStore.onGet({name});
    },
    onSet({name, value}) {
        if (cachedPropertyStore.props.get(name) === value) {
            return
        };
        var props = cachedPropertyStore.props.set(name, value);
        setCachedPropertyStore('props', props);
        iDB.setCachedProperty(name, value).then(() => {
            setCachedPropertyStore('props', props);
        });
    },
    onGet({name}) {
        var value = cachedPropertyStore.props.get(name);
        if (value !== undefined) {
            return value
        };
        try {
            iDB.getCachedProperty(name, null).then(value => {
                var props = cachedPropertyStore.props.set(name, value);
                setCachedPropertyStore('props', props);
            });
        } catch (err) {
            console.error("getCachedProperty error:", err);
        }
    },
    reset() {
        setCachedPropertyStore('props', Immutable.Map());
    }
});

export const useCachedPropertyStore = () => [cachedPropertyStore, setCachedPropertyStore];