import {getFinalFeeAsset} from "common/account_utils";
import {lookupAccounts} from "api/accountApi";
import {new_transaction} from "api/WalletApi";
import {process_transaction} from "stores/WalletDb";
import * as ApplicationApi from "api/ApplicationApi";
import * as WalletActions from "actions/WalletActions";

import useAccountStore from "stores/AccountStore";
const [accountStore, setAccountStore] = useAccountStore();

let accountSearch = {};

/**
 *  @brief  Actions that modify linked accounts
 *
 *  Also includes accountSearch actions which keep track of search result state.  The presumption
 *  is that there is only ever one active "search result" at a time.
 */

/**
 *  Account search results are not managed by the ChainStore cache so are
 *  tracked as part of the AccountStore.
 */
function accountSearch(start_symbol, limit = 50) {
    let uid = `${start_symbol}_${limit}}`;
    if (!accountSearch[uid]) {
        accountSearch[uid] = true;
        return lookupAccounts(start_symbol, limit).then(
            result => {
                accountSearch[uid] = false;
                accountStore.onAccountSearch({accounts: result, searchTerm: start_symbol});
            }
        );
    }
}

/**
 *  TODO:  The concept of current accounts is deprecated and needs to be removed
 */
function setCurrentAccount(name) {
    accountStore.onSetCurrentAccount(name);
    return name;
}

function tryToSetCurrentAccount() {
    accountStore.onTryToSetCurrentAccount();
    return true;
}

function addStarAccount(account) {
    accountStore.onAddStarAccount(account);
    return account;
}

function removeStarAccount(account) {
    accountStore.onRemoveStarAccount(account);
    return account;
}

function toggleHideAccount(account, hide) {
    accountStore.onToggleHideAccount(account, hide);
    return {account, hide};
}

/**
 *  TODO:  This is a function of the WalletApi and has no business being part of AccountActions
 */
function transfer(
    from_account,
    to_account,
    amount,
    asset,
    memo,
    propose_account = null,
    fee_asset_id = "1.3.0"
) {
    // Set the fee asset to use
    fee_asset_id = getFinalFeeAsset(
        propose_account || from_account,
        "transfer",
        fee_asset_id
    );

    try {
        return ApplicationApi.transfer({
            from_account,
            to_account,
            amount,
            asset,
            memo,
            propose_account,
            fee_asset_id
        }).then(result => {
            // console.log( "transfer result: ", result )

            dispatch(result);
        });
    } catch (error) {
        console.log(
            "[AccountActions.js:90] ----- transfer error ----->",
            error
        );
        return new Promise((resolve, reject) => {
            reject(error);
        });
    }
}

/**
 *  This method exists ont he AccountActions because after creating the account via the wallet, the account needs
 *  to be linked and added to the local database.
 */
    function createAccount(
    account_name,
    registrar,
    referrer,
    referrer_percent,
    refcode
) {
    return WalletActions.createAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent,
        refcode
    ).then(() => {
        accountStore.onCreateAccount(account_name);
        return account_name;
    });
}

function createAccountWithPassword(
    account_name,
    password,
    registrar,
    referrer,
    referrer_percent,
    refcode
) {
    return WalletActions.createAccountWithPassword(
        account_name,
        password,
        registrar,
        referrer,
        referrer_percent,
        refcode
    ).then(() => {
        dispatch(account_name);
        return account_name;
    });
}

/**
 *  TODO:  This is a function of the WalletApi and has no business being part of AccountActions, the account should already
 *  be linked.
 */
    function upgradeAccount(account_id, lifetime) {
    // Set the fee asset to use
    let fee_asset_id = getFinalFeeAsset(
        account_id,
        "account_upgrade"
    );

    var tr = new_transaction();
    tr.add_type_operation("account_upgrade", {
        fee: {
            amount: 0,
            asset_id: fee_asset_id
        },
        account_to_upgrade: account_id,
        upgrade_to_lifetime_member: lifetime
    });
    return process_transaction(tr, null, true);
}

function addAccountContact(name) {
    accountStore.onAddAccountContact(name);
    return name;
}

function removeAccountContact(name) {
    accountStore.onRemoveAccountContact(name);
    return name;
}

function setPasswordAccount(account) {
    accountStore.onSetPasswordAccount(account);
    return account;
}

function createCommittee({url, account}) {
    const account_id = account.get("id");
    var tr = new_transaction();

    tr.add_type_operation("committee_member_create", {
        fee: {
            amount: 0,
            asset_id: "1.3.0"
        },
        committee_member_account: account_id,
        url: url
    });
    return process_transaction(tr, null, true)
        .then(() => {
            dispatch(true);
        })
        .catch(error => {
            console.log(
                "----- Add Committee member error ----->",
                error
            );
            dispatch(false);
        });
}

function createWitness({url, account, signingKey}) {
    const account_id = account.get("id");
    var tr = new_transaction();

    tr.add_type_operation("witness_create", {
        fee: {
            amount: 0,
            asset_id: "1.3.0"
        },
        witness_account: account_id,
        url: url,
        block_signing_key: signingKey
    });
    
    return process_transaction(tr, null, true)
        .then(() => {
            dispatch(true);
        })
        .catch(error => {
            console.log("----- Create witness error ----->", error);
            dispatch(false);
        });
}

export {
    accountSearch,
    setCurrentAccount,
    tryToSetCurrentAccount,
    addStarAccount,
    removeStarAccount,
    toggleHideAccount,
    transfer,
    createAccount,
    createAccountWithPassword,
    upgradeAccount,
    addAccountContact,
    removeAccountContact,
    setPasswordAccount,
    createCommittee,
    createWitness
};