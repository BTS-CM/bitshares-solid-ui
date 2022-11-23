import { createStore } from "solid-js/store";
import {key} from "bitsharesjs";
import {ChainConfig} from "bitsharesjs-ws";
import Immutable from "immutable";
import iDB from "idb-instance";

let AddressIndexWorker;
if (__ELECTRON__) {
    AddressIndexWorker = require("worker-loader?inline=no-fallback!workers/AddressIndexWorker")
        .default;
}

const [addressIndex, setAddressIndex] = createStore({
    addresses: Immutable.Map(),
    saving: false,
    pubkeys: new Set(),
    saving() {
        if (addressIndex.saving) {
            return;
        }
        setAddressIndex("saving", true);
    },
    /** Add public key string (if not already added).  Reasonably efficient
        for less than 10K keys.
    */
    add(pubkey) {
        addressIndex.loadAddyMap()
            .then(() => {
                var dirty = false;
                if (addressIndex.pubkeys.has(pubkey)) {
                    return;
                }
                setAddressIndex("pubkeys", addressIndex.pubkeys.add(pubkey));
                addressIndex.saving();
                // Gather all 5 legacy address formats (see key.addresses)
                var address_strings = key.addresses(pubkey);
                for (let address of address_strings) {
                    setAddressIndex(
                        "addresses",
                        addressIndex.addresses.set(
                            address,
                            pubkey
                        )
                    );
                    dirty = true;
                }
                if (dirty) {
                    setAddressIndex("addresses", addressIndex.addresses);
                    addressIndex.saveAddyMap();
                } else {
                    setAddressIndex("saving", false);
                }
            })
            .catch(e => {
                throw e;
            });
    },
    /** Worker thread implementation (for more than 10K keys) */
    addAll(pubkeys) {
        return new Promise((resolve, reject) => {
            addressIndex.saving();
            addressIndex.loadAddyMap()
                .then(() => {
                    if (!__ELECTRON__) {
                        AddressIndexWorker = require("worker-loader!workers/AddressIndexWorker")
                            .default;
                    }
                    let worker = new AddressIndexWorker();
                    worker.postMessage({
                        pubkeys,
                        address_prefix: ChainConfig.address_prefix
                    });

                    worker.onmessage = event => {
                        try {
                            let key_addresses = event.data;
                            let dirty = false;
                            let addresses = addressIndex.addresses.withMutations(
                                addresses => {
                                    for (let i = 0; i < pubkeys.length; i++) {
                                        let pubkey = pubkeys[i];
                                        if (addressIndex.pubkeys.has(pubkey)) {
                                            continue;
                                        }
                                        
                                        setAddressIndex("pubkeys", addressIndex.pubkeys.add(pubkey));
                                        // Gather all 5 legacy address formats (see key.addresses)
                                        let address_strings = key_addresses[i];
                                        for (let address of address_strings) {
                                            addresses.set(address, pubkey);
                                            dirty = true;
                                        }
                                    }
                                }
                            );
                            if (dirty) {
                                setAddressIndex("addresses", addresses);
                                addressIndex.saveAddyMap();
                            } else {
                                setAddressIndex("saving", false);
                            }
                            resolve();
                        } catch (e) {
                            console.error("AddressIndex.addAll", e);
                            reject(e);
                        }
                    };
                })
                .catch(e => {
                    throw e;
                });
        });
    },
    loadAddyMap() {
        if (addressIndex.loadAddyMapPromise) {
            return addressIndex.loadAddyMapPromise;
        }
        setAddressIndex(
            "loadAddyMapPromise",
            iDB.root
                .getProperty("AddressIndex")
                .then(map => {
                    setAddressIndex(
                        "addresses",
                        map
                            ? Immutable.Map(map)
                            : Immutable.Map()
                    );

                    // console.log("AddressIndex load", addressIndex.addresses.size);
                    addressIndex.addresses
                        .valueSeq()
                        .forEach(pubkey => {
                            setAddressIndex("pubkeys", addressIndex.pubkeys.add(pubkey));
                        });
                
                    setAddressIndex("addresses", addressIndex.addresses);
                })
        );

        return addressIndex.loadAddyMapPromise;
    },
    saveAddyMap() {
        clearTimeout(addressIndex.saveAddyMapTimeout);
        setAddressIndex(
            "saveAddyMapTimeout",
            setTimeout(() => {
                // console.log("AddressIndex save", addressIndex.addresses.size);
                setAddressIndex("saving", false);

                // If indexedDB fails to save, it will re-try via PrivateKeyStore calling this.add
                return iDB.root.setProperty(
                    "AddressIndex",
                    addressIndex.addresses.toObject()
                );
            }, 100)
        );
    }
});

export const useAddressIndex = () => [addressIndex, setAddressIndex];