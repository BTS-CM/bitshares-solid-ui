import {useBalanceClaimActiveStore} from "../stores/BalanceClaimActiveStore";
const [balanceClaimActiveStore, setBalanceClaimActiveStore] = useBalanceClaimActiveStore();

function setPubkeys(pubkeys) {
    balanceClaimActiveStore.onSetPubkeys(pubkeys);
    return pubkeys;
}

function setSelectedBalanceClaims(selected_balances) {
    balanceClaimActiveStore.onSetSelectedBalanceClaims(selected_balances);
    return selected_balances;
}

function claimAccountChange(claim_account_name) {
    balanceClaimActiveStore.onClaimAccountChange(claim_account_name);
    return claim_account_name;
}

export {
    setPubkeys,
    setSelectedBalanceClaims,
    claimAccountChange
};