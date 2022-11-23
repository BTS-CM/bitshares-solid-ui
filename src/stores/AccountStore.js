import Immutable from "immutable";
import { createStore } from 'solid-js/store'
import {ChainStore, ChainValidation, FetchChain} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";

import iDB from "idb-instance";
import { usePrivateKeyStore } from './PrivateKeyStore';
const [privateKeyStore, setPrivateKeyStore] = usePrivateKeyStore();

import { useAccountRefsStore } from "./AccountRefsStore";
const [accountRefsStore, setAccountRefsStore] = useAccountRefsStore();

import ls from "common/localStorage";
let ss = ls("__graphene__");

/**
 *  This Store holds information about accounts in this wallet
 */
const [accountStore, setAccountStore] = createStore({
    subbed: false,
    myActiveAccounts: Immutable.Set(), // accounts for which the user controls the keys and are visible
    myHiddenAccounts: Immutable.Set(), // accounts for which the user controls the keys that have been 'hidden' in the settings
    currentAccount: null, // the currently selected account, subset of starredAccounts
    passwordAccount: null, // passwordAccount is the account used when logging in with cloud mode
    starredAccounts: Immutable.Map(), // starred accounts are 'active' accounts that can be selected using the right menu dropdown for trading/transfers etc
    searchAccounts: Immutable.Map(),
    accountContacts: Immutable.Set(),
    linkedAccounts: Immutable.Set(), // linkedAccounts are accounts for which the user controls the private keys, which are stored in a db with the wallet and automatically loaded every time the app starts
    referralAccount: _checkReferrer(),
    passwordLogin() {
        // can't use settings store due to possible initialization race conditions
        const storedSettings = ss.get("settings_v4", {});
        if (storedSettings.passwordLogin === undefined) {
            storedSettings.passwordLogin = true;
        }
        return storedSettings.passwordLogin;
    },
    getMyAccounts() {
        if (!accountStore.subbed) {
            return [];
        }

        let accounts = [];
        for (let account_name of accountStore.myActiveAccounts) {
            let account = ChainStore.getAccount(account_name);
            if (account === undefined) {
                // console.log(account_name, "account undefined");
                continue;
            }
            if (account == null) {
                console.log(
                    "WARN: non-chain account name in myActiveAccounts",
                    account_name
                );
                continue;
            }
            let auth = accountStore.getMyAuthorityForAccount(account);

            if (auth === undefined) {
                // console.log(account_name, "auth undefined");
                continue;
            }

            if (auth === "full" || auth === "partial") {
                accounts.push(account_name);
            }
        }

        /*
         * If we're in cloud wallet mode, simply return the current
         * cloud wallet account
         */
        if (accountStore.passwordLogin)
            return !!accountStore.passwordAccount
                ? [accountStore.passwordAccount]
                : [];

        /* In wallet mode, return a sorted list of all the active accounts */
        return accounts.sort();
    },
    setWallet(wallet_name) {
        if (wallet_name !== accountStore.wallet_name) {
            setAccountStore({
                wallet_name: wallet_name,
                passwordAccount: ss.get(
                    _getStorageKey("passwordAccount", {wallet_name}),
                    null
                ),
                starredAccounts: Immutable.Map(
                    ss.get(_getStorageKey("starredAccounts", {wallet_name}))
                ),
                myActiveAccounts: Immutable.Set(),
                accountContacts: Immutable.Set(
                    ss.get(_getStorageKey("accountContacts", {wallet_name}), [])
                ),
                myHiddenAccounts: Immutable.Set(
                    ss.get(_getStorageKey("hiddenAccounts", {wallet_name}), [])
                )
            });

            accountStore.tryToSetCurrentAccount();

            _migrateUnfollowedAccounts({wallet_name});
        }
    },
    reset() {
        if (accountStore.subbed) {
            ChainStore.unsubscribe(accountStore.chainStoreUpdate);
        }

        setAccountStore('account_refs', null);
        setAccountStore('initial_account_refs_load', true); // true until all undefined accounts are found
    
        const wallet_name = accountStore.wallet_name || "";
        let starredAccounts = Immutable.Map(
            ss.get(_getStorageKey("starredAccounts", {wallet_name}))
        );
    
        let accountContacts = Immutable.Set(
            ss.get(_getStorageKey("accountContacts", {wallet_name}), [])
        );

        setAccountStore({
            neverShowBrowsingModeNotice: false,
            update: false,
            subbed: false,
            accountsLoaded: false,
            refsLoaded: false,
            currentAccount: null,
            referralAccount: ss.get("referralAccount", ""),
            passwordAccount: ss.get(_getStorageKey("passwordAccount", {wallet_name}), ""),
            myActiveAccounts: Immutable.Set(),
            myHiddenAccounts: Immutable.Set(
                ss.get(_getStorageKey("hiddenAccounts", {wallet_name}), [])
            ),
            searchAccounts: Immutable.Map(),
            searchTerm: "",
            wallet_name: wallet_name,
            starredAccounts: starredAccounts,
            accountContacts: accountContacts
        });
    },
    onSetWallet({wallet_name}) {
        setWallet(wallet_name);
    },
    onAddStarAccount(account) {
        if (!accountStore.starredAccounts.has(account)) {
            let starredAccounts = accountStore.starredAccounts.set(account, {
                name: account
            });
            setAccountStore('starredAccounts', starredAccounts);

            ss.set(
                _getStorageKey("starredAccounts"),
                starredAccounts.toJS()
            );
        } else {
            return false;
        }
    },
    onRemoveStarAccount(account) {
        let starredAccounts = accountStore.starredAccounts.delete(account);
        setAccountStore('starredAccounts', starredAccounts);
        ss.set(_getStorageKey("starredAccounts"), starredAccounts.toJS());
    },
    onSetPasswordAccount(account) {
        let key = _getStorageKey("passwordAccount");
        if (!account) {
            ss.remove(key);
        } else {
            ss.set(key, account);
        }
        if (accountStore.passwordAccount !== account) {
            setAccountStore('passwordAccount', account);
        }
    },
    onToggleHideAccount({account, hide}) {
        let {myHiddenAccounts, myActiveAccounts} = accountStore;
        if (hide && !myHiddenAccounts.has(account)) {
            myHiddenAccounts = myHiddenAccounts.add(account);
            myActiveAccounts = myActiveAccounts.delete(account);
        } else if (myHiddenAccounts.has(account)) {
            myHiddenAccounts = myHiddenAccounts.delete(account);
            myActiveAccounts = myActiveAccounts.add(account);
        }
        setAccountStore({
            myHiddenAccounts: myHiddenAccounts,
            myActiveAccounts: myActiveAccounts
        })
    },
    loadDbData() {
        let myActiveAccounts = Immutable.Set().asMutable();
        let chainId = Apis.instance().chain_id;
        return new Promise((resolve, reject) => {
            iDB.load_data("linked_accounts")
                .then(data => {
                    setAccountStore('linkedAccounts', Immutable.fromJS(
                        data || []
                    ).toSet());

                    /*
                     * If we're in cloud wallet mode, only fetch the currently
                     * used cloud mode account, if in wallet mode fetch all the
                     * accounts of that wallet for the current chain
                     */

                    let accountPromises =
                        !!accountStore.passwordLogin &&
                        !!accountStore.passwordAccount
                            ? [
                                  FetchChain(
                                      "getAccount",
                                      accountStore.passwordAccount
                                  )
                              ]
                            : !!accountStore.passwordLogin
                            ? []
                            : data
                                  .filter(a => {
                                      if (a.chainId) {
                                          return a.chainId === chainId;
                                      } else {
                                          return true;
                                      }
                                  })
                                  .map(a => {
                                      return FetchChain("getAccount", a.name);
                                  });

                    Promise.all(accountPromises)
                        .then(accounts => {
                            accounts.forEach(a => {
                                if (
                                    !!a &&
                                    accountStore.isMyAccount(a) &&
                                    !accountStore.myHiddenAccounts.has(
                                        a.get("name")
                                    )
                                ) {
                                    myActiveAccounts.add(a.get("name"));
                                } else if (!!a && !accountStore.isMyAccount(a)) {
                                    // Remove accounts not owned by the user from the linked_accounts db
                                    _unlinkAccount(a.get("name"));
                                }
                            });
                            let immutableAccounts = myActiveAccounts.asImmutable();
                            if (
                                accountStore.myActiveAccounts !==
                                immutableAccounts
                            ) {
                                setAccountStore('myActiveAccounts', myActiveAccounts.asImmutable());
                            }

                            if (accountStore.accountsLoaded === false) {
                                setAccountStore('accountsLoaded', true);
                            }

                            if (!accountStore.subbed) {
                                ChainStore.subscribe(accountStore.chainStoreUpdate);
                            }
                            setAccountStore('subbed', true);
                            accountStore.emitChange();
                            accountStore.chainStoreUpdate();
                            resolve();
                        })
                        .catch(err => {
                            if (!accountStore.subbed) {
                                ChainStore.subscribe(accountStore.chainStoreUpdate);
                            }
                            setAccountStore('subbed', true);
                            accountStore.emitChange();
                            accountStore.chainStoreUpdate();
                            reject(err);
                        });
                })
                .catch(err => {
                    reject(err);
                });
        });
    },
    chainStoreUpdate() {
        accountStore.addAccountRefs();
    },
    addAccountRefs() {
        //  Simply add them to the myActiveAccounts list (no need to persist them)
        let account_refs = accountRefsStore.getAccountRefs();
        if (
            !accountStore.initial_account_refs_load &&
            accountStore.account_refs === account_refs
        ) {
            if (accountStore.refsLoaded === false) {
                setAccountStore('refsLoaded', true);
            }
            return;
        }
        setAccountStore('account_refs', account_refs);
        let pending = false;

        if (accountStore.addAccountRefsInProgress) {
            return;
        }
        setAccountStore('addAccountRefsInProgress', true);

        let myActiveAccounts = accountStore.myActiveAccounts.withMutations(
            accounts => {
                account_refs.forEach(id => {
                    let account = ChainStore.getAccount(id);
                    if (account === undefined) {
                        pending = true;
                        return;
                    }

                    let linkedEntry = {
                        name: account.get("name"),
                        chainId: Apis.instance().chain_id
                    };
                    let isAlreadyLinked = accountStore.linkedAccounts.find(a => {
                        return (
                            a.get("name") === linkedEntry.name &&
                            a.get("chainId") === linkedEntry.chainId
                        );
                    });

                    /*
                     * Some wallets contain deprecated entries with no chain
                     * ids, remove these then write new entries with chain ids
                     */
                    const nameOnlyEntry = accountStore.linkedAccounts.findKey(
                        a => {
                            return (
                                a.get("name") === linkedEntry.name &&
                                !a.has("chainId")
                            );
                        }
                    );
                    if (!!nameOnlyEntry) {
                        setAccountStore(
                            'linkedAccounts',
                            accountStore.linkedAccounts.delete(nameOnlyEntry)
                        );
                        _unlinkAccount(account.get("name"));
                        isAlreadyLinked = false;
                    }
                    if (
                        account &&
                        accountStore.isMyAccount(account) &&
                        !isAlreadyLinked
                    ) {
                        _linkAccount(account.get("name"));
                    }
                    if (
                        account &&
                        !accounts.includes(account.get("name")) &&
                        !accountStore.myHiddenAccounts.has(account.get("name"))
                    ) {
                        accounts.add(account.get("name"));
                    }
                });
            }
        );

        /*
         * If we're in cloud wallet mode, simply set myActiveAccounts to the current
         * cloud wallet account
         */
        if (!!accountStore.passwordLogin) {
            myActiveAccounts = Immutable.Set(
                !!accountStore.passwordAccount ? [accountStore.passwordAccount] : []
            );
        }
        if (myActiveAccounts !== accountStore.myActiveAccounts) {
            setAccountStore('myActiveAccounts', myActiveAccounts);
        }
        setAccountStore({
            initial_account_refs_load: pending,
            addAccountRefsInProgress: false
        });
        accountStore.tryToSetCurrentAccount();
    },
    /**
        @todo "partial"
        @return string "none", "full", "partial" or undefined (pending a chain store lookup)
    */
    getMyAuthorityForAccount(account, recursion_count = 1) {
        if (!account) {
            return undefined
        };

        let owner_authority = account.get("owner");
        let active_authority = account.get("active");

        let owner_pubkey_threshold = _pubkeyThreshold(owner_authority);
        if (owner_pubkey_threshold == "full") {
            return "full"
        };
        let active_pubkey_threshold = _pubkeyThreshold(active_authority);
        if (active_pubkey_threshold == "full") {
            return "full"
        };

        let owner_address_threshold = _addressThreshold(owner_authority);
        if (owner_address_threshold == "full") {
            return "full"
        };
        let active_address_threshold = _addressThreshold(active_authority);
        if (active_address_threshold == "full") {
            return "full"
        };

        let owner_account_threshold, active_account_threshold;

        // if (account.get("name") === "secured-x") {
        //     debugger;
        // }

        if (recursion_count < 3) {
            owner_account_threshold = _accountThreshold(
                owner_authority,
                recursion_count
            );
            
            if (owner_account_threshold === undefined) {
                return undefined
            };

            if (owner_account_threshold == "full") {
                return "full"
            };

            active_account_threshold = _accountThreshold(
                active_authority,
                recursion_count
            );
            if (active_account_threshold === undefined) {
                return undefined
            };
            if (active_account_threshold == "full") {
                return "full"
            };
        }

        if (
            owner_pubkey_threshold === "partial" ||
            active_pubkey_threshold === "partial" ||
            owner_address_threshold === "partial" ||
            active_address_threshold === "partial" ||
            owner_account_threshold === "partial" ||
            active_account_threshold === "partial"
        ) {
            return "partial";
        }

        return "none";
    },
    isMyAccount(account) {
        let authority = accountStore.getMyAuthorityForAccount(account);
        if (authority === undefined) {
            return undefined
        };
        return authority === "partial" || authority === "full";
    },
    onAccountSearch(payload) {
        setAccountStore({
            searchTerm: payload.searchTerm,
            searchAccounts: accountStore.searchAccounts.clear()
        })
        payload.accounts.forEach(account => {
            setAccountStore(
                "searchAccounts",
                accountStore.searchAccounts.withMutations(
                    map => {
                        map.set(account[1], account[0]);
                    }
                )
            );
        });
    },
    tryToSetCurrentAccount() {
        const passwordAccountKey = _getStorageKey("passwordAccount");
        const currentAccountKey = _getStorageKey("currentAccount");
        if (ss.has(passwordAccountKey)) {
            const acc = ss.get(passwordAccountKey, null);
            if (accountStore.passwordAccount !== acc) {
                setAccountStore('passwordAccount', acc);
            }
            return accountStore.setCurrentAccount(acc);
        } else if (ss.has(currentAccountKey)) {
            return accountStore.setCurrentAccount(ss.get(currentAccountKey, null));
        }

        let {starredAccounts} = accountStore;
        if (starredAccounts.size) {
            return accountStore.setCurrentAccount(starredAccounts.first().name);
        }
        if (accountStore.myActiveAccounts.size) {
            return accountStore.setCurrentAccount(accountStore.myActiveAccounts.first());
        }
    },
    setCurrentAccount(name) {
        if (accountStore.passwordAccount) {
            name = accountStore.passwordAccount
        };
        const key = _getStorageKey();
        if (!name) {
            name = null;
        }

        if (accountStore.currentAccount !== name) {
            setAccountStore('currentAccount', name);
        }

        ss.set(key, name || null);
    },
    onSetCurrentAccount(name) {
        accountStore.setCurrentAccount(name);
    },
    onCreateAccount(name_or_account) {
        let account = name_or_account;
        if (typeof account === "string") {
            account = {
                name: account
            };
        }

        if (account["toJS"]) {
            account = account.toJS()
        };

        if (account.name == "" || accountStore.myActiveAccounts.get(account.name)) {
            return Promise.resolve();
        }

        if (!ChainValidation.is_account_name(account.name)) {
            throw new Error("Invalid account name: " + account.name);
        }

        return iDB
            .add_to_store("linked_accounts", {
                name: account.name,
                chainId: Apis.instance().chain_id
            })
            .then(() => {
                console.log(
                    "[AccountStore.js] ----- Added account to store: ----->",
                    account.name
                );
                setAccountStore("myActiveAccounts", accountStore.myActiveAccounts.add(account.name));
                if (accountStore.myActiveAccounts.size === 1) {
                    accountStore.setCurrentAccount(account.name);
                }
            });
    },
    onAddAccountContact(name) {
        if (!ChainValidation.is_account_name(name, true)) {
            throw new Error("Invalid account name: " + name);
        }

        if (!accountStore.accountContacts.has(name)) {
            const accountContacts = accountStore.accountContacts.add(name);
            ss.set(
                _getStorageKey("accountContacts"),
                accountContacts.toArray()
            );
            setAccountStore('accountContacts', accountContacts);
        }
    },
    onRemoveAccountContact(name) {
        if (!ChainValidation.is_account_name(name, true)) {
            throw new Error("Invalid account name: " + name);
        }

        if (accountStore.accountContacts.has(name)) {
            const accountContacts = accountStore.accountContacts.remove(name);
            ss.set(_getStorageKey("accountContacts"), accountContacts);
            setAccountStore('accountContacts', accountContacts);
        }
    },
    isMyKey(key) {
        return privateKeyStore.hasKey(key);
    },
    onChangeSetting(payload) {
        if (payload.setting === "passwordLogin") {
            if (payload.value === false) {
                accountStore.onSetPasswordAccount(null);
                ss.remove(_getStorageKey());
                accountStore.loadDbData();
            } else {
                setAccountStore('myActiveAccounts', Immutable.Set());
            }
            setAccountStore('passwordLogin', payload.value);
        }
    }
});

export const useAccountStore = () => [accountStore, setAccountStore];

function _getStorageKey(key = "currentAccount", state = accountStore) {
    const wallet = state.wallet_name;
    const chainId = Apis.instance().chain_id;
    return (
        key +
        (chainId ? `_${chainId.substr(0, 8)}` : "") +
        (wallet ? `_${wallet}` : "")
    );
},

function _migrateUnfollowedAccounts(state) {
    try {
        let unfollowed_accounts = ss.get("unfollowed_accounts", []);
        let hiddenAccounts = ss.get(
            _getStorageKey("hiddenAccounts", state),
            []
        );
        if (unfollowed_accounts.length && !hiddenAccounts.length) {
            ss.set(
                _getStorageKey("hiddenAccounts", state),
                unfollowed_accounts
            );
            ss.remove("unfollowed_accounts");
            setAccountStore('myHiddenAccounts', Immutable.Set(unfollowed_accounts));
        }
    } catch (err) {
        console.error(err);
    }
}

function _checkReferrer() {
    let referralAccount = "";
    if (window) {
        function getQueryParam(param) {
            var result = window.location.search.match(
                new RegExp("(\\?|&)" + param + "(\\[\\])?=([^&]*)")
            );

            return result ? decodeURIComponent(result[3]) : false;
        }
        let validQueries = ["r", "ref", "referrer", "referral"];
        for (let i = 0; i < validQueries.length; i++) {
            referralAccount = getQueryParam(validQueries[i]);
            if (referralAccount) break;
        }
    }

    let prevRef = ss.get("referralAccount", null);

    // Store referreral only if there is no previous referral
    if (referralAccount && !prevRef) {
        ss.set("referralAccount", referralAccount);
    }

    if (!referralAccount && !!prevRef) {
        referralAccount = prevRef;
    }

    if (referralAccount) {
        console.log("referralAccount", referralAccount)
    };
    return referralAccount;
}

function _accountThreshold(authority, recursion_count) {
    let account_auths = authority.get("account_auths");
    if (!account_auths.size) {
        return "none"
    };

    let auths = account_auths.map(auth => {
        let account = ChainStore.getAccount(auth.get(0), false);
        if (account === undefined) return undefined;
        return accountStore.getMyAuthorityForAccount(account, ++recursion_count);
    });

    let final = auths.reduce((map, auth) => {
        return map.set(auth, true);
    }, Immutable.Map());

    return final.get("full") && final.size === 1
        ? "full"
        : final.get("partial") && final.size === 1
        ? "partial"
        : final.get("none") && final.size === 1
        ? "none"
        : final.get("full") || final.get("partial")
        ? "partial"
        : undefined;
}

function _linkAccount(name) {
    if (!ChainValidation.is_account_name(name, true))
        throw new Error("Invalid account name: " + name);

    // Link
    const linkedEntry = {
        name,
        chainId: Apis.instance().chain_id
    };
    try {
        iDB.add_to_store("linked_accounts", linkedEntry);

        setAccountStore(
            'linkedAccounts',
            accountStore.linkedAccounts.add(
                Immutable.fromJS(linkedEntry)
            ) // Keep the local linkedAccounts in sync with the db
        );
        
        if (!accountStore.myHiddenAccounts.has(name)) {
            setAccountStore(
                'myActiveAccounts',
                accountStore.myActiveAccounts.add(name)
            );
        }
        
        // Update current account if only one account is linked
        if (accountStore.myActiveAccounts.size === 1) {
            accountStore.setCurrentAccount(name);
        }
    } catch (err) {
        console.error(err);
    }
}

function _unlinkAccount(name) {
    if (!ChainValidation.is_account_name(name, true)) {
        throw new Error("Invalid account name: " + name);
    }

    // Unlink
    iDB.remove_from_store("linked_accounts", name);
    /*
    setAccountStore(
        'myActiveAccounts',
        accountStore.myActiveAccounts.delete(name)
    );
    */
    
    // Update current account if no accounts are linked
    // if (accountStore.myActiveAccounts.size === 0) {
    //     accountStore.setCurrentAccount(null);
    // }
} 

// @return 3 full, 2 partial, 0 none
function _pubkeyThreshold(authority) {
    let available = 0;
    let required = authority.get("weight_threshold");
    let key_auths = authority.get("key_auths");
    for (let k of key_auths) {
        if (privateKeyStore.hasKey(k.get(0))) {
            available += k.get(1);
        }
        if (available >= required) break;
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none";
}

// @return 3 full, 2 partial, 0 none
function _addressThreshold(authority) {
    let available = 0;
    let required = authority.get("weight_threshold");
    let address_auths = authority.get("address_auths");
    if (!address_auths.size) return "none";
    let addresses = addressIndex.addresses;
    for (let k of address_auths) {
        let address = k.get(0);
        let pubkey = addresses.get(address);
        if (privateKeyStore.hasKey(pubkey)) {
            available += k.get(1);
        }
        if (available >= required) break;
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none";
}
