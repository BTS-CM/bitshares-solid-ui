import { createStore } from 'solid-js/store';
//import * as TransactionConfirmActions from "actions/TransactionConfirmActions";

//this.bindActions(TransactionConfirmActions);

const [transactionConfirmStore, setTransactionConfirmStore] = createStore({
    transaction: null,
    error: null,
    broadcasting: false,
    broadcast: false,
    included: false,
    trx_id: null,
    trx_block_num: null,
    closed: true,
    broadcasted_transaction: null,
    propose: false,
    fee_paying_account: null, // proposal fee_paying_account
    onConfirm({transaction, resolve, reject}) {
        setTransactionConfirmStore({
            transaction: null,
            error: null,
            broadcasting: false,
            broadcast: false,
            included: false,
            trx_id: null,
            trx_block_num: null,
            closed: true,
            broadcasted_transaction: null,
            propose: false,
            fee_paying_account: null
        });

        setTransactionConfirmStore({
            transaction: transaction,
            closed: false,
            resolve: resolve,
            reject: reject
        });

        //console.log("-- TransactionConfirmStore.onConfirm -->", transactionConfirmStore);
    },
    onClose() {
        //console.log("-- TransactionConfirmStore.onClose -->", transactionConfirmStore);
        setTransactionConfirmStore("closed", true);
    },
    onBroadcast(payload) {
        //console.log("-- TransactionConfirmStore.onBroadcast -->", transactionConfirmStore);
        this.setState(payload);
        if (payload.broadcasted_transaction) {
            setTransactionConfirmStore(
                "broadcasted_transaction",
                transactionConfirmStore.transaction
            );
        }
    },
    onWasBroadcast(res) {
        //console.log("-- TransactionConfirmStore.onWasBroadcast -->", transactionConfirmStore);
        setTransactionConfirmStore({
            broadcasting: false,
            broadcast: true
        });
    },
    onWasIncluded(res) {
        //console.log("-- TransactionConfirmStore.onWasIncluded -->", transactionConfirmStore);
        setTransactionConfirmStore({
            error: null,
            broadcasting: false,
            broadcast: true,
            included: true,
            trx_id: res[0].id,
            trx_block_num: res[0].block_num,
            broadcasted_transaction: transactionConfirmStore.transaction
        });
    },
    onError({error}) {
        setTransactionConfirmStore({
            error: error,
            broadcasting: false,
            broadcast: false
        });
    },
    onTogglePropose() {
        setTransactionConfirmStore("propose", !transactionConfirmStore.propose);
    },
    onProposeFeePayingAccount(fee_paying_account) {
        setTransactionConfirmStore("fee_paying_account", fee_paying_account);
    },
    reset() {
        //console.log("-- TransactionConfirmStore.reset -->");
        setTransactionConfirmStore({
            transaction: null,
            error: null,
            broadcasting: false,
            broadcast: false,
            included: false,
            trx_id: null,
            trx_block_num: null,
            closed: true,
            broadcasted_transaction: null,
            propose: false,
            fee_paying_account: null
        });
    }
});

export const useTransactionConfirmStore = () => [transactionConfirmStore, setTransactionConfirmStore];