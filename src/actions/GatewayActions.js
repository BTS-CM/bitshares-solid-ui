import {
    fetchCoins,
    fetchTradingPairs,
    fetchCoinsSimple,
    getBackedCoins,
    getActiveWallets
} from "common/gatewayMethods";
import {blockTradesAPIs} from "api/apiConfig";
import {getOnChainConfig} from "../lib/chain/onChainConfig";

import {useGatewayStore} from "stores/GatewayStore";
const [gatewayStore, setGatewayStore] = useGatewayStore();

let inProgress = {};

const GATEWAY_TIMEOUT = 10000;

const onGatewayTimeout = (gateway) => {
    gatewayStore.onFetchCoins({down: gateway});
};

function fetchCoins({
    backer = "GDEX",
    url = undefined,
    urlBridge = undefined,
    urlWallets = undefined
} = {}) {
    if (!inProgress["fetchCoins_" + backer]) {
        inProgress["fetchCoins_" + backer] = true;
        let fetchCoinsTimeout = setTimeout(
            onGatewayTimeout.bind(null, backer),
            GATEWAY_TIMEOUT
        );
        Promise.all([
            fetchCoins(url),
            fetchTradingPairs(urlBridge),
            getActiveWallets(urlWallets)
        ])
            .then(result => {
                clearTimeout(fetchCoinsTimeout);
                delete inProgress["fetchCoins_" + backer];
                let [coins, tradingPairs, wallets] = result;
                let backedCoins = getBackedCoins({
                    allCoins: coins,
                    tradingPairs: tradingPairs,
                    backer: backer
                }).filter(a => !!a.walletType);
                backedCoins.forEach(a => {
                    a.isAvailable =
                        wallets.indexOf(a.walletType) !== -1;
                });
                gatewayStore.onFetchCoins({
                    coins,
                    backedCoins,
                    backer
                });
            })
            .catch(() => {
                clearTimeout(fetchCoinsTimeout);
                delete inProgress["fetchCoins_" + backer];
                gatewayStore.onFetchCoins({
                    coins: [],
                    backedCoins: [],
                    backer
                });
            });
    } else {
        return {};
    }
}

function fetchCoinsSimple({backer = "GDEX", url = undefined} = {}) {
    if (!inProgress["fetchCoinsSimple_" + backer]) {
        inProgress["fetchCoinsSimple_" + backer] = true;
        let fetchCoinsTimeout = setTimeout(
            onGatewayTimeout.bind(null, backer),
            GATEWAY_TIMEOUT
        );
        fetchCoinsSimple(url)
            .then(coins => {
                clearTimeout(fetchCoinsTimeout);
                delete inProgress["fetchCoinsSimple_" + backer];
                gatewayStore.onFetchCoinsSimple({
                    coins: coins,
                    backer
                });
            })
            .catch(() => {
                clearTimeout(fetchCoinsTimeout);
                delete inProgress["fetchCoinsSimple_" + backer];

                gatewayStore.onFetchCoinsSimple({
                    coins: [],
                    backer
                });
            });
    } else {
        return {};
    }
}

function fetchPairs() {
    if (!inProgress["fetchTradingPairs"]) {
        inProgress["fetchTradingPairs"] = true;
        let fetchCoinsTimeout = setTimeout(
            onGatewayTimeout.bind(null, "TRADE"),
            GATEWAY_TIMEOUT
        );
        Promise.all([
            fetchCoins(
                blockTradesAPIs.BASE + blockTradesAPIs.COINS_LIST
            ),
            fetchTradingPairs(
                blockTradesAPIs.BASE + blockTradesAPIs.TRADING_PAIRS
            ),
            getActiveWallets(
                blockTradesAPIs.BASE + blockTradesAPIs.ACTIVE_WALLETS
            )
        ])
            .then(result => {
                clearTimeout(fetchCoinsTimeout);
                delete inProgress["fetchTradingPairs"];
                let [coins, bridgeCoins, wallets] = result;
                gatewayStore.onFetchPairs({
                    coins,
                    bridgeCoins,
                    wallets
                });
            })
            .catch(() => {
                delete inProgress["fetchTradingPairs"];
                gatewayStore.onFetchPairs({
                    coins: [],
                    bridgeCoins: [],
                    wallets: []
                });
            });
    } else {
        return {};
    }
}

function temporarilyDisable({backer}) {
    gatewayStore.onTemporarilyDisable({backer});
}

function loadOnChainGatewayConfig() {
    // fixme: access to onchain config should be cut out into a separate store or similar, this is abusing gatewaystore for a quick fix
    getOnChainConfig().then(config => {
        gatewayStore.onLoadOnChainGatewayConfig(config);
    });
}


export {
    fetchCoins,
    fetchCoinsSimple,
    fetchPairs,
    temporarilyDisable,
    loadOnChainGatewayConfig
};
