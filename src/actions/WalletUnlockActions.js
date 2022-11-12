/** If you get resolved then the wallet is or was just unlocked.  If you get
    rejected then the wallet is still locked.

    @return nothing .. Just test for resolve() or reject()
*/
function unlock() {
    return dispatch => {
        return new Promise((resolve, reject) => {
            dispatch({resolve, reject});
        })
            .then(was_unlocked => {
                //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
                if (was_unlocked) WrappedWalletUnlockActions.change();
            })
            .catch(params => {
                throw params;
            });
    };
}

function lock() {
    return dispatch => {
        return new Promise(resolve => {
            dispatch({resolve});
        }).then(was_unlocked => {
            if (was_unlocked) WrappedWalletUnlockActions.change();
        });
    };
}

function cancel() {
    return true;
}

function change() {
    return true;
}

function checkLock() {
    return true;
}

export {
    unlock,
    lock,
    cancel,
    change,
    checkLock
};
