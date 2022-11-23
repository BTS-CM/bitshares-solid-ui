import { createStore } from "solid-js/store";
import {hash, PublicKey} from "bitsharesjs";

const [backupStore, setBackupStore] = createStore({
    name: null,
    contents: null,
    sha1: null,
    size: null,
    last_modified: null,
    public_key: null,
    wallet_object: null,
    setWalletObjct(wallet_object) {
        setBackupStore("wallet_object", wallet_object);
    },
    onReset() {
        setBackupStore({
            name: null,
            contents: null,
            sha1: null,
            size: null,
            last_modified: null,
            public_key: null,
            wallet_object: null
        });
    },
    onIncommingFile({name, contents, last_modified}) {
        var sha1 = hash.sha1(contents).toString("hex");
        var size = contents.length;
        var public_key = _getBackupPublicKey(contents);
        setBackupStore({
            name: name,
            contents: contents,
            sha1: sha1,
            size: size,
            last_modified: last_modified,
            public_key: public_key
        });
    },
    onIncommingBuffer({name, contents, public_key}) {
        backupStore.onReset();
        var sha1 = hash.sha1(contents).toString("hex");
        var size = contents.length;
        if (!public_key) {
            public_key = _getBackupPublicKey(contents);
        }
        setBackupStore({
            name: name,
            contents: contents,
            sha1: sha1,
            size: size,
            public_key: public_key
        });
    }
});

export const useBackupStore = () => [backupStore, setBackupStore];

/**
 * @param {Array} contents 
 * @returns {PublicKey}
 */
function _getBackupPublicKey(contents) {
    try {
        return PublicKey.fromBuffer(contents.slice(0, 33));
    } catch (e) {
        console.error(e, e.stack);
    }
}
