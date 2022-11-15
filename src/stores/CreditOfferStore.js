import { createStore } from 'solid-js/store'
import * as CreditOfferActions from "../actions/CreditOfferActions";

/*
    this.bindListeners({
        onGetCreditOffersByOwner: CreditOfferActions.getCreditOffersByOwner,
        onGetCreditDealsByBorrower:
            CreditOfferActions.getCreditDealsByBorrower,
        onGetCreditDealsByOfferOwner:
            CreditOfferActions.getCreditDealsByOfferOwner,
        onGetAll: CreditOfferActions.getAll,
        onCreate: CreditOfferActions.create,
        onDelete: CreditOfferActions.delete,
        onUpdate: CreditOfferActions.update,
        onDisabled: CreditOfferActions.disabled,
        onAccept: CreditOfferActions.accept,
        onRepay: CreditOfferActions.repay
    });
*/

const [creditOfferStore, setCreditOfferStore] = createStore({
    allList: [],
    listByOwner: [],
    dealsByBorrower: [],
    dealsbyofferOwner: [],
    onCreate({transaction}) {
        // console.log("transaction: ", transaction);
        if (transaction && transaction.length > 0) {
            let offer_id = transaction[0].trx.operation_results[0][1];
            let owner_account = transaction[0].trx.operations[0][1].owner_account;
            CreditOfferActions.getCreditOffersByOwner({
                name_or_id: owner_account,
                limit: 1,
                start_id: offer_id,
                flag: "create"
            });
        }
    },
    onDisabled({transaction}) {
        // console.log("transaction: ", transaction);
        if (transaction && transaction.length > 0) {
            let offer_id = transaction[0].trx.operations[0][1].offer_id;
            let owner_account =
                transaction[0].trx.operations[0][1].owner_account;
            CreditOfferActions.getCreditOffersByOwner({
                name_or_id: owner_account,
                limit: 1,
                start_id: offer_id,
                flag: "update"
            });
        }
    },
    onUpdate({transaction}) {
        if (transaction && transaction.length > 0) {
            let op = transaction[0].trx.operations[0][1];
            CreditOfferActions.getCreditOffersByOwner({
                name_or_id: op.owner_account,
                limit: 1,
                start_id: op.offer_id,
                flag: "update"
            });
        }
    },
    onDelete({transaction}) {
        // console.log("transaction: ", transaction);
        if (transaction && transaction.length > 0) {
            let dId = transaction[0].trx.operations[0][1].offer_id;
            if (dId) {
                let index = creditOfferStore.listByOwner.findIndex(v => v.id == dId);
                if (index > -1) {
                    setCreditOfferStore(
                        "listByOwner",
                        creditOfferStore.listByOwner.splice(index, 1)
                    );
                }
            }
        }
    },
    onAccept({transaction}) {
        if (transaction && transaction.length > 0) {
            let offer_id = transaction[0].trx.operations[0][1].offer_id;
            CreditOfferActions.getAll({
                limit: 1,
                start_id: offer_id,
                flag: "update"
            });
        }
    },
    onRepay({transaction}) {
        if (transaction && transaction.length > 0) {
            let deal_id = transaction[0].trx.operations[0][1].deal_id;
            let account = transaction[0].trx.operations[0][1].account;
            CreditOfferActions.getCreditDealsByBorrower({
                name_or_id: account,
                limit: 1,
                start_id: deal_id,
                flag: "update"
            });
        }
    },
    onGetCreditOffersByOwner(result) {
        if (result.list.length > 0) {
            switch (result.flag) {
                case "first":
                    setCreditOfferStore("listByOwner", result.list);
                    break;
                case "update":
                    let index = creditOfferStore.listByOwner.findIndex(
                        v => v.id == result.list[0].id
                    );
                    if (index > -1) {
                        creditOfferStore.listByOwner.splice(
                            index,
                            1,
                            JSON.parse(JSON.stringify(result.list[0]))
                        );
                    }
                    break;
                case "create":
                default:
                    setCreditOfferStore('listByOwner', creditOfferStore.listByOwner.concat(result.list));
                    break;
            }

            if (result.end === false) {
                let oId = result.list[result.list.length - 1].id.split(".");
                CreditOfferActions.getCreditOffersByOwner({
                    name_or_id: result.pars.name_or_id,
                    limit: result.pars.limit,
                    start_id: `${oId[0]}.${oId[1]}.${parseInt(oId[2]) + 1}`
                });
            }
        }
    },
    onGetCreditDealsByBorrower(result) {
        if (result.list.length > 0) {
            switch (result.flag) {
                case "first":
                    setCreditOfferStore("dealsByBorrower", result.list);
                    break;
                case "update":
                    let index = creditOfferStore.dealsByBorrower.findIndex(
                        v => v.id == result.list[0].id
                    );
                    if (index > -1) {
                        setCreditOfferStore(
                            "dealsByBorrower",
                            creditOfferStore.dealsByBorrower.splice(
                                index,
                                1,
                                JSON.parse(JSON.stringify(result.list[0]))
                            )
                        );
                    }
                    break;
                default:
                    setCreditOfferStore(
                        "dealsByBorrower",
                        creditOfferStore.dealsByBorrower.concat(result.list)
                    )
                    break;
            }
            if (result.end === false) {
                let oId = result.list[result.list.length - 1].id.split(".");
                CreditOfferActions.getCreditDealsByBorrower({
                    name_or_id: result.pars.name_or_id,
                    limit: result.pars.limit,
                    start_id: `${oId[0]}.${oId[1]}.${parseInt(oId[2]) + 1}`
                });
            }
        } else if (result.flag === "update") {
            let index = creditOfferStore.dealsByBorrower.findIndex(
                v => v.id == result.pars.start_id
            );
            if (index > -1) {
                setCreditOfferStore(
                    "dealsByBorrower",
                    creditOfferStore.dealsByBorrower.splice(index, 1)
                );
            }
        }
    },
    onGetCreditDealsByOfferOwner(result) {
        if (result.list.length > 0) {
            switch (result.flag) {
                case "first":
                    setCreditOfferStore("dealsByOfferOwner", result.list);
                    break;
                case "update":
                    let index = creditOfferStore.dealsByOfferOwner.findIndex(
                        v => v.id == result.list[0].id
                    );
                    if (index > -1) {
                        setCreditOfferStore(
                            "dealsByOfferOwner",
                            creditOfferStore.dealsByOfferOwner.splice(
                                index,
                                1,
                                JSON.parse(JSON.stringify(result.list[0]))
                            )
                        );
                    }
                    break;
                default:
                    setCreditOfferStore(
                        "dealsByOfferOwner",
                        creditOfferStore.dealsByOfferOwner.concat(result.list)
                    );
                    break;
            }
            if (result.end === false) {
                let oId = result.list[result.list.length - 1].id.split(".");
                CreditOfferActions.getCreditDealsByOfferOwner({
                    name_or_id: result.pars.name_or_id,
                    limit: result.pars.limit,
                    start_id: `${oId[0]}.${oId[1]}.${parseInt(oId[2]) + 1}`
                });
            }
        }
    },
    onGetAll(result) {
        if (result.list.length > 0) {
            switch (result.flag) {
                case "first":
                    setCreditOfferStore("allList", result.list.filter(v => v.enabled));
                    break;
                case "update":
                    let index = creditOfferStore.allList.findIndex(
                        v => v.id == result.list[0].id
                    );
                    if (index > -1) {
                        if (result.list[0].enabled) {
                            setCreditOfferStore(
                                "allList",
                                creditOfferStore.allList.splice(index, 1, result.list[0])
                            );
                        } else {
                            setCreditOfferStore(
                                "allList",
                                creditOfferStore.allList.splice(index, 1)
                            );
                        }
                    }
                    break;
                default:
                    setCreditOfferStore(
                        "allList",
                        creditOfferStore.allList.concat(result.list.filter(v => v.enabled))
                    );
                    break;
            }
            if (result.end === false) {
                let oId = result.list[result.list.length - 1].id.split(".");
                CreditOfferActions.getAll({
                    limit: result.pars.limit,
                    start_id: `${oId[0]}.${oId[1]}.${parseInt(oId[2]) + 1}`
                });
            }
        }
    }
});

export const useCreditOfferStore = () => [creditOfferStore, setCreditOfferStore];