import {useWalletUnlockStore} from "stores/WalletUnlockStore";
const [walletUnlockStore, setWalletUnlockStore] = useWalletUnlockStore();

/** If you get resolved then the wallet is or was just unlocked.  If you get
    rejected then the wallet is still locked.

    @return nothing .. Just test for resolve() or reject()
*/
function unlock() {
    return new Promise((resolve, reject) => {
        walletUnlockStore.onUnlock({resolve, reject});
    })
    .then(was_unlocked => {
        //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
        if (was_unlocked) {
            WrappedWalletUnlockActions.change()
        };
    })
    .catch(params => {
        throw params;
    });
}

function lock() {
    return new Promise(resolve => {
        walletUnlockStore.onLock({resolve});
    }).then(was_unlocked => {
        if (was_unlocked) {
            WrappedWalletUnlockActions.change()
        };
    });
}

function cancel() {
    walletUnlockStore.onCancel();
    return true;
}

function change() {
    walletUnlockStore.onChange();
    return true;
}

function checkLock() {
    walletUnlockStore.onCheckLock();
    return true;
}

export {
    unlock,
    lock,
    cancel,
    change,
    checkLock
};
