import moment from "moment";
import {Apis} from "bitsharesjs-ws";
import humanizeDuration from "humanize-duration";

import {Asset} from "../lib/common/MarketClasses";
import {new_transaction} from "api/WalletApi";

import { useWalletDb } from "../stores/WalletDb";
const [walletDb, setWalletDb] = useWalletDb();

import { useCreditOfferStore } from "~/stores/CreditOfferStore";
const [creditOfferStore, setCreditOfferStore] = useCreditOfferStore();

const FEE_RATE_DENOM = 1000000; // Denominator for SameT Fund fee calculation
const listRepayPeriod = [43200, 86400, 259200, 604800, 2592000, 7776000, 31536000, 63072000, 157680000];

const parsingTime = (time, locale) => {
    if (locale === "zh") {
        locale = "zh_CN";
    }
    return humanizeDuration(parseInt(time) * 1000, {
        language: locale,
        delimiter: " ",
        units: ["d", "h", "m"]
    });
};

function create({
    owner_account,
    asset_type,
    balance,
    fee_rate,
    max_duration_seconds,
    min_deal_amount,
    auto_disable_time,
    acceptable_collateral,
    acceptable_borrowers = [],
    enabled = true,
    fee_asset = "1.3.0"
}) {
    if (fee_asset instanceof Asset) {
        fee_asset = fee_asset.asset_id;
    } else if (typeof fee_asset !== "string") {
        fee_asset = fee_asset.get("id");
    }
    if (typeof asset_type !== "string") {
        asset_type = asset_type.get("id");
    }
    if (auto_disable_time instanceof moment) {
        auto_disable_time = auto_disable_time.toDate();
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_offer_create", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        owner_account,
        asset_type,
        balance,
        fee_rate,
        max_duration_seconds,
        min_deal_amount,
        enabled,
        auto_disable_time,
        acceptable_collateral,
        acceptable_borrowers
    });

    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onCreate({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions create ----->", error);
            creditOfferStore.onCreate({transaction: null});
        });
}

function update({
    owner_account,
    offer_id,
    delta_amount,
    fee_rate,
    max_duration_seconds,
    min_deal_amount,
    enabled = true,
    auto_disable_time,
    acceptable_collateral,
    acceptable_borrowers = [],
    fee_asset = "1.3.0"
}) {
    if (fee_asset instanceof Asset) {
        fee_asset = fee_asset.asset_id;
    } else if (typeof fee_asset !== "string") {
        fee_asset = fee_asset.get("id");
    }
    if (auto_disable_time instanceof moment) {
        auto_disable_time = auto_disable_time.toDate();
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_offer_update", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        owner_account,
        offer_id,
        delta_amount,
        fee_rate,
        max_duration_seconds,
        min_deal_amount,
        enabled,
        auto_disable_time,
        acceptable_collateral,
        acceptable_borrowers
    });

    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onUpdate({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions update ----->", error);
            creditOfferStore.onUpdate({transaction: null});
        });
}

function disabled({owner_account, offer_id, enabled = false, fee_asset = "1.3.0"}) {
    if (typeof owner_account !== "string") {
        owner_account = owner_account.get("id");
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_offer_update", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        owner_account,
        offer_id,
        enabled
    });

    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onDisabled({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions disabled ----->", error);
            creditOfferStore.onDisabled({transaction: null});
        });
}

/**
 * Renamed to avoid naming conflict
 * deletes a credit offer
 * @param {Object} 
 * @returns 
 */
function deleteCreditOffer({owner_account, offer_id, fee_asset = "1.3.0"}) {
    if (typeof owner_account !== "string") {
        owner_account = owner_account.get("id");
    }
    if (fee_asset instanceof Asset) {
        fee_asset = fee_asset.asset_id;
    } else if (typeof fee_asset !== "string") {
        fee_asset = fee_asset.get("id");
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_offer_delete", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        owner_account,
        offer_id
    });
    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onDelete({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions delete ----->", error);
            creditOfferStore.onDelete({transaction: null});
        });
}

function accept({
    borrower,
    offer_id,
    borrow_amount,
    collateral,
    max_fee_rate,
    min_duration_seconds,
    fee_asset = "1.3.0"
}) {
    if (typeof borrower !== "string") {
        borrower = borrower.get("id");
    }
    if (fee_asset instanceof Asset) {
        fee_asset = fee_asset.asset_id;
    } else if (typeof fee_asset !== "string") {
        fee_asset = fee_asset.get("id");
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_offer_accept", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        borrower,
        offer_id,
        borrow_amount,
        collateral,
        max_fee_rate,
        min_duration_seconds
    });

    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onAccept({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions delete ----->", error);
            creditOfferStore.onAccept({transaction: null});
        });
}

function repay({account, deal_id, repay_amount, credit_fee, fee_asset = "1.3.0"}) {
    if (typeof account !== "string") {
        account = account.get("id");
    }
    if (fee_asset instanceof Asset) {
        fee_asset = fee_asset.asset_id;
    } else if (typeof fee_asset !== "string") {
        fee_asset = fee_asset.get("id");
    }
    const tr = new_transaction();
    tr.add_type_operation("credit_deal_repay", {
        fee: {
            amount: 0,
            asset_id: fee_asset
        },
        account,
        deal_id,
        repay_amount: repay_amount.toObject(),
        credit_fee: credit_fee.toObject()
    });

    return walletDb.process_transaction(tr, null, true)
        .then(res => {
            creditOfferStore.onRepay({transaction: res});
        })
        .catch(error => {
            console.log("CreditOfferActions create ----->", error);
            creditOfferStore.onRepay({transaction: null});
        });
}

function getCreditOffersByOwner({
    name_or_id,
    limit = 100,
    start_id = null,
    flag = false
}) {
    let pars = [name_or_id, limit, start_id];
    Apis.instance()
        .db_api()
        .exec("get_credit_offers_by_owner", pars)
        .then(result => {
            // console.log("result: ", result);
            if (result && result.length == limit) {
                creditOfferStore.onGetCreditOffersByOwner({
                    list: result,
                    end:
                        flag === false || flag === "first"
                            ? false
                            : true,
                    flag,
                    pars: {name_or_id, limit, start_id}
                });
            } else {
                creditOfferStore.onGetCreditOffersByOwner({
                    list: result,
                    end: true,
                    flag
                });
            }
        })
        .catch(err => {
            console.error(err);
            creditOfferStore.onGetCreditOffersByOwner({
                list: [],
                end: true,
                flag
            });
        });
}

function getCreditDealsByBorrower({
    name_or_id,
    limit = 100,
    start_id = null,
    flag = false
}) {
    let pars = [name_or_id, limit, start_id];
    Apis.instance()
        .db_api()
        .exec("get_credit_deals_by_borrower", pars)
        .then(result => {
            // console.log("result: ", result);
            if (result && result.length == limit) {
                creditOfferStore.onGetCreditDealsByBorrower({
                    list: result,
                    end:
                        flag === false || flag === "first"
                            ? false
                            : true,
                    flag,
                    pars: {name_or_id, limit, start_id}
                });
            } else {
                creditOfferStore.onGetCreditDealsByBorrower({
                    list: result,
                    end: true,
                    flag,
                    pars: {name_or_id, limit, start_id}
                });
            }
        })
        .catch(err => {
            console.error(err);
            creditOfferStore.onGetCreditDealsByBorrower({
                list: [],
                end: true,
                flag
            });
        });
}

function getCreditDealsByOfferOwner({
    name_or_id,
    limit = 100,
    start_id = null,
    flag = false
}) {
    let pars = [name_or_id, limit, start_id];
    Apis.instance()
        .db_api()
        .exec("get_credit_deals_by_offer_owner", pars)
        .then(result => {
            // console.log("result: ", result);
            if (result && result.length == limit) {
                creditOfferStore.onGetCreditDealsByOfferOwner({
                    list: result,
                    end:
                        flag === false || flag === "first"
                            ? false
                            : true,
                    flag,
                    pars: {name_or_id, limit, start_id}
                });
            } else {
                creditOfferStore.onGetCreditDealsByOfferOwner({
                    list: result,
                    end: true,
                    flag
                });
            }
        })
        .catch(err => {
            console.error(err);
            creditOfferStore.onGetCreditDealsByOfferOwner({
                list: [],
                end: true,
                flag
            });
        });
}

function getAll({limit = 100, start_id = null, flag = false}) {
    let pars = [limit, start_id];
    Apis.instance()
        .db_api()
        .exec("list_credit_offers", pars)
        .then(result => {
            // console.log("result: ", result);
            if (result && result.length == limit) {
                creditOfferStore.onGetAll({
                    list: result,
                    end:
                        flag === false || flag === "first"
                            ? false
                            : true,
                    flag,
                    pars: {limit, start_id}
                });
            } else {
                creditOfferStore.onGetAll({
                    list: result,
                    end: true,
                    flag
                });
            }
        })
        .catch(err => {
            console.error(err);
            creditOfferStore.onGetAll({
                list: [],
                end: true,
                flag
            });
        });
}

export {
    FEE_RATE_DENOM,
    listRepayPeriod,
    parsingTime,
    create,
    update,
    disabled,
    deleteCreditOffer,
    accept,
    repay,
    getCreditOffersByOwner,
    getCreditDealsByBorrower,
    getCreditDealsByOfferOwner,
    getAll
};
