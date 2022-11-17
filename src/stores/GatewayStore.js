import Immutable from "immutable";
import { createStore } from 'solid-js/store'
import GatewayActions from "actions/GatewayActions";
import ls from "common/localStorage";
import {allowedGateway} from "../branding";

const STORAGE_KEY = "__graphene__";
let ss = ls(STORAGE_KEY);

/*
    gatewayStore.bindListeners({
        onFetchCoins: GatewayActions.fetchCoins,
        onFetchCoinsSimple: GatewayActions.fetchCoinsSimple,
        onFetchPairs: GatewayActions.fetchPairs,
        onTemporarilyDisable: GatewayActions.temporarilyDisable,
        onLoadOnChainGatewayConfig: GatewayActions.loadOnChainGatewayConfig
    });
*/

const [gatewayStore, setGatewayStore] = createStore({
    backedCoins: Immutable.Map(ss.get("backedCoins", {})),
    bridgeCoins: Immutable.Map(
        Immutable.fromJS(ss.get("bridgeCoins", {}))
    ),
    /**
     * bridgeInputs limits the available depositable coins through blocktrades
     * when using the "Buy" functionaility.
     *
     * While the application still makes sure the asset is possible to deposit,
     * this is to limit the app to display internal assets like bit-assets that
     * BlockTrades accept within their platform.
     */
    bridgeInputs: [
        "btc",
        "dash",
        "eth",
        "steem",
        "sbd",
        "doge",
        "bch",
        "ppy",
        "ltc"
    ],
    down: Immutable.Map({}),
    onChainGatewayConfig: null,
    onFetchCoins({backer, coins, backedCoins, down} = {}) {
        if (backer && coins) {
            setGatewayStore({
                backedCoins: gatewayStore.backedCoins.set(backer, backedCoins),
                down: gatewayStore.down.set(backer, false)
            });
            ss.set("backedCoins", gatewayStore.backedCoins.toJS());
        }

        if (down) {
            setGatewayStore("down", gatewayStore.down.set(down, true));
        }
    },
    onFetchCoinsSimple({backer, coins, down} = {}) {
        if (backer && coins) {
            setGatewayStore({
                bridgeCoins: gatewayStore.bridgeCoins.set(backer, coins),
                down: gatewayStore.down.set(backer, false)
            });
            ss.set("backedCoins", gatewayStore.backedCoins.toJS());
        }

        if (down) {
            setGatewayStore("down", gatewayStore.down.set(down, true));
        }
    },
    onFetchPairs({coins, bridgeCoins, wallets, down} = {}) {
        if (coins && bridgeCoins && wallets) {
            let coins_by_type = {};
            coins.forEach(
                coin_type => (coins_by_type[coin_type.coinType] = coin_type)
            );
            bridgeCoins = bridgeCoins
                .filter(a => {
                    return (
                        a &&
                        coins_by_type[a.outputCoinType] &&
                        coins_by_type[a.outputCoinType].walletType ===
                            "bitshares2" && // Only use bitshares2 wallet types
                        gatewayStore.bridgeInputs.indexOf(a.inputCoinType) !== -1 // Only use coin types defined in bridgeInputs
                    );
                })
                .forEach(coin => {
                    coin.isAvailable =
                        wallets.indexOf(
                            coins_by_type[coin.outputCoinType].walletType
                        ) !== -1;
                    
                    setGatewayStore(
                        "bridgeCoins",
                        gatewayStore.bridgeCoins.setIn(
                            [
                                coins_by_type[coin.outputCoinType].walletSymbol,
                                coin.inputCoinType
                            ],
                            Immutable.fromJS(coin)
                        )
                    );
                });
            ss.set("bridgeCoins", gatewayStore.bridgeCoins.toJS());
        }
        if (down) {
            setGatewayStore("down", gatewayStore.down.set(down, true));
        }
    },
    onTemporarilyDisable({backer}) {
        setGatewayStore("down", gatewayStore.down.set(backer, true));

        if (gatewayStore.backedCoins.get(backer)) {
            setGatewayStore("backedCoins", gatewayStore.backedCoins.remove(backer));
            ss.set("backedCoins", gatewayStore.backedCoins.toJS());
        }
        if (gatewayStore.bridgeCoins.get(backer)) {
            setGatewayStore("bridgeCoins", gatewayStore.bridgeCoins.remove(backer));
            ss.set("bridgeCoins", gatewayStore.bridgeCoins.toJS());
        }
    },
    onLoadOnChainGatewayConfig(config) {
        setGatewayStore("onChainGatewayConfig", config || {});
    },
    isAllowed(backer) {
        return allowedGateway(backer);
    },
    anyAllowed() {
        return allowedGateway();
    },
    isDown(backer) {
        // call another static method with this
        return !!gatewayStore.down.get(backer);
    },
    getOnChainConfig(gatewayKey) {
        if (!gatewayKey) {
            return {};
        }
        // call another static method with this
        const onChainConfig = gatewayStore.onChainGatewayConfig;

        if (!onChainConfig || !onChainConfig.gateways) {
            return undefined
        };

        return onChainConfig.gateways[gatewayKey];
    },
    getGlobalOnChainConfig() {
        return gatewayStore.onChainGatewayConfig;
    },
    /**
     * FIXME: This does not belong into GatewayStore, but only creating a new store for it seems excessive
     * @param asset
     * @returns {boolean}
     */
    isAssetBlacklisted(asset) {
        let symbol = null;
        if (typeof asset == "object") {
            if (asset.symbol) {
                symbol = asset.symbol;
            } else if (asset.get) {
                symbol = asset.get("symbol");
            }
        } else {
            // string
            symbol = asset;
        }
        const globalOnChainConfig = gatewayStore.onChainGatewayConfig;
        if (
            !!globalOnChainConfig &&
            !!globalOnChainConfig.blacklists &&
            !!globalOnChainConfig.blacklists.assets
        ) {
            if (globalOnChainConfig.blacklists.assets.includes) {
                return globalOnChainConfig.blacklists.assets.includes(symbol);
            }
        }
        return false;
    }
});

export const useGatewayStore = () => [gatewayStore, setGatewayStore];