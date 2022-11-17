import iDB from "idb-instance";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";

import { createStore } from 'solid-js/store'

// TODO: Replace following store references with solid-js store
import PrivateKeyStore from "stores/PrivateKeyStore";
import chainIds from "chain/chainIds";

// TODO: Replace the following line:
//this.bindListeners({onAddPrivateKey: PrivateKeyActions.addKey});

const [accountRefsStore, setAccountRefsStore] = createStore({
    chainstore_account_ids_by_key: null,
    chainstore_account_ids_by_account: null,
    no_account_refs: Immutable.Set(),
    account_refs: Immutable.Map().set(_getChainId(), Immutable.Set()),
    getAccountRefs(chainId = _getChainId()) {
        return accountRefsStore.account_refs.get(chainId, Immutable.Set());
    },
    onAddPrivateKey({private_key_object}) {
        if (
            ChainStore.getAccountRefsOfKey(private_key_object.pubkey) !==
            undefined
        ) {
            accountRefsStore.chainStoreUpdate();
        }
    },
    loadDbData() {
        setAccountRefsStore({
            chainstore_account_ids_by_key: null,
            chainstore_account_ids_by_account: null,
            no_account_refs: Immutable.Set()
        })
    
        let account_refs = new Immutable.Map();
        account_refs = account_refs.set(_getChainId(), Immutable.Set());
        setAccountRefsStore('account_refs', account_refs)
        

        return _loadNoAccountRefs()
            .then(no_account_refs => {
                setAccountRefsStore('no_account_refs', no_account_refs)
            })
            .then(() => accountRefsStore.chainStoreUpdate());
    },
    chainStoreUpdate() {
        if (
            accountRefsStore.chainstore_account_ids_by_key === ChainStore.account_ids_by_key &&
            accountRefsStore.chainstore_account_ids_by_account === ChainStore.account_ids_by_account
        ) {
            return;
        }

        setAccountRefsStore({
            chainstore_account_ids_by_key: ChainStore.account_ids_by_key,
            chainstore_account_ids_by_account: ChainStore.account_ids_by_account
        })

        accountRefsStore.checkPrivateKeyStore();
    },
    checkPrivateKeyStore() {
        let no_account_refs = accountRefsStore.no_account_refs;
        let temp_account_refs = Immutable.Set();
        PrivateKeyStore.getState()
            .keys.keySeq()
            .forEach(pubkey => {
                if (no_account_refs.has(pubkey)) return;
                let refs = ChainStore.getAccountRefsOfKey(pubkey);
                if (refs === undefined) return;
                if (!refs.size) {
                    // Performance optimization...
                    // There are no references for this public key, this is going
                    // to block it.  There many be many TITAN keys that do not have
                    // accounts for example.
                    {
                        // Do Not block brainkey generated keys.. Those are new and
                        // account references may be pending.
                        let private_key_object = PrivateKeyStore.getState().keys.get(
                            pubkey
                        );
                        if (
                            typeof private_key_object.brainkey_sequence ===
                            "number"
                        ) {
                            return;
                        }
                    }
                    no_account_refs = no_account_refs.add(pubkey);
                    return;
                }
                temp_account_refs = temp_account_refs.add(refs.valueSeq());
            });
        temp_account_refs = temp_account_refs.flatten();
    
        /* Discover accounts referenced by account name in permissions */
        temp_account_refs.forEach(account => {
            let refs = ChainStore.getAccountRefsOfAccount(account);
            if (refs === undefined) {
                return
            };
            if (!refs.size) {
                return
            };
            temp_account_refs = temp_account_refs.add(refs.valueSeq());
        });
        temp_account_refs = temp_account_refs.flatten();
        if (!accountRefsStore.getAccountRefs().equals(temp_account_refs)) {
            setAccountRefsStore('account_refs', accountRefsStore.account_refs.set(_getChainId(), temp_account_refs));
            // console.log("AccountRefsStore account_refs", accountRefsStore.account_refs.size);
        }
        if (!accountRefsStore.no_account_refs.equals(no_account_refs)) {
            setAccountRefsStore('no_account_refs', no_account_refs);
            _saveNoAccountRefs(no_account_refs);
        }
    }
});

ChainStore.subscribe(accountRefsStore.chainStoreUpdate);
export const useAccountRefsStore = () => [accountRefsStore, setAccountRefsStore];

function _getChainId() {
    return Apis.instance().chain_id || chainIds.MAIN_NET;
}

/*
*  Performance optimization for large wallets, no_account_refs tracks pubkeys
*  that do not have a corresponding account and excludes them from future api calls
*  to get_account_refs. The arrays are stored in the indexed db, one per chain id
*/
function _loadNoAccountRefs() {
    let chain_id = Apis.instance().chain_id;
    let refKey = `no_account_refs${
        !!chain_id ? "_" + chain_id.substr(0, 8) : ""
    }`;
    return iDB.root.getProperty(refKey, []).then(array => Immutable.Set(array));
}

function _saveNoAccountRefs(no_account_refs) {
    let array = [];
    let chain_id = Apis.instance().chain_id;
    let refKey = `no_account_refs${
        !!chain_id ? "_" + chain_id.substr(0, 8) : ""
    }`;
    for (let pubkey of no_account_refs) array.push(pubkey);
    iDB.root.setProperty(refKey, array);
}
