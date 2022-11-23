import { createStore } from "solid-js/store";
import Immutable from "immutable";
import {key} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";
import iDB from "idb-instance";
//import { set } from '~/actions/CachedPropertyActions';

const [balanceClaimActiveStore, setBalanceClaimActiveStore] = createStore({
    no_balance_address: new Set(), // per chain
    addresses: new Set(),
    pubkeys: null,
    address_to_pubkey: new Map(),
    balances: undefined,
    checked: Immutable.Map(),
    selected_balances: Immutable.Seq(),
    claim_account_name: undefined,
    loading: true,
    /** Reset for each wallet load or change */
    reset() {
        setBalanceClaimActiveStore("no_balance_address", new Set());
        setBalanceClaimActiveStore("pubkeys", null);
        setBalanceClaimActiveStore("addresses", new Set());
        setBalanceClaimActiveStore("address_to_pubkey", new Map());
        setBalanceClaimActiveStore("balances", undefined);
        setBalanceClaimActiveStore("checked", Immutable.Map());
        setBalanceClaimActiveStore("selected_balances", Immutable.Seq());
        setBalanceClaimActiveStore("claim_account_name", undefined);
        setBalanceClaimActiveStore("loading", true);
    },
    onTransactionBroadcasted() {
        // Balance claims are included in a block...
        // chainStoreUpdate did not include removal of balance claim objects
        // This is a hack to refresh balance claims after a transaction.
        balanceClaimActiveStore.refreshBalances();
    },
    // param: Immutable Seq or array
    onSetPubkeys(pubkeys) {
        if (Array.isArray(pubkeys)) {
            pubkeys = Immutable.Seq(pubkeys);
        }
        if (balanceClaimActiveStore.pubkeys && balanceClaimActiveStore.pubkeys.equals(pubkeys)) {
            return;
        }
        balanceClaimActiveStore.reset();
        setBalanceClaimActiveStore("pubkeys", pubkeys);
        if (pubkeys.size === 0) {
            setBalanceClaimActiveStore("loading", false);
            return true;
        }
        setBalanceClaimActiveStore("loading", true);
        balanceClaimActiveStore.loadNoBalanceAddresses()
            .then(() => {
                // for(let pubkey of pubkeys) {
                balanceClaimActiveStore.indexPubkeys(pubkeys);
                // }

                balanceClaimActiveStore.refreshBalances();
                return false;
            })
            .catch(error => console.error(error));
    },
    onSetSelectedBalanceClaims(checked) {
        var selected_balances = checked
            .valueSeq()
            .flatten()
            .toSet();
        setBalanceClaimActiveStore({
            checked: checked,
            selected_balances: selected_balances
        });
    },
    onClaimAccountChange(claim_account_name) {
        setBalanceClaimActiveStore("claim_account_name", claim_account_name);
    },
    loadNoBalanceAddresses() {
        if (balanceClaimActiveStore.no_balance_address.size) return Promise.resolve();
        return iDB.root.getProperty("no_balance_address", []).then(array => {
            // console.log("loadNoBalanceAddresses", array.length)
            setBalanceClaimActiveStore("no_balance_address", new Set(array));
        });
    },
    indexPubkeys(pubkeys) {
        let {address_to_pubkey} = balanceClaimActiveStore;

        for (let pubkey of pubkeys) {
            for (let address_string of key.addresses(pubkey)) {
                if (!balanceClaimActiveStore.no_balance_address.has(address_string)) {
                    // AddressIndex indexes all addresses .. Here only 1 address is involved
                    setBalanceClaimActiveStore(
                        "address_to_pubkey",
                        address_to_pubkey.set(address_string, pubkey)
                    );
                    setBalanceClaimActiveStore(
                        "addresses",
                        balanceClaimActiveStore.addresses.add(address_string)
                    );
                }
            }
        }
        setBalanceClaimActiveStore("address_to_pubkey", address_to_pubkey);
    },
    indexPubkey(pubkey) {
        for (let address_string of key.addresses(pubkey)) {
            if (!balanceClaimActiveStore.no_balance_address.has(address_string)) {
                // AddressIndex indexes all addresses .. Here only 1 address is involved
                setBalanceClaimActiveStore({
                    address_to_pubkey: balanceClaimActiveStore.address_to_pubkey.set(address_string, pubkey),
                    addresses: balanceClaimActiveStore.addresses.add(address_string)
                });
            }
        }
        setBalanceClaimActiveStore(
            "address_to_pubkey",
            balanceClaimActiveStore.address_to_pubkey
        );
    },
    refreshBalances() {
        balanceClaimActiveStore.lookupBalanceObjects().then(balances => {
            setBalanceClaimActiveStore({
                loading: true,
                balances: balances,
                checked: Immutable.Map(),
                selected_balances: Immutable.Seq(),
                claim_account_name: undefined
            });
            setBalanceClaimActiveStore("loading", false);
        });
    },
    /** @return Promise.resolve(balances) */
    lookupBalanceObjects() {
        var db = Apis.instance().db_api();
        var no_balance_address = new Set(balanceClaimActiveStore.no_balance_address);
        var no_bal_size = no_balance_address.size;
        for (let addy of balanceClaimActiveStore.addresses) {
            no_balance_address.add(addy);
        }
        // for(let addy of balanceClaimActiveStore.addresses) ChainStore.getBalanceObjects(addy) // Test with ChainStore
        return db
            .exec("get_balance_objects", [Array.from(balanceClaimActiveStore.addresses)])
            .then(result => {
                var balance_ids = [];
                for (let balance of result) balance_ids.push(balance.id);
                return db
                    .exec("get_vested_balances", [balance_ids])
                    .then(vested_balances => {
                        var balances = Immutable.List().withMutations(
                            balance_list => {
                                for (let i = 0; i < result.length; i++) {
                                    var balance = result[i];
                                    no_balance_address.delete(balance.owner);
                                    if (balance.vesting_policy) {
                                        balance.vesting_balance = vested_balances[i];
                                    }
                                    balance_list.push(balance);
                                }

                                if (no_bal_size !== no_balance_address.size) {
                                    balanceClaimActiveStore.saveNoBalanceAddresses(
                                        no_balance_address
                                    ).catch(error => console.error(error));
                                }
                            }
                        );
                        return balances;
                    });
            });
    },
    saveNoBalanceAddresses(no_balance_address) {
        setBalanceClaimActiveStore("no_balance_address", no_balance_address);
        var array = [];
        for (let addy of balanceClaimActiveStore.no_balance_address) {
            array.push(addy);
        }
        // console.log("saveNoBalanceAddresses", array.length)
        return iDB.root.setProperty("no_balance_address", array);
    }
});

export const useBalanceClaimActiveStore = () => [balanceClaimActiveStore, setBalanceClaimActiveStore];