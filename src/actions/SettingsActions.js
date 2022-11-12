function changeSetting(value) {
    return value;
}

function changeViewSetting(value) {
    return value;
}

function changeMarketDirection(value) {
    return value;
}

function addStarMarket(quote, base) {
    return {quote, base};
}

function removeStarMarket(quote, base) {
    return {quote, base};
}

function clearStarredMarkets() {
    return true;
}

function setUserMarket(quote, base, value) {
    return {quote, base, value};
}

function addWS(ws) {
    return ws;
}

function removeWS(index) {
    return index;
}

function hideWS(url) {
    return url;
}

function showWS(url) {
    return url;
}

function hideAsset(id, status) {
    return {id, status};
}

function hideMarket(id, status) {
    return {id, status};
}

function clearSettings() {
    return dispatch => {
        return new Promise(resolve => {
            dispatch(resolve);
        });
    };
}

function updateLatencies(latencies) {
    return latencies;
}

function setExchangeLastExpiration(value) {
    return value;
}

function setExchangeTutorialShown(value) {
    return value;
}

function modifyPreferedBases(payload) {
    return payload;
}

function updateUnits() {
    return true;
}

function setPriceAlert(value) {
    return value;
}

function hideNewsHeadline(value) {
    return value;
}

function addChartLayout(value) {
    return value;
}

function deleteChartLayout(value) {
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