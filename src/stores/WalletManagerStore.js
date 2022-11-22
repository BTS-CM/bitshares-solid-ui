import { createStore } from 'solid-js/store';
import {ChainStore} from "bitsharesjs";
import Immutable from "immutable";

import iDB from "idb-instance";
import PrivateKeyActions from "actions/PrivateKeyActions";
import WalletActions from "actions/WalletActions";

import { useWalletDb } from './WalletDb';
import { useAccountRefsStore } from './AccountRefsStore';
import { useBalanceClaimActiveStore } from './BalanceClaimActiveStore';
import { useCachedPropertyStore } from './CachedPropertyStore';

const [walletDb, setWalletDb] = useWalletDb();
const [accountRefsStore, setAccountRefsStore] = useAccountRefsStore();
const [balanceClaimActiveStore, setBalanceClaimActiveStore] = useBalanceClaimActiveStore();
const [cachedPropertyStore, setCachedPropertyStore] = useCachedPropertyStore();

/**  High-level container for managing multiple wallets.
 */
const [walletManagerStore, setWalletManagerStore] = createStore({
    new_wallet: undefined, // pending restore
    current_wallet: undefined,
    wallet_names: Immutable.Set(),
    /** This will change the current wallet the newly restored wallet. */
    onRestore({wallet_name, wallet_object}) {
        iDB.restore(wallet_name, wallet_object)
            .then(() => {
                walletManagerStore.setWallet(wallet_name);
                return walletManagerStore.onSetWallet({wallet_name});
            })
            .catch(error => {
                console.error(error);
                return Promise.reject(error);
            });
    },
    /** This may result in a new wallet name being added, only in this case
        should a <b>create_wallet_password</b> be provided.
    */
    onSetWallet({
        wallet_name = "default",
        create_wallet_password,
        brnkey,
        resolve
    }) {
        var p = new Promise(res => {
            if (/[^a-z0-9_-]/.test(wallet_name) || wallet_name === "")
                throw new Error("Invalid wallet name");

            if (walletManagerStore.current_wallet === wallet_name) {
                res();
                return;
            }

            var add;
            if (!walletManagerStore.wallet_names.has(wallet_name)) {
                var wallet_names = walletManagerStore.wallet_names.add(wallet_name);
                add = iDB.root.setProperty("wallet_names", wallet_names);
                setWalletManagerStore("wallet_names", wallet_names);
            }

            var current = iDB.root.setProperty("current_wallet", wallet_name);

            res(
                Promise.all([add, current]).then(() => {
                    // The database must be closed and re-opened first before the current
                    // application code can initialize its new state.
                    iDB.close();
                    ChainStore.clearCache();
                    balanceClaimActiveStore.reset();
                    // Stores may reset when loadDbData is called
                    return iDB.init_instance().init_promise.then(() => {
                        // Make sure the database is ready when calling cachedPropertyStore.reset()
                        cachedPropertyStore.reset();
                        return Promise.all([
                            walletDb.loadDbData().then(() =>
                                walletManagerStore.loadDbData()
                            ),
                            PrivateKeyActions.loadDbData().then(() =>
                                accountRefsStore.loadDbData()
                            )
                        ]).then(() => {
                            // Update state here again to make sure listeners re-render

                            if (!create_wallet_password) {
                                setWalletManagerStore("current_wallet", wallet_name);
                                return;
                            }

                            return walletDb.onCreateWallet(
                                create_wallet_password,
                                brnkey, //brainkey,
                                true, //unlock
                                wallet_name
                            ).then(() =>
                                setWalletManagerStore("current_wallet", wallet_name)
                            );
                        });
                    });
                })
            );
        }).catch(error => {
            console.error(error);
            return Promise.reject(error);
        });

        if (resolve) {
            resolve(p)
        };
    },
    /** Used by the components during a pending wallet create. */
    setNewWallet(new_wallet) {
        setWalletManagerStore("new_wallet", new_wallet);
    },
    init() {
        return iDB.root.getProperty("current_wallet").then(current_wallet => {
            return iDB.root
                .getProperty("wallet_names", [])
                .then(wallet_names => {
                    setWalletManagerStore("wallet_names", Immutable.Set(wallet_names));
                    setWalletManagerStore("current_wallet", current_wallet);
                    walletManagerStore.setWallet(current_wallet);
                });
        });
    },
    onDeleteAllWallets() {
        var deletes = [];
        walletManagerStore.wallet_names.forEach(wallet_name =>
            deletes.push(walletManagerStore.onDeleteWallet(wallet_name))
        );
        return Promise.all(deletes);
    },
    onDeleteWallet(delete_wallet_name) {
        return new Promise(resolve => {
            var {current_wallet, wallet_names} = walletManagerStore;
            if (!wallet_names.has(delete_wallet_name)) {
                throw new Error("Can't delete wallet, does not exist in index");
            }
            wallet_names = wallet_names.delete(delete_wallet_name);
            iDB.root.setProperty("wallet_names", wallet_names);
            if (current_wallet === delete_wallet_name) {
                current_wallet = wallet_names.size
                    ? wallet_names.first()
                    : undefined;
                iDB.root.setProperty("current_wallet", current_wallet);
                if (current_wallet) {
                    WalletActions.setWallet(current_wallet)
                };
            }
            setWalletManagerStore("current_wallet", current_wallet);
            setWalletManagerStore("wallet_names", wallet_names);
            var database_name = iDB.getDatabaseName(delete_wallet_name);
            var req = iDB.impl.deleteDatabase(database_name);
            resolve(database_name);
        });
    },
    onSetBackupDate() {
        walletDb.setBackupDate();
    },
    onSetBrainkeyBackupDate() {
        walletDb.setBrainkeyBackupDate();
    }
});

export const useWalletManagerStore = () => [walletManagerStore, setWalletManagerStore];
