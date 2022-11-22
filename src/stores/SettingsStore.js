import { createStore } from 'solid-js/store';
import Immutable, {fromJS} from "immutable";
import ls from "common/localStorage";
import {Apis} from "bitsharesjs-ws";
import {settingsAPIs} from "api/apiConfig";
import {
    getDefaultTheme,
    getDefaultLogin,
    getMyMarketsBases,
    getMyMarketsQuotes,
    getUnits
} from "branding";

const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

const STORAGE_KEY = "__graphene__";
let ss = ls(STORAGE_KEY);

const [settingsStore, setSettingsStore] = createStore({
    initDone: false,
    defaultSettings: Immutable.Map({_getDefaultSetting()}),
    settings: Immutable.Map(_getSetting()),
    // deprecated to support existing code
    defaultSettings: Immutable.Map(_getDefaultSetting()),
    // this should be called choices, defaults is confusing
    defaults: _getChoices(),
    viewSettings: Immutable.Map(ss.get("viewSettings_v1")),
    marketDirections: Immutable.Map(ss.get("marketDirections")),
    hiddenAssets: Immutable.List(ss.get("hiddenAssets", [])),
    hiddenMarkets: Immutable.List(ss.get("hiddenMarkets", [])),
    apiLatencies: ss.get("apiLatencies", {}),
    mainnet_faucet: ss.get(
        "mainnet_faucet",
        settingsAPIs.DEFAULT_FAUCET
    ),
    testnet_faucet: ss.get(
        "testnet_faucet",
        settingsAPIs.TESTNET_FAUCET
    ),
    exchange: fromJS(ss.get("exchange", {})),
    priceAlert: fromJS(ss.get("priceAlert", [])),
    hiddenNewsHeadline: Immutable.List(
        ss.get("hiddenNewsHeadline", [])
    ),
    chartLayouts: Immutable.List(ss.get("chartLayouts", [])),
    getSetting(setting) {
        return settingsStore.settings.get(setting);
    },
    onChangeSetting(payload) {
        let save = true;
        switch (payload.setting) {
            case "faucet_address":
                if (payload.value.indexOf("testnet") === -1) {
                    setSettingsStore("mainnet_faucet", payload.value);
                    ss.set("mainnet_faucet", payload.value);
                } else {
                    setSettingsStore("testnet_faucet", payload.value);
                    ss.set("testnet_faucet", payload.value);
                }
                break;

            case "walletLockTimeout":
                ss.set("lockTimeout", payload.value);
                break;

            case "activeNode":
                // doesnt need to be saved in local storage
                save = true;

            default:
                break;
        }
        // check current settings
        if (settingsStore.settings.get(payload.setting) !== payload.value) {
            setSettingsStore("settings", settingsStore.settings.set(payload.setting, payload.value));
            if (save) {
                _saveSettings();
            }
        }
    },
    onChangeViewSetting(payload) {
        for (let key in payload) {
            setSettingsStore("viewSettings", settingsStore.viewSettings.set(key, payload[key]));
        }

        ss.set("viewSettings_v1", settingsStore.viewSettings.toJS());
    },
    onChangeMarketDirection(payload) {
        for (let key in payload) {
            if (payload[key]) {
                setSettingsStore(
                    "marketDirections",
                    settingsStore.marketDirections.set(key, payload[key])
                );
            } else {
                setSettingsStore(
                    "marketDirections",
                    settingsStore.marketDirections.delete(key)
                );
            }
        }
        ss.set("marketDirections", settingsStore.marketDirections.toJS());
    },
    onHideAsset(payload) {
        if (payload.id) {
            if (!payload.status) {
                setSettingsStore(
                    "hiddenAssets",
                    settingsStore.hiddenAssets.delete(
                        settingsStore.hiddenAssets.indexOf(payload.id)
                    )
                );
            } else {
                setSettingsStore("hiddenAssets", settingsStore.hiddenAssets.push(payload.id));
            }
        }

        ss.set("hiddenAssets", settingsStore.hiddenAssets.toJS());
    },
    onHideMarket(payload) {
        if (payload.id) {
            if (!payload.status) {
                setSettingsStore(
                    "hiddenMarkets",
                    settingsStore.hiddenMarkets.delete(
                        settingsStore.hiddenMarkets.indexOf(payload.id)
                    )
                );
            } else {
                setSettingsStore("hiddenMarkets", settingsStore.hiddenMarkets.push(payload.id));
            }
        }

        ss.set("hiddenMarkets", settingsStore.hiddenMarkets.toJS());
    },
    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;
        if (!settingsStore.starredMarkets.has(marketID)) {
            setSettingsStore(
                "starredMarkets",
                settingsStore.starredMarkets.set(marketID, {
                    quote: market.quote,
                    base: market.base
                })
            );
            ss.set(settingsStore.starredKey, settingsStore.starredMarkets.toJS());
        } else {
            return false;
        }
    },
    onSetUserMarket(payload) {
        let marketID = payload.quote + "_" + payload.base;
        if (payload.value) {
            setSettingsStore(
                "userMarkets",
                settingsStore.userMarkets.set(marketID, {
                    quote: payload.quote,
                    base: payload.base
                })
            );
        } else {
            setSettingsStore(
                "userMarkets",
                settingsStore.userMarkets.delete(marketID)
            );
        }
        ss.set(settingsStore.marketsKey, settingsStore.userMarkets.toJS());
    },
    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        setSettingsStore(
            "starredMarkets",
            settingsStore.starredMarkets.delete(marketID)
        );

        ss.set(settingsStore.starredKey, settingsStore.starredMarkets.toJS());
    },
    onClearStarredMarkets() {
        setSettingsStore("starredMarkets", Immutable.Map());
        ss.set(settingsStore.starredKey, settingsStore.starredMarkets.toJS());
    },
    onAddWS(ws) {
        if (typeof ws === "string") {
            ws = {url: ws, location: null};
        }
        setSettingsStore("defaults", {...settingsStore.defaults, apiServer: apiServer.push(ws)});
        ss.set("defaults_v1", settingsStore.defaults);
    },
    onRemoveWS(index) {
        setSettingsStore("defaults", {...settingsStore.defaults, apiServer: apiServer.splice(index, 1)});
        ss.set("defaults_v1", settingsStore.defaults);
    },
    onHideWS(url) {
        let node = settingsStore.defaults.apiServer.find(node => node.url === url);
        node.hidden = true;
        ss.set("defaults_v1", settingsStore.defaults);
    },
    onShowWS(url) {
        let node = settingsStore.defaults.apiServer.find(node => node.url === url);
        node.hidden = false;
        ss.set("defaults_v1", settingsStore.defaults);
    },
    onClearSettings(resolve) {
        ss.remove("settings_v3");
        ss.remove("settings_v4");
        setSettingsStore("settings", settingsStore.defaultSettings);
        _saveSettings();

        if (resolve) {
            resolve();
        }
    },
    onSwitchLocale({locale}) {
        settingsStore.onChangeSetting({setting: "locale", value: locale});
    },
    onUpdateLatencies(latencies) {
        ss.set("apiLatencies", latencies);
        setSettingsStore("apiLatencies", latencies);
    },
    getLastBudgetObject() {
        return ss.get(_getChainKey("lastBudgetObject"), "2.13.1");
    },
    setLastBudgetObject(value) {
        ss.set(_getChainKey("lastBudgetObject"), value);
    },
    setExchangeSettings(key, value) {
        setSettingsStore("exchange", settingsStore.exchange.set(key, value));
        ss.set("exchange", settingsStore.exchange.toJS());
    },
    getPriceAlert() {
        return settingsStore.priceAlert.toJS();
    },
    onSetPriceAlert(value) {
        setSettingsStore("priceAlert", fromJS(value));
        ss.set("priceAlert", value);
    },
    hasAnyPriceAlert(quoteAssetSymbol, baseAssetSymbol) {
        return settingsStore.priceAlert.some(
            priceAlert =>
                priceAlert.get("quoteAssetSymbol") === quoteAssetSymbol &&
                priceAlert.get("baseAssetSymbol") === baseAssetSymbol
        );
    },
    getExchangeSettings(key) {
        return settingsStore.exchange.get(key);
    },
    onSetExchangeLastExpiration(value) {
        settingsStore.setExchangeSettings("lastExpiration", fromJS(value));
    },
    onSetExchangeTutorialShown(value) {
        settingsStore.setExchangeSettings("tutorialShown", value);
    },
    getExhchangeLastExpiration() {
        return settingsStore.getExchangeSettings("lastExpiration");
    },
    onModifyPreferedBases(payload) {
        if ("newIndex" in payload && "oldIndex" in payload) {
            /* Reorder */
            let current = settingsStore.preferredBases.get(payload.newIndex);
            setSettingsStore(
                "preferredBases",
                settingsStore.preferredBases.set(
                    payload.newIndex,
                    settingsStore.preferredBases.get(payload.oldIndex)
                )
            );

            setSettingsStore(
                "preferredBases",
                settingsStore.preferredBases.set(
                    payload.oldIndex,
                    current
                )
            );
        } else if ("remove" in payload) {
            /* Remove */
            setSettingsStore(
                "preferredBases",
                settingsStore.preferredBases.delete(payload.remove)
            );
            let defaultMarkets = _getDefaultMarkets();
            setSettingsStore("defaultMarkets", Immutable.Map(defaultMarkets));
        } else if ("add" in payload) {
            /* Add new */
            setSettingsStore(
                "preferredBases",
                settingsStore.preferredBases.push(payload.add)
            );
            let defaultMarkets = _getDefaultMarkets();
            setSettingsStore("defaultMarkets", Immutable.Map(defaultMarkets));
        }

        ss.set(settingsStore.basesKey, settingsStore.preferredBases.toArray());
    },
    onUpdateUnits() {
        setSettingsStore("defaults", {...settingsStore.defaults, units: getUnits()});
        if (settingsStore.defaults.unit.indexOf(settingsStore.settings.get("unit")) === -1) {
            setSettingsStore(
                "settings",
                settingsStore.settings.set("unit", settingsStore.defaults.unit[0])
            );
            setSettingsStore(
                "settings",
                settingsStore.settings.set(
                    "fee_asset",
                    settingsStore.defaults.unit[0]
                )
            );
        }
    },
    onHideNewsHeadline(payload) {
        if (payload && settingsStore.hiddenNewsHeadline.indexOf(payload)) {
            setSettingsStore(
                "hiddenNewsHeadline",
                settingsStore.hiddenNewsHeadline.push(payload)
            );
            ss.set("hiddenNewsHeadline", settingsStore.hiddenNewsHeadline.toJS());
        }
    },
    onAddChartLayout(value) {
        if (value.name) {
            value.enabled = true;
            const index = settingsStore.chartLayouts.findIndex(
                item => item.name === value.name && item.symbol === value.symbol
            );
            if (index !== -1) {
                setSettingsStore(
                    "chartLayouts",
                    settingsStore.chartLayouts.delete(index)
                );
            }

            setSettingsStore(
                "chartLayouts",
                settingsStore.chartLayouts.map(item => {
                    if (item.symbol === value.symbol) item.enabled = false;
                    return item;
                })
            );
            setSettingsStore(
                "chartLayouts",
                settingsStore.chartLayouts.push(value)
            );
            ss.set("chartLayouts", settingsStore.chartLayouts.toJS());
        }
    },
    onDeleteChartLayout(name) {
        if (name) {
            const index = settingsStore.chartLayouts.findIndex(
                item => item.name === name
            );
            if (index !== -1) {
                setSettingsStore(
                    "chartLayouts",
                    settingsStore.chartLayouts.delete(index)
                );
            }
            ss.set("chartLayouts", settingsStore.chartLayouts.toJS());
        }
    },
    init() {
        return new Promise(resolve => {
            if (settingsStore.initDone) {
                resolve();
            }

            setSettingsStore("starredKey", _getChainKey("markets"));
            setSettingsStore("basesKey", _getChainKey("preferredBases"));
            setSettingsStore("marketsKey", _getChainKey("userMarkets"));

            // Default markets setup
            let topMarkets = {
                markets_4018d784: getMyMarketsQuotes(),
                markets_39f5e2ed: [
                    // TESTNET
                    "PEG.FAKEUSD",
                    "BTWTY"
                ]
            };

            let bases = {
                markets_4018d784: getMyMarketsBases(),
                markets_39f5e2ed: [
                    // TESTNET
                    "TEST"
                ]
            };

            let coreAssets = {
                markets_4018d784: "BTS",
                markets_39f5e2ed: "TEST"
            };
            let coreAsset = coreAssets[settingsStore.starredKey] || "BTS";
            /*
             * Update units depending on the chain, also make sure the 0 index
             * asset is always the correct CORE asset name
             */
            settingsStore.onUpdateUnits();

            let defaultUnits = settingsStore.defaults.unit;
            defaultUnits[0] = coreAsset;
            setSettingsStore(
                "defaults",
                {...settingsStore.defaults, unit: defaultUnits}
            );

            let defaultBases = bases[settingsStore.starredKey] || bases.markets_4018d784;
            let storedBases = ss.get(settingsStore.basesKey, []);

            setSettingsStore(
                "preferredBases",
                Immutable.List(storedBases.length ? storedBases : defaultBases)
            );

            setSettingsStore(
                "chainMarkets",
                topMarkets[settingsStore.starredKey] || []
            );

            let defaultMarkets = _getDefaultMarkets();
            setSettingsStore("defaultMarkets", Immutable.Map(defaultMarkets));
            setSettingsStore("starredMarkets", Immutable.Map(ss.get(settingsStore.starredKey, [])));
            setSettingsStore("userMarkets", Immutable.Map(ss.get(settingsStore.marketsKey, {})));
            setSettingsStore("initDone", true);
            resolve();
        });
    }
});

export const useSettingsStore = () => [settingsStore, setSettingsStore];

/**
 * SettingsStore takes care of maintaining user set settings values and notifies all listeners
 */
class SettingsStore {

}

/**
 * Returns the default selected values that the user can reset to
 * @returns dictionary
 * @private
 */
function _getDefaultSetting() {
    return {
        locale: "en",
        apiServer: settingsAPIs.DEFAULT_WS_NODE,
        filteredApiServers: [],
        filteredServiceProviders: ["all"],
        faucet_address: settingsAPIs.DEFAULT_FAUCET,
        unit: CORE_ASSET,
        fee_asset: CORE_ASSET,
        showSettles: false,
        showAssetPercent: false,
        walletLockTimeout: 60 * 10,
        themes: getDefaultTheme(),
        passwordLogin: getDefaultLogin() == "password",
        browser_notifications: {
            allow: true,
            additional: {
                transferToMe: true
            }
        },
        rememberMe: true,
        viewOnlyMode: true,
        showProposedTx: false
    };
}

/**
 * All possible choices for the settings
 * @returns dictionary
 * @private
 */
function _getDefaultChoices() {
    return {
        locale: [
            "en",
            "zh",
            "fr",
            "ko",
            "de",
            "es",
            "it",
            "tr",
            "ru",
            "ja"
        ],
        apiServer: settingsAPIs.WS_NODE_LIST.slice(0), // clone all default servers as configured in apiConfig.js
        filteredApiServers: [[]],
        filteredServiceProviders: [[]],
        unit: getUnits(),
        fee_asset: getUnits(),
        showProposedTx: [{translate: "yes"}, {translate: "no"}],
        showSettles: [{translate: "yes"}, {translate: "no"}],
        showAssetPercent: [{translate: "yes"}, {translate: "no"}],
        themes: ["darkTheme", "lightTheme", "midnightTheme"],
        passwordLogin: [
            {translate: "cloud_login"},
            {translate: "local_wallet"}
        ],
        browser_notifications: {
            allow: [true, false],
            additional: {
                transferToMe: [true, false]
            }
        },
        rememberMe: [true, false],
        viewOnlyMode: [{translate: "show"}, {translate: "hide"}]
    };
}

/**
 * Checks if an object is actually empty (no keys or only empty keys)
 * @param object
 * @returns {boolean}
 * @private
 */
function _isEmpty(object) {
    let isEmpty = true;
    Object.keys(object).forEach(key => {
        if (object.hasOwnProperty(key) && object[key] !== null)
            isEmpty = false;
    });
    return isEmpty;
}

/**
 * Ensures that defauls are not stored in local storage, only changes, and when reading inserts all defaults.
 *
 * @param mode
 * @param settings
 * @param defaultSettings
 * @returns {{}}
 * @private
 */
function _replaceDefaults(mode = "saving", settings, defaultSettings = null) {
    if (defaultSettings == null) {
        // this method might be called recursively, so not always use the whole defaults
        defaultSettings = _getDefaultSetting();
    }

    let excludedKeys = ["activeNode"];

    // avoid copy by reference
    let returnSettings = {};
    if (mode === "saving") {
        // remove every setting that is default
        Object.keys(settings).forEach(key => {
            if (excludedKeys.includes(key)) {
                return;
            }
            // must be of same type to be compatible
            if (typeof settings[key] === typeof defaultSettings[key]) {
                if (
                    !(settings[key] instanceof Array) &&
                    typeof settings[key] == "object"
                ) {
                    let newSetting = _replaceDefaults(
                        "saving",
                        settings[key],
                        defaultSettings[key]
                    );
                    if (!_isEmpty(newSetting)) {
                        returnSettings[key] = newSetting;
                    }
                } else if (settings[key] !== defaultSettings[key]) {
                    // only save if its not the default
                    if (settings[key] instanceof Array) {
                        if (
                            JSON.stringify(settings[key]) !==
                            JSON.stringify(defaultSettings[key])
                        ) {
                            returnSettings[key] = settings[key];
                        }
                    } else {
                        // only save if its not the default
                        returnSettings[key] = settings[key];
                    }
                }
            }
            // all other cases are defaults, do not put the value in local storage
        });
    } else {
        Object.keys(defaultSettings).forEach(key => {
            let setDefaults = false;
            if (settings[key] !== undefined) {
                // exists in saved settings, check value
                if (typeof settings[key] !== typeof defaultSettings[key]) {
                    // incompatible types, use default
                    setDefaults = true;
                } else if (
                    !(settings[key] instanceof Array) &&
                    typeof settings[key] == "object"
                ) {
                    // check all subkeys
                    returnSettings[key] = _replaceDefaults(
                        "loading",
                        settings[key],
                        defaultSettings[key]
                    );
                } else {
                    returnSettings[key] = settings[key];
                }
            } else {
                setDefaults = true;
            }
            if (setDefaults) {
                if (typeof settings[key] == "object") {
                    // use defaults, deep copy
                    returnSettings[key] = JSON.parse(
                        JSON.stringify(defaultSettings[key])
                    );
                } else {
                    returnSettings[key] = defaultSettings[key];
                }
            }
        });
        // copy all the rest as well
        Object.keys(settings).forEach(key => {
            if (returnSettings[key] == undefined) {
                // deep copy
                returnSettings[key] = JSON.parse(
                    JSON.stringify(settings[key])
                );
            }
        });
    }
    return returnSettings;
}

/**
 * Returns the currently active settings, either default or from local storage
 * @returns {*}
 * @private
 */
function _getSetting() {
    // migrate to new settings
    // - v3  defaults are stored as values which makes it impossible to react on changed defaults
    // - v4  refactored complete settings handling. defaults are no longer stored in local storage and
    //       set if not present on loading
    let support_v3_until = new Date("2018-10-20T00:00:00Z");

    if (!ss.has("settings_v4") && new Date() < support_v3_until) {
        // ensure backwards compatibility of settings version
        let settings_v3 = ss.get("settings_v3");
        if (!!settings_v3) {
            if (settings_v3["themes"] === "olDarkTheme") {
                settings_v3["themes"] = "midnightTheme";
            }
        }
        _saveSettings(settings_v3, _getDefaultSetting());
    }

    return _loadSettings();
}

/**
 * Overwrite configuration while utilizing call-by-reference
 * @param apiTarget
 * @param apiSource
 * @private
 */
function _injectApiConfiguration(apiTarget, apiSource) {
    // any defaults in the apiConfig are to be maintained!
    apiTarget.hidden = apiSource.hidden;
}

/**
 * Save settings to local storage after checking for defaults
 * @param settings
 * @private
 */
function _saveSettings(settings = null) {
    if (settings == null) {
        settings = settingsStore.settings.toJS();
    }
    ss.set("settings_v4", _replaceDefaults("saving", settings));
}

/**
 * Load settings from local storage and fill in details
 * @returns {{}}
 * @private
 */
function _loadSettings() {
    let userSavedSettings = ss.get("settings_v4");
    // if (!!userSavedSettings) {
    //     console.log("User settings have been loaded:", userSavedSettings);
    // }
    return _replaceDefaults("loading", userSavedSettings);
}

/**
 * Returns the currently active choices for settings, either default or from local storage
 * @returns {*}
 * @private
 */
function _getChoices() {
    // default choices the user can select from
    let choices = _getDefaultChoices();
    // get choices stored in local storage
    let savedChoices = _ensureBackwardsCompatibilityChoices(
        ss.get("defaults_v1", {apiServer: []})
    );

    // merge choices by hand (do not use merge as the order in the apiServer list may change)
    let mergedChoices = Object.assign({}, savedChoices);
    Object.keys(choices).forEach(key => {
        if (key != "apiServer") {
            mergedChoices[key] = choices[key];
        }
    });
    mergedChoices.apiServer = _getApiServerChoices(
        choices,
        savedChoices
    );
    return mergedChoices;
}

/**
 * Get all apiServer choices and mark the ones that are in the default choice as default
 * @param choices
 * @param savedChoices
 * @returns {string}
 * @private
 */
function _getApiServerChoices(choices, savedChoices) {
    let apiServer = choices.apiServer.slice(0); // maintain order in apiConfig.js
    // add any apis that the user added and update changes
    savedChoices.apiServer.forEach(api => {
        let found = apiServer.find(a => a.url == api.url);
        if (!!found) {
            _injectApiConfiguration(found, api);
        } else {
            if (!api.default) {
                // always add personal nodes at end of existing nodes, arbitrary decision
                apiServer.push(api);
            }
        }
    });
    apiServer = apiServer.map(node => {
        let found = choices.apiServer.find(a => a.url == node.url);
        node.default = !!found;
        node.hidden = !!node.hidden; // make sure this flag exists
        return node;
    });
    return apiServer;
}

/**
 * Adjust loaded choices for backwards compatibility if any key names or values change
 * @param savedChoices
 * @returns {*}
 * @private
 */
function _ensureBackwardsCompatibilityChoices(savedChoices) {
    /* Fix for old clients after changing cn to zh */
    if (savedChoices && savedChoices.locale) {
        let cnIdx = savedChoices.locale.findIndex(a => a === "cn");
        if (cnIdx !== -1) savedChoices.locale[cnIdx] = "zh";
    }
    if (savedChoices && savedChoices.themes) {
        let olIdx = savedChoices.themes.findIndex(a => a === "olDarkTheme");
        if (olIdx !== -1) savedChoices.themes[olIdx] = "midnightTheme";
    }
    if (savedChoices && savedChoices.apiServer) {
        savedChoices.apiServer = savedChoices.apiServer.map(api => {
            // might be only a string, be backwards compatible
            if (typeof api === "string") {
                api = {
                    url: api,
                    location: null
                };
            }
            return api;
        });
    }
    return savedChoices;
}

function _getChainId() {
    return (Apis.instance().chain_id || "4018d784").substr(0, 8);
}

function _getChainKey(key) {
    const chainId = _getChainId();
    return key + (chainId ? `_${chainId.substr(0, 8)}` : "");
}

function _getDefaultMarkets() {
    let markets = [];

    settingsStore.preferredBases.forEach(base => {
        addMarkets(markets, base, settingsStore.chainMarkets);
    });

    function addMarkets(target, base, markets) {
        markets
            .filter(a => {
                return a !== base;
            })
            .forEach(market => {
                target.push([
                    `${market}_${base}`,
                    {quote: market, base: base}
                ]);
            });
    }

    return markets;
}