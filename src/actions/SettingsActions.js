import {useAccountStore} from "stores/AccountStore";
const [accountStore, setAccountStore] = useAccountStore();

import { useSettingsStore } from "stores/SettingsStore";
const [settingsStore, setSettingsStore] = useSettingsStore();

import { useIntlStore } from "stores/IntlStore";
const [intlStore, setIntlStore] = useIntlStore();

import {useWalletUnlockStore} from "stores/WalletUnlockStore";
const [walletUnlockStore, setWalletUnlockStore] = useWalletUnlockStore();

function changeSetting(value) {
    accountStore.onchangeSetting(value);
    settingsStore.onchangeSetting(value);
    walletUnlockStore.onchangeSetting(value);
    return value;
}

function changeViewSetting(value) {
    settingsStore.onChangeViewSetting(value);
    return value;
}

function changeMarketDirection(value) {
    settingsStore.onChangeMarketDirection(value);
    return value;
}

function addStarMarket(quote, base) {
    settingsStore.onAddStarMarket({quote, base});
    return {quote, base};
}

function removeStarMarket(quote, base) {
    settingsStore.onRemoveStarMarket({quote, base});
    return {quote, base};
}

function clearStarredMarkets() {
    settingsStore.onClearStarredMarkets();
    return true;
}

function setUserMarket(quote, base, value) {
    settingsStore.onSetUserMarket({quote, base, value});
    return {quote, base, value};
}

function addWS(ws) {
    settingsStore.onAddWS(ws);
    return ws;
}

function removeWS(index) {
    settingsStore.onRemoveWS(index);
    return index;
}

function hideWS(url) {
    settingsStore.onHideWS(url);
    return url;
}

function showWS(url) {
    settingsStore.onShowWS(url);
    return url;
}

function hideAsset(id, status) {
    settingsStore.onHideAsset({id, status});
    return {id, status};
}

function hideMarket(id, status) {
    settingsStore.onHideMarket({id, status});
    return {id, status};
}

function clearSettings() {
    return new Promise(resolve => {
        intlStore.onClearSettings();
        settingsStore.onClearSettings();
        resolve();
    });
}

function updateLatencies(latencies) {
    settingsStore.onUpdateLatencies(latencies);
    return latencies;
}

function setExchangeLastExpiration(value) {
    settingsStore.onSetExchangeLastExpiration(value);
    return value;
}

function setExchangeTutorialShown(value) {
    settingsStore.onSetExchangeTutorialShown(value);
    return value;
}

function modifyPreferedBases(payload) {
    settingsStore.onModifyPreferedBases(payload);
    return payload;
}

function updateUnits() {
    settingsStore.onUpdateUnits();
    return true;
}

function setPriceAlert(value) {
    settingsStore.onSetPriceAlert(value);
    return value;
}

function hideNewsHeadline(value) {
    settingsStore.onHideNewsHeadline(value);
    return value;
}

function addChartLayout(value) {
    settingsStore.onAddChartLayout(value);
    return value;
}

function deleteChartLayout(value) {
    settingsStore.onDeleteChartLayout(value);
    return value;
}

export {
    changeSetting,
    changeViewSetting,
    changeMarketDirection,
    addStarMarket,
    removeStarMarket,
    clearStarredMarkets,
    setUserMarket,
    addWS,
    removeWS,
    hideWS,
    showWS,
    hideAsset,
    hideMarket,
    clearSettings,
    updateLatencies,
    setExchangeLastExpiration,
    setExchangeTutorialShown,
    modifyPreferedBases,
    updateUnits,
    setPriceAlert,
    hideNewsHeadline,
    addChartLayout,
    deleteChartLayout
};