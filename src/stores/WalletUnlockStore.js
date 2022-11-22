import { createStore } from 'solid-js/store';
import ls from "common/localStorage";
import {
    setLocalStorageType,
    isPersistantType
} from "../lib/common/localStorage";

import { useWalletDb } from './WalletDb';
const [walletDb, setWalletDb] = useWalletDb();

const STORAGE_KEY = "__graphene__";
let ss = ls(STORAGE_KEY);

const storedSettings = ss.get("settings_v4", {});
if (storedSettings.passwordLogin === undefined) {
    storedSettings.passwordLogin = true;
}

const [walletUnlockStore, setWalletUnlockStore] = createStore({
    // TODO: init state
    walletLockTimeout: _getTimeout(), // seconds (10 minutes)
    timeout: null,
    locked: true,
    passwordLogin: storedSettings.passwordLogin,
    rememberMe: storedSettings.rememberMe === undefined
                    ? true
                    : storedSettings.rememberMe,
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState', walletDb.isLocked())
        //
        _setLockTimeout();
        if (!walletDb.isLocked()) {
            setWalletUnlockStore({locked: false});
            resolve();
            return;
        }

        setWalletUnlockStore({
            resolve: resolve,
            reject: reject,
            locked: walletDb.isLocked()
        })
    },
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', walletDb.isLocked())
        if (walletDb.isLocked()) {
            resolve();
            return;
        }
        walletDb.onLock();
        setWalletUnlockStore({
            resolve: null,
            reject: null,
            locked: walletDb.isLocked()
        })
        if (!walletUnlockStore.rememberMe && !isPersistantType()) {
            setLocalStorageType("persistant");
        }
        resolve();
    },
    onCancel() {
        if (typeof walletUnlockStore.reject === "function") {
            walletUnlockStore.reject({isCanceled: true});
        }
        setWalletUnlockStore({
            resolve: null,
            reject: null
        })
    },
    onChange() {
        setWalletUnlockStore({locked: walletDb.isLocked()});
    },
    onChangeSetting(payload) {
        if (payload.setting === "walletLockTimeout") {
            setWalletUnlockStore({walletLockTimeout: payload.value});
            _clearLockTimeout();
            _setLockTimeout();
        } else if (payload.setting === "passwordLogin") {
            setWalletUnlockStore({passwordLogin: payload.value});
        } else if (payload.setting === "rememberMe") {
            setWalletUnlockStore({rememberMe: payload.value});
        }
    },
    onCheckLock() {
        setWalletUnlockStore({locked: walletDb.isLocked()});
    }
});

export const useWalletUnlockStore = () => [walletUnlockStore, setWalletUnlockStore];

function _setLockTimeout() {
    _clearLockTimeout();
    /* If the timeout is different from zero, auto unlock the wallet using a timeout */
    if (!!walletUnlockStore.walletLockTimeout) {
        setWalletUnlockStore({timeout: setTimeout(() => {
            if (!walletDb.isLocked()) {
                console.log(
                    "auto locking after",
                    walletUnlockStore.walletLockTimeout,
                    "s"
                );
                walletDb.onLock();
                setWalletUnlockStore({locked: true});
            }
        }, walletUnlockStore.walletLockTimeout * 1000)});
    }
}

function _clearLockTimeout() {
    if (walletUnlockStore.timeout) {
        clearTimeout(walletUnlockStore.timeout);
        setWalletUnlockStore({timeout: null});
    }
}

function _getTimeout() {
    return parseInt(ss.get("lockTimeout", 600), 10);
}