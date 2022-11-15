import Immutable from "immutable";
import { createStore } from 'solid-js/store';
import idb_helper from "idb-helper";
import WalletDb from "./WalletDb";

import {PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKeyActions from "actions/PrivateKeyActions";
import CachedPropertyActions from "actions/CachedPropertyActions";
import AddressIndex from "stores/AddressIndex";
import {PublicKey, ChainStore, Aes} from "bitsharesjs";

/*
    privateKeyStore.bindListeners({
        onLoadDbData: PrivateKeyActions.loadDbData,
        onAddKey: PrivateKeyActions.addKey
    });
*/

/** No need to wait on the promises returned by this store as long as
    privateKeyStore.privateKeyStorage_error == false and
    privateKeyStore.pending_operation_count == 0 before performing any important
    operations.
*/
const [privateKeyStore, setPrivateKeyStore] = createStore({
    keys: Immutable.Map(),
    privateKeyStorage_error: false,
    pending_operation_count: 0,
    privateKeyStorage_error_add_key: null,
    privateKeyStorage_error_loading: null,
    reset: () => {
        setPrivateKeyStore("keys", Immutable.Map());
        setPrivateKeyStore("privateKeyStorage_error", false);
        setPrivateKeyStore("pending_operation_count", 0);
        setPrivateKeyStore("privateKeyStorage_error_add_key", null);
        setPrivateKeyStore("privateKeyStorage_error_loading", null);
    },
    setPasswordLoginKey(key) {
        let keys = privateKeyStore.keys.set(key.pubkey, key);
        setPrivateKeyStore("keys", keys);
    },
    /** This method may be called again should the main database change */
    onLoadDbData(resolve) {
        //resolve is deprecated
        privateKeyStore.pendingOperation();
        privateKeyStore.reset();
        let keys = Immutable.Map().asMutable();
        let p = idb_helper
            .cursor("private_keys", cursor => {
                if (!cursor) {
                    setPrivateKeyStore("keys", keys.asImmutable());
                    return;
                }
                let private_key_tcomb = PrivateKeyTcomb(cursor.value);
                keys.set(private_key_tcomb.pubkey, private_key_tcomb);
                AddressIndex.add(private_key_tcomb.pubkey);
                cursor.continue();
            })
            .then(() => {
                privateKeyStore.pendingOperationDone();
            })
            .catch(error => {
                privateKeyStore.reset();
                privateKeyStore.privateKeyStorageError("loading", error);
                throw error;
            });
        resolve(p);
    },
    hasKey(pubkey) {
        return privateKeyStore.keys.has(pubkey);
    },
    getPubkeys() {
        return privateKeyStore.keys.keySeq().toArray();
    },
    getPubkeys_having_PrivateKey(pubkeys, addys = null) {
        let return_pubkeys = [];
        if (pubkeys) {
            for (let pubkey of pubkeys) {
                if (privateKeyStore.hasKey(pubkey)) {
                    return_pubkeys.push(pubkey);
                }
            }
        }
        if (addys) {
            let addresses = AddressIndex.getState().addresses;
            for (let addy of addys) {
                let pubkey = addresses.get(addy);
                return_pubkeys.push(pubkey);
            }
        }
        return return_pubkeys;
    },
    getTcomb_byPubkey(public_key) {
        if (!public_key) {
            return null
        };
        if (public_key.Q) {
            public_key = public_key.toPublicKeyString();
        }
        return privateKeyStore.keys.get(public_key);
    },
    onAddKey({private_key_object, transaction, resolve}) {
        // resolve is deprecated
        if (privateKeyStore.keys.has(private_key_object.pubkey)) {
            resolve({result: "duplicate", id: null});
            return;
        }

        privateKeyStore.pendingOperation();
        //console.log("... onAddKey private_key_object.pubkey", private_key_object.pubkey)

        privateKeyStore.keys = privateKeyStore.keys.set(
            private_key_object.pubkey,
            PrivateKeyTcomb(private_key_object)
        );
        setPrivateKeyStore("keys", privateKeyStore.keys);
        AddressIndex.add(private_key_object.pubkey);
        let p = new Promise((resolve, reject) => {
            PrivateKeyTcomb(private_key_object);
            let duplicate = false;
            let p = idb_helper.add(
                transaction.objectStore("private_keys"),
                private_key_object
            );

            p.catch(event => {
                // ignore_duplicates
                let error = event.target.error;
                console.log("... error", error, event);
                if (
                    error.name != "ConstraintError" ||
                    error.message.indexOf("by_encrypted_key") == -1
                ) {
                    privateKeyStore.privateKeyStorageError("add_key", error);
                    throw event;
                }
                duplicate = true;
                event.preventDefault();
            }).then(() => {
                privateKeyStore.pendingOperationDone();
                if (duplicate) return {result: "duplicate", id: null};
                if (private_key_object.brainkey_sequence == null)
                    privateKeyStore.binaryBackupRecommended(); // non-deterministic
                idb_helper.on_transaction_end(transaction).then(() => {
                    setPrivateKeyStore("keys", privateKeyStore.keys);
                });
                return {
                    result: "added",
                    id: private_key_object.id
                };
            });
            resolve(p);
        });
        resolve(p);
    },
    /** WARN: does not update AddressIndex.  This is designed for bulk importing.
        @return duplicate_count
    */
    addPrivateKeys_noindex(private_key_objects, transaction) {
        let store = transaction.objectStore("private_keys");
        let duplicate_count = 0;
        let keys = privateKeyStore.keys.withMutations(keys => {
            for (let private_key_object of private_key_objects) {
                if (privateKeyStore.keys.has(private_key_object.pubkey)) {
                    duplicate_count++;
                    continue;
                }
                let private_tcomb = PrivateKeyTcomb(private_key_object);
                store.add(private_key_object);
                keys.set(private_key_object.pubkey, private_tcomb);
                ChainStore.getAccountRefsOfKey(private_key_object.pubkey);
            }
        });
        setPrivateKeyStore("keys", keys);
        privateKeyStore.binaryBackupRecommended();
        return duplicate_count;
    },
    binaryBackupRecommended() {
        CachedPropertyActions.set("backup_recommended", true);
    },
    pendingOperation() {
        privateKeyStore.pending_operation_count++;
        setPrivateKeyStore("pending_operation_count", privateKeyStore.pending_operation_count);
    },
    pendingOperationDone() {
        if (privateKeyStore.pending_operation_count == 0) {
            throw new Error("Pending operation done called too many times");
        }
        privateKeyStore.pending_operation_count--;
        setPrivateKeyStore("pending_operation_count", privateKeyStore.pending_operation_count);
    },
    privateKeyStorageError(property, error) {
        privateKeyStore.pendingOperationDone();
        console.error("privateKeyStorage_error_" + property, error);
        setPrivateKeyStore("privateKeyStorage_error", true);
        setPrivateKeyStore("privateKeyStorage_error_" + property, error);
    },
    decodeMemo(memo) {
        let lockedWallet = false;
        let memo_text,
            isMine = false;
        let from_private_key = privateKeyStore.keys.get(memo.from);
        let to_private_key = privateKeyStore.keys.get(memo.to);
        let private_key = from_private_key ? from_private_key : to_private_key;
        let public_key = from_private_key ? memo.to : memo.from;
        public_key = PublicKey.fromPublicKeyString(public_key);

        try {
            private_key = WalletDb.decryptTcomb_PrivateKey(private_key);
        } catch (e) {
            // Failed because wallet is locked
            lockedWallet = true;
            private_key = null;
            isMine = true;
        }

        if (private_key) {
            let tryLegacy = false;
            try {
                memo_text = private_key
                    ? Aes.decrypt_with_checksum(
                          private_key,
                          public_key,
                          memo.nonce,
                          memo.message
                      ).toString("utf-8")
                    : null;

                if (private_key && !memo_text) {
                    // debugger
                }
            } catch (e) {
                console.log("transfer memo exception ...", e);
                memo_text = "*";
                tryLegacy = true;
            }

            // Apply legacy method if new, correct method fails to decode
            if (private_key && tryLegacy) {
                // debugger;
                try {
                    memo_text = Aes.decrypt_with_checksum(
                        private_key,
                        public_key,
                        memo.nonce,
                        memo.message,
                        true
                    ).toString("utf-8");
                } catch (e) {
                    console.log("transfer memo exception ...", e);
                    memo_text = "**";
                }
            }
        }

        return {
            text: memo_text,
            isMine
        };
    }
});

export const usePrivateKeyStore = () => [privateKeyStore, setPrivateKeyStore];