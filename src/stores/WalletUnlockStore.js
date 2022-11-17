import { createStore } from 'solid-js/store';
import WalletUnlockActions from "actions/WalletUnlockActions";
import SettingsActions from "actions/SettingsActions";
import WalletDb from "stores/WalletDb";
import ls from "common/localStorage";
import {
    setLocalStorageType,
    isPersistantType
} from "../lib/common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = ls(STORAGE_KEY);

const storedSettings = ss.get("settings_v4", {});
if (storedSettings.passwordLogin === undefined) {
    storedSettings.passwordLogin = true;
}

/*
    walletUnlockStore.bindActions(WalletUnlockActions);

    walletUnlockStore.bindListeners({
        onChangeSetting: SettingsActions.changeSetting
    });
*/

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
        //DEBUG console.log('... onUnlock setState', WalletDb.isLocked())
        //
        _setLockTimeout();
        if (!WalletDb.isLocked()) {
            setWalletUnlockStore({locked: false});
            resolve();
            return;
        }

        setWalletUnlockStore({
            resolve: resolve,
            reject: reject,
            locked: WalletDb.isLocked()
        })
    },
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
        if (WalletDb.isLocked()) {
            resolve();
            return;
        }
        WalletDb.onLock();
        setWalletUnlockStore({
            resolve: null,
            reject: null,
            locked: WalletDb.isLocked()
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
        setWalletUnlockStore({locked: WalletDb.isLocked()});
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
        setWalletUnlockStore({locked: WalletDb.isLocked()});
    }
});

export const useSettingsuseWalletUnlockStore = () => [walletUnlockStore, setWalletUnlockStore];

function _setLockTimeout() {
    _clearLockTimeout();
    /* If the timeout is different from zero, auto unlock the wallet using a timeout */
    if (!!walletUnlockStore.walletLockTimeout) {
        setWalletUnlockStore({timeout: setTimeout(() => {
            if (!WalletDb.isLocked()) {
                console.log(
                    "auto locking after",
                    walletUnlockStore.walletLockTimeout,
                    "s"
                );
                WalletDb.onLock();
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