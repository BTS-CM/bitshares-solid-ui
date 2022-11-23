import { useAccountRefsStore } from "../stores/AccountRefsStore";
import { usePrivateKeyStore } from "~/stores/PrivateKeyStore";
const [accountRefsStore, setAccountRefsStore] = useAccountRefsStore();
const [privateKeyStore, setPrivateKeyStore] = usePrivateKeyStore();

function addKey(private_key_object, transaction) {
    // returned promise is deprecated
    return new Promise(resolve => {
        accountRefsStore.onAddPrivateKey({private_key_object});
        privateKeyStore.onAddKey({private_key_object, transaction, resolve});
    });
}

function loadDbData() {
    // returned promise is deprecated
    return new Promise(resolve => {
        privateKeyStore.onLoadDbData({resolve});
    });
}

export {
    addKey,
    loadDbData
};
