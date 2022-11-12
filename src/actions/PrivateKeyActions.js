
function addKey(private_key_object, transaction) {
    // returned promise is deprecated
    return dispatch => {
        return new Promise(resolve => {
            dispatch({private_key_object, transaction, resolve});
        });
    };
}

function loadDbData() {
    // returned promise is deprecated
    return dispatch => {
        return new Promise(resolve => {
            dispatch(resolve);
        });
    };
}

export {
    addKey,
    loadDbData
};
