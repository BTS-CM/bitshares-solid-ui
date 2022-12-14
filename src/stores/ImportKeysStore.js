import { createStore } from "solid-js/store";

const [importKeysStore, setImportKeysStore] = createStore({
    importing: false,
    import(importing) {
        setImportKeysStore("importing", importing);
    }
});

export const useImportKeysStore = () => [importKeysStore, setImportKeysStore];