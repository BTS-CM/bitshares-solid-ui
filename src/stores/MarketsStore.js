import Immutable from "immutable";
import { createStore } from 'solid-js/store';
import {ChainStore} from "bitsharesjs";

import MarketsActions from "actions/MarketsActions";
import market_utils from "common/market_utils";
import ls from "common/localStorage";
import utils from "common/utils";
import {
    LimitOrder,
    CallOrder,
    FeedPrice,
    SettleOrder,
    Asset,
    didOrdersChange,
    Price,
    GroupedOrder,
    FillOrder
} from "common/MarketClasses";
import asset_utils from "../lib/common/asset_utils";

// import {
//     SettleOrder
// }
// from "./tcomb_structs";

const nullPrice = {
    getPrice: () => {
        return 0;
    },
    sellPrice: () => {
        return 0;
    }
};

let marketStorage = ls("__graphene__");

/*
    marketsStore.bindListeners({
        onSubscribeMarket: MarketsActions.subscribeMarket,
        onUnSubscribeMarket: MarketsActions.unSubscribeMarket,
        onChangeBase: MarketsActions.changeBase,
        onChangeBucketSize: MarketsActions.changeBucketSize,
        onCancelLimitOrderSuccess: MarketsActions.cancelLimitOrderSuccess,
        onCloseCallOrderSuccess: MarketsActions.closeCallOrderSuccess,
        onCallOrderUpdate: MarketsActions.callOrderUpdate,
        // onClearMarket: MarketsActions.clearMarket,
        onGetMarketStats: MarketsActions.getMarketStats,
        onSettleOrderUpdate: MarketsActions.settleOrderUpdate,
        onSwitchMarket: MarketsActions.switchMarket,
        onFeedUpdate: MarketsActions.feedUpdate,
        onToggleStars: MarketsActions.toggleStars,
        onGetTrackedGroupsConfig: MarketsActions.getTrackedGroupsConfig,
        onChangeCurrentGroupLimit: MarketsActions.changeCurrentGroupLimit
    });

    marketsStore.exportPublicMethods({
        subscribe: marketsStore.subscribe.bind(this),
        unsubscribe: marketsStore.unsubscribe.bind(this),
        clearSubs: marketsStore.clearSubs.bind(this)
    });
*/

// TODO: Replace marketsStore.blah = value with setmarkestsStore({blah: value}) ...

const [marketsStore, setMarketsStore] = createStore({
    markets: Immutable.Map(),
    asset_symbol_to_id: {},
    pendingOrders: Immutable.Map(),
    marketLimitOrders: Immutable.Map(),
    marketCallOrders: Immutable.Map(),
    allCallOrders: [],
    feedPrice: null,
    marketSettleOrders: Immutable.OrderedSet(),
    activeMarketHistory: Immutable.OrderedSet(),
    marketData: {
        bids: [],
        asks: [],
        calls: [],
        combinedBids: [],
        highestBid: nullPrice,
        combinedAsks: [],
        lowestAsk: nullPrice,
        flatBids: [],
        flatAsks: [],
        flatCalls: [],
        flatSettles: [],
        groupedBids: [],
        groupedAsks: []
    },
    totals: {
        bid: 0,
        ask: 0,
        call: 0
    },
    priceData: [],
    pendingCreateLimitOrders: [],
    activeMarket: null,
    quoteAsset: null,
    pendingCounter: 0,
    buckets: [15, 60, 300, 3600, 86400],
    bucketSize: _getBucketSize(),
    priceHistory: [],
    lowestCallPrice: null,
    marketBase: "BTS",
    marketStats: Immutable.Map({
        change: 0,
        volumeBase: 0,
        volumeQuote: 0
    }),
    marketReady: false,
    baseAsset: {
        id: "1.3.0",
        symbol: "BTS",
        precision: 5
    },
    coreAsset: {
        id: "1.3.0",
        symbol: "CORE",
        precision: 5
    },
    onlyStars: marketStorage.get("onlyStars", false),
    trackedGroupsConfig: [],
    currentGroupLimit: 0,
    subscribers: new Map(),
    allMarketStats: () => {
        let allMarketStats = marketStorage.get("allMarketStats", {});
        for (let market in allMarketStats) {
            if (allMarketStats[market].price) {
                allMarketStats[market].price = new Price({
                    base: new Asset({...allMarketStats[market].price.base}),
                    quote: new Asset({...allMarketStats[market].price.quote})
                });
            }
        }
        
        return Immutable.Map(allMarketStats);
    },
    /**
     *  Add a callback that will be called anytime any object in the cache is updated
     */
    subscribe(id, callback) {
        if (marketsStore.subscribers.has(id) && marketsStore.subscribers.get(id) === callback) {
            return console.error("Subscribe callback already exists", callback);
        }
        setMarketsStore({subscribers: marketsStore.subscribers.set(id, callback)});
    },
    /**
     *  Remove a callback that was previously added via subscribe
     */
    unsubscribe(id) {
        if (marketsStore.subscribers.has(id)) {
            setMarketsStore({subscribers: marketsStore.subscribers.delete(id)});
        }
    },
    clearSubs() {
        setMarketsStore({subscribers: new Map()});
    },
    onGetCollateralPositions(payload) {
        setMarketsStore(
            "borrowMarketState",
            {
                totalDebt: payload.totalDebt,
                totalCollateral: payload.totalCollateral
            }
        )
    },
    onChangeBase(market) {
        setMarketsStore({marketBase: market});
    },
    onChangeBucketSize(size) {
        _setBucketSize(size);
    },
    onToggleStars() {
        setMarketsStore({onlyStars: !marketsStore.onlyStars});
        marketStorage.set("onlyStars", marketsStore.onlyStars);
    },
    onUnSubscribeMarket(payload) {
        // Optimistic removal of activeMarket
        if (payload.unSub) {
            setMarketsStore({activeMarket: null});
        } else {
            // Unsub failed, restore activeMarket
            setMarketsStore({activeMarket: payload.market});
        }

        if (payload.resolve) {
            payload.resolve();
        }
    },
    onSwitchMarket() {
        setMarketsStore({marketReady: false});
    },
    onClearMarket() {
        setMarketsStore("activeMarket", null)
        setMarketsStore("is_prediction_market", false)
        setMarketsStore("marketLimitOrders", marketsStore.marketLimitOrders.clear())
        setMarketsStore("marketCallOrders", marketsStore.marketCallOrders.clear())
        setMarketsStore("allCallOrders", [])
        setMarketsStore("feedPrice", null)
        setMarketsStore("marketSettleOrders", marketsStore.marketSettleOrders.clear())
        setMarketsStore("activeMarketHistory", marketsStore.activeMarketHistory.clear())
        setMarketsStore("marketData", {
            bids: [],
            asks: [],
            calls: [],
            combinedBids: [],
            highestBid: nullPrice,
            combinedAsks: [],
            lowestAsk: nullPrice,
            flatBids: [],
            flatAsks: [],
            flatCalls: [],
            flatSettles: [],
            groupedBids: [],
            groupedAsks: []
        })
        setMarketsStore("totals", {
            bid: 0,
            ask: 0,
            call: 0
        })
        setMarketsStore("lowestCallPrice", null)
        setMarketsStore("pendingCreateLimitOrders", [])
        setMarketsStore("priceHistory", [])
        setMarketsStore("marketStats", Immutable.Map({
            change: 0,
            volumeBase: 0,
            volumeQuote: 0
        }))
    },
    onSubscribeMarket(result) {
        let newMarket = false;
        let limitsChanged = false;
        let callsChanged = false;

        if (result.switchMarket) {
            setMarketsStore("marketReady", false);
            return marketsStore.emitChange();
        }

        setMarketsStore("invertedCalls", result.inverted);
        setMarketsStore("quoteAsset", ChainStore.getAsset(result.quote.get("id")));
        setMarketsStore("baseAsset", ChainStore.getAsset(result.base.get("id")));

        // Get updated assets every time for updated feed data

        const assets = {
            [marketsStore.quoteAsset.get("id")]: {
                precision: marketsStore.quoteAsset.get("precision")
            },
            [marketsStore.baseAsset.get("id")]: {
                precision: marketsStore.baseAsset.get("precision")
            }
        };

        if (result.market && result.market !== marketsStore.activeMarket) {
            marketsStore.onClearMarket();
            setMarketsStore("activeMarket", result.market);
            newMarket = true;
            /*
            * To prevent the callback from DataFeed to be called with new data
            * before subscribeBars in DataFeed has been updated, we clear the
            * callback subscription here
            */
            marketsStore.unsubscribe("subscribeBars");
        }

        /* Set the feed price (null if not a bitasset market) */
        setMarketsStore("feedPrice", _getFeed());

        if (result.buckets) {
            setMarketsStore("buckets", result.buckets);
            if (result.buckets.indexOf(marketsStore.bucketSize) === -1) {
                setMarketsStore("bucketSize", result.buckets[result.buckets.length - 1]);
            }
        }

        if (result.buckets) {
            setMarketsStore("buckets", result.buckets);
        }

        if (result.limits) {
            // Keep an eye on this as the number of orders increases, it might not scale well
            const oldmarketLimitOrders = marketsStore.marketLimitOrders;
            setMarketsStore("marketLimitOrders", marketsStore.marketLimitOrders.clear());
            // console.time("Create limit orders " + marketsStore.activeMarket);
            result.limits.forEach(order => {
                // ChainStore._updateObject(order, false, false);
                if (typeof order.for_sale !== "number") {
                    order.for_sale = parseInt(order.for_sale, 10);
                }
                order.expiration = new Date(order.expiration);
                setMarketsStore(
                    "marketLimitOrders",
                    marketsStore.marketLimitOrders.set(
                        order.id,
                        new LimitOrder(order, assets, marketsStore.quoteAsset.get("id"))
                    )
                );
            });

            limitsChanged = didOrdersChange(
                marketsStore.marketLimitOrders,
                oldmarketLimitOrders
            );

            // Loop over pending orders to remove temp order from orders map and remove from pending
            for (
                let i = marketsStore.pendingCreateLimitOrders.length - 1;
                i >= 0;
                i--
            ) {
                let myOrder = marketsStore.pendingCreateLimitOrders[i];
                let order = marketsStore.marketLimitOrders.find(order => {
                    return (
                        myOrder.seller === order.seller &&
                        myOrder.expiration === order.expiration
                    );
                });

                // If the order was found it has been confirmed, delete it from pending
                if (order) {
                    setMarketsStore(
                        "pendingCreateLimitOrders",
                        marketsStore.pendingCreateLimitOrders.splice(i, 1)
                    );
                }
            }

            // console.timeEnd("Create limit orders " + marketsStore.activeMarket);

            if (marketsStore.pendingCreateLimitOrders.length === 0) {
                setMarketsStore("pendingCounter", 0);
            }

            // console.log("time to process limit orders:", new Date() - limitStart, "ms");
        }

        if (result.calls) {
            const oldmarketCallOrders = marketsStore.marketCallOrders;
            setMarketsStore("allCallOrders", result.calls);
            setMarketsStore("marketCallOrders", marketsStore.marketCallOrders.clear());

            result.calls.forEach(call => {
                // ChainStore._updateObject(call, false, false);
                try {
                    let mcr = this[
                        marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
                    ].getIn([
                        "bitasset",
                        "current_feed",
                        "maintenance_collateral_ratio"
                    ]);

                    let callOrder = new CallOrder(
                        call,
                        assets,
                        marketsStore.quoteAsset.get("id"),
                        marketsStore.feedPrice,
                        mcr,
                        marketsStore.is_prediction_market
                    );
                    if (callOrder.isMarginCalled()) {
                        setMarketsStore(
                            "marketCallOrders",
                            marketsStore.marketCallOrders.set(call.id, callOrder, mcr)
                        )
                    }
                } catch (err) {
                    console.error(
                        "Unable to construct calls array, invalid feed price or prediction market?"
                    );
                }
            });

            callsChanged = didOrdersChange(
                marketsStore.marketCallOrders,
                oldmarketCallOrders
            );
        }

        marketsStore.updateSettleOrders(result);

        if (result.history) {
            setMarketsStore("activeMarketHistory", marketStore.activeMarketHistory.clear());
            result.history.forEach(order => {
                /* Only include history objects that aren't 'something for nothing' to avoid confusion */
                if (
                    !order.op.is_maker &&
                    !(
                        order.op.receives.amount == 0 ||
                        order.op.pays.amount == 0
                    )
                ) {
                    setMarketsStore(
                        "activeMarketHistory",
                        marketsStore.activeMarketHistory.add(
                            new FillOrder(order.op, assets, marketsStore.quoteAsset.get("id"))
                        )
                    )
                }
            });
        }

        if (result.fillOrders) {
            result.fillOrders.forEach(fill => {
                setMarketsStore(
                    "activeMarketHistory",
                    marketsStore.activeMarketHistory.add(
                        new FillOrder(fill[0][1], assets, marketsStore.quoteAsset.get("id"))
                    )
                );
            });
        }

        if (result.ticker) {
            let marketName =
                marketsStore.quoteAsset.get("symbol") +
                "_" +
                marketsStore.baseAsset.get("symbol");
            let stats = _calcMarketStats(
                marketsStore.baseAsset,
                marketsStore.quoteAsset,
                marketName,
                result.ticker
            );

            setMarketsStore("allMarketStats", marketsStore.allMarketStats.set(marketName, stats));

            let {invertedStats, invertedMarketName} = _invertMarketStats(
                stats,
                marketName
            );

            setMarketsStore("allMarketStats", marketsStore.allMarketStats.set(invertedMarketName, invertedStats));
            _saveMarketStats();

            setMarketsStore("marketStats", marketStore.marketStats.set("change", stats.change));
            setMarketsStore("marketStats", marketStore.marketStats.set("volumeBase", stats.volumeBase));
            setMarketsStore("marketStats", marketStore.marketStats.set("volumeQuote", stats.volumeQuote));
        }

        if (callsChanged || limitsChanged) {
            // Update orderbook
            _orderBook(limitsChanged, callsChanged);

            // Update depth chart data
            _depthChart();
        }

        // Update pricechart data
        if (result.price) {
            setMarketsStore("priceHistory", result.price);
            _priceChart();
        }

        if (
            result.groupedOrdersBids.length > 0 ||
            result.groupedOrdersAsks.length > 0
        ) {
            const groupedOrdersBids = [];
            const groupedOrdersAsks = [];
            result.groupedOrdersBids.forEach((order, index) => {
                groupedOrdersBids.push(new GroupedOrder(order, assets, true));
            });
            result.groupedOrdersAsks.forEach((order, index) => {
                groupedOrdersAsks.push(new GroupedOrder(order, assets, false));
            });
            // Update groupedOrderbook
            _groupedOrderBook(groupedOrdersBids, groupedOrdersAsks);

            // Update depth chart data
            _depthChart();
        }

        setMarketsStore("marketReady", true);
        marketsStore.emitChange();

        if (newMarket) {
            let quote = marketsStore.quoteAsset.get("symbol");
            let base = marketsStore.baseAsset.get("symbol");
            _notifySubscriber("market_change", `${quote}_${base}`);
        }

        if (result.resolve) {
            result.resolve();
        }
    },
    onCancelLimitOrderSuccess(cancellations) {
        if (cancellations && cancellations.length) {
            let didUpdate = false;
            cancellations.forEach(orderID => {
                if (orderID && marketsStore.marketLimitOrders.has(orderID)) {
                    didUpdate = true;
                    setMarketsStore("marketLimitOrders", marketsStore.marketLimitOrders.delete(orderID));
                }
            });

            if (marketsStore.marketLimitOrders.size === 0) {
                setMarketsStore("marketData", {
                    bids: [],
                    flatBids: [],
                    asks: [],
                    flatAsks: []
                });
            }

            if (didUpdate) {
                // Update orderbook
                _orderBook(true, false);

                // Update depth chart data
                _depthChart();
            }
        } else {
            return false;
        }
    },
    onCloseCallOrderSuccess(orderID) {
        if (orderID && marketsStore.marketCallOrders.has(orderID)) {
            setMarketsStore("marketCallOrders", marketsStore.marketCallOrders.delete(orderID));
            if (marketsStore.marketCallOrders.size === 0) {
                setMarketsStore("marketData", {...marketsStore.marketData, calls: [], flatCalls: []});
            }
            // Update orderbook
            _orderBook(false, true);

            // Update depth chart data
            _depthChart();
        } else {
            return false;
        }
    },
    onCallOrderUpdate(call_order) {
        if (call_order && marketsStore.quoteAsset && marketsStore.baseAsset && marketsStore.feedPrice) {
            if (
                call_order.call_price.quote.asset_id === marketsStore.quoteAsset.get("id") ||
                call_order.call_price.quote.asset_id === marketsStore.baseAsset.get("id")
            ) {
                const assets = {
                    [marketsStore.quoteAsset.get("id")]: {
                        precision: marketsStore.quoteAsset.get("precision")
                    },
                    [marketsStore.baseAsset.get("id")]: {
                        precision: marketsStore.baseAsset.get("precision")
                    }
                };
                try {
                    let mcr = this[
                        marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
                    ].getIn([
                        "bitasset",
                        "current_feed",
                        "maintenance_collateral_ratio"
                    ]);

                    let callOrder = new CallOrder(
                        call_order,
                        assets,
                        marketsStore.quoteAsset.get("id"),
                        marketsStore.feedPrice,
                        mcr
                    );
                    // console.log("**** onCallOrderUpdate **", call_order, "isMarginCalled:", callOrder.isMarginCalled());

                    if (callOrder.isMarginCalled()) {
                        setMarketsStore(
                            "marketCallOrders",
                            marketsStore.marketCallOrders.set(
                                call_order.id,
                                callOrder,
                                mcr
                            )
                        );

                        // Update orderbook
                        _orderBook(false, true);

                        // Update depth chart data
                        _depthChart();
                    }
                } catch (err) {
                    console.error(
                        "Unable to construct calls array, invalid feed price or prediction market?",
                        call_order,
                        marketsStore.quoteAsset && marketsStore.quoteAsset.get("id"),
                        marketsStore.baseAsset && marketsStore.baseAsset.get("id")
                    );
                }
            }
        } else {
            return false;
        }
    },
    onFeedUpdate(asset) {
        if (!marketsStore.quoteAsset || !marketsStore.baseAsset) {
            return false;
        }

        if (
            asset.get("id") ===
            marketsStore.invertedCalls
                ? marketsStore.baseAsset.get("id")
                : marketsStore.quoteAsset.get("id")
        ) {
            setMarketsStore(marketsStore.invertedCalls ? "baseAsset" : "quoteAsset", asset);
        } else {
            return false;
        }

        let feedChanged = false;
        let newFeed = _getFeed();
        if (
            (newFeed && !marketsStore.feedPrice) ||
            (marketsStore.feedPrice && marketsStore.feedPrice.ne(newFeed))
        ) {
            feedChanged = true;
        }

        if (feedChanged) {
            setMarketsStore("feedPrice", newFeed);
            const assets = {
                [marketsStore.quoteAsset.get("id")]: {
                    precision: marketsStore.quoteAsset.get("precision")
                },
                [marketsStore.baseAsset.get("id")]: {
                    precision: marketsStore.baseAsset.get("precision")
                }
            };

            /*
                * If the feed price changed, we need to check whether the orders
                * being margin called have changed and filter accordingly. To do so
                * we recreate the marketCallOrders map from scratch using the
                * previously fetched data and the new feed price.
                */
            setMarketsStore("marketCallOrders", marketsStore.marketCallOrders.clear());
            marketsStore.allCallOrders.forEach(call => {
                // ChainStore._updateObject(call, false, false);
                try {
                    let mcr = marketsStore[
                        marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
                    ].getIn([
                        "bitasset",
                        "current_feed",
                        "maintenance_collateral_ratio"
                    ]);

                    let callOrder = new CallOrder(
                        call,
                        assets,
                        marketsStore.quoteAsset.get("id"),
                        marketsStore.feedPrice,
                        mcr,
                        marketsStore.is_prediction_market
                    );

                    if (callOrder.isMarginCalled()) {
                        setMarketsStore(
                            "marketCallOrders",
                            marketsStore.marketCallOrders.set(
                                call.id,
                                new CallOrder(
                                    call,
                                    assets,
                                    marketsStore.quoteAsset.get("id"),
                                    marketsStore.feedPrice,
                                    mcr
                                )
                            )
                        )
                    }
                } catch (err) {
                    console.error(
                        "Unable to construct calls array, invalid feed price or prediction market?"
                    );
                }
            });

            // Update orderbook
            _orderBook(true, true);

            // Update depth chart data
            _depthChart();
        }
    },
    constructCalls(callsArray) {
        let calls = [];
        if (callsArray.size) {
            calls = callsArray
                .sort((a, b) => {
                    return a.getPrice() - b.getPrice();
                })
                .map(order => {
                    if (marketsStore.invertedCalls) {
                        setMarketsStore(
                            "lowestCallPrice",
                            !marketsStore.lowestCallPrice
                                ? order.getPrice(false)
                                : Math.max(
                                        marketsStore.lowestCallPrice,
                                        order.getPrice(false)
                                    )
                        );
                    } else {
                        setMarketsStore(
                            "lowestCallPrice",
                            !marketsStore.lowestCallPrice
                                ? order.getPrice(false)
                                : Math.min(
                                        marketsStore.lowestCallPrice,
                                        order.getPrice(false)
                                    )
                        );
                    }

                    return order;
                })
                .toArray();

            // Sum calls at same price
            if (calls.length > 1) {
                for (let i = calls.length - 2; i >= 0; i--) {
                    calls[i] = calls[i].sum(calls[i + 1]);
                    calls.splice(i + 1, 1);
                }
            }
        } else {
            setMarketsStore("lowestCallPrice", null);
        }
        return calls;
    },
    // TODO: Continue here 
    onGetMarketStats(payload) {
        if (payload && payload.tickers) {
            for (var i = 0; i < payload.tickers.length; i++) {
                let stats = _calcMarketStats(
                    payload.bases[i],
                    payload.quotes[i],
                    payload.markets[i],
                    payload.tickers[i]
                );
                marketsStore.allMarketStats = marketsStore.allMarketStats.set(
                    payload.markets[i],
                    stats
                );

                let {
                    invertedStats,
                    invertedMarketName
                } = _invertMarketStats(stats, payload.markets[i]);
                marketsStore.allMarketStats = marketsStore.allMarketStats.set(
                    invertedMarketName,
                    invertedStats
                );
            }

            _saveMarketStats();

            return true;
        }
        return false;
    },
    onSettleOrderUpdate(result) {
        marketsStore.updateSettleOrders(result);
    },
    updateSettleOrders(result) {
        if (result.settles && result.settles.length) {
            const assets = {
                [marketsStore.quoteAsset.get("id")]: {
                    precision: marketsStore.quoteAsset.get("precision")
                },
                [marketsStore.baseAsset.get("id")]: {
                    precision: marketsStore.baseAsset.get("precision")
                }
            };
            marketsStore.marketSettleOrders = marketsStore.marketSettleOrders.clear();

            result.settles.forEach(settle => {
                // let key = settle.owner + "_" + settle.balance.asset_id;

                settle.settlement_date = new Date(settle.settlement_date + "Z");

                marketsStore.marketSettleOrders = marketsStore.marketSettleOrders.add(
                    new SettleOrder(
                        settle,
                        assets,
                        marketsStore.quoteAsset.get("id"),
                        marketsStore.feedPrice,
                        marketsStore.bitasset_options
                    )
                );
            });
        }
    },
    onGetTrackedGroupsConfig(result) {
        if (result.trackedGroupsConfig.length > 0) {
            marketsStore.trackedGroupsConfig = result.trackedGroupsConfig;
        }
    },
    onChangeCurrentGroupLimit(groupLimit) {
        marketsStore.currentGroupLimit = groupLimit;
    }
});

function _notifySubscriber(id, data) {
    if (marketsStore.subscribers.has(id)) marketsStore.subscribers.get(id)(data);
}

function _getBucketSize() {
    return parseInt(marketStorage.get("bucketSize", 3600));
}

/**
 * @param {Number} size
 */
 function _setBucketSize(size) {
    marketsStore.bucketSize = size;
    marketStorage.set("bucketSize", size);
}

function _marketHasCalls() {
    const {quoteAsset, baseAsset} = this;
    if (
        quoteAsset.has("bitasset") &&
        quoteAsset.getIn(["bitasset", "options", "short_backing_asset"]) ===
            baseAsset.get("id")
    ) {
        return true;
    } else if (
        baseAsset.has("bitasset") &&
        baseAsset.getIn(["bitasset", "options", "short_backing_asset"]) ===
            quoteAsset.get("id")
    ) {
        return true;
    }
    return false;
}

function _getFeed() {
    if (!_marketHasCalls()) {
        marketsStore.bitasset_options = null;
        marketsStore.is_prediction_market = false;
        return null;
    }

    const assets = {
        [marketsStore.quoteAsset.get("id")]: {
            precision: marketsStore.quoteAsset.get("precision")
        },
        [marketsStore.baseAsset.get("id")]: {
            precision: marketsStore.baseAsset.get("precision")
        }
    };
    let feedPriceRaw = asset_utils.extractRawFeedPrice(
        this[marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"]
    );

    try {
        let sqr = this[
            marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
        ].getIn([
            "bitasset",
            "current_feed",
            "maximum_short_squeeze_ratio"
        ]);
        let mcfr = this[
            marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
        ].getIn([
            "bitasset",
            "options",
            "extensions",
            "margin_call_fee_ratio"
        ]);

        marketsStore.is_prediction_market = this[
            marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
        ].getIn(["bitasset", "is_prediction_market"], false);
        marketsStore.bitasset_options = this[
            marketsStore.invertedCalls ? "baseAsset" : "quoteAsset"
        ]
            .getIn(["bitasset", "options"])
            .toJS();
        /* Prediction markets don't need feeds for shorting, so the settlement price can be set to 1:1 */
        if (
            marketsStore.is_prediction_market &&
            feedPriceRaw.getIn(["base", "asset_id"]) ===
                feedPriceRaw.getIn(["quote", "asset_id"])
        ) {
            const backingAsset = marketsStore.bitasset_options.short_backing_asset;
            if (!assets[backingAsset])
                assets[backingAsset] = {
                    precision: marketsStore.quoteAsset.get("precision")
                };
            feedPriceRaw = feedPriceRaw.setIn(["base", "amount"], 1);
            feedPriceRaw = feedPriceRaw.setIn(
                ["base", "asset_id"],
                backingAsset
            );
            feedPriceRaw = feedPriceRaw.setIn(["quote", "amount"], 1);
            feedPriceRaw = feedPriceRaw.setIn(
                ["quote", "asset_id"],
                marketsStore.quoteAsset.get("id")
            );
            sqr = 1000;
        }
        const feedPrice = new FeedPrice({
            priceObject: feedPriceRaw,
            market_base: marketsStore.quoteAsset.get("id"),
            sqr,
            mcfr,
            assets
        });

        return feedPrice;
    } catch (err) {
        console.error(
            marketsStore.activeMarket,
            "does not have a properly configured feed price"
        );
        return null;
    }
}

function _priceChart() {
    let prices = [];

    let open, high, low, close, volume;

    for (let i = 0; i < marketsStore.priceHistory.length; i++) {
        let current = marketsStore.priceHistory[i];
        if (!/Z$/.test(current.key.open)) {
            current.key.open += "Z";
        }
        let date = new Date(current.key.open);

        if (marketsStore.quoteAsset.get("id") === current.key.quote) {
            high = utils.get_asset_price(
                current.high_base,
                marketsStore.baseAsset,
                current.high_quote,
                marketsStore.quoteAsset
            );
            low = utils.get_asset_price(
                current.low_base,
                marketsStore.baseAsset,
                current.low_quote,
                marketsStore.quoteAsset
            );
            open = utils.get_asset_price(
                current.open_base,
                marketsStore.baseAsset,
                current.open_quote,
                marketsStore.quoteAsset
            );
            close = utils.get_asset_price(
                current.close_base,
                marketsStore.baseAsset,
                current.close_quote,
                marketsStore.quoteAsset
            );
            volume = utils.get_asset_amount(
                current.quote_volume,
                marketsStore.quoteAsset
            );
        } else {
            low = utils.get_asset_price(
                current.high_quote,
                marketsStore.baseAsset,
                current.high_base,
                marketsStore.quoteAsset
            );
            high = utils.get_asset_price(
                current.low_quote,
                marketsStore.baseAsset,
                current.low_base,
                marketsStore.quoteAsset
            );
            open = utils.get_asset_price(
                current.open_quote,
                marketsStore.baseAsset,
                current.open_base,
                marketsStore.quoteAsset
            );
            close = utils.get_asset_price(
                current.close_quote,
                marketsStore.baseAsset,
                current.close_base,
                marketsStore.quoteAsset
            );
            volume = utils.get_asset_amount(
                current.base_volume,
                marketsStore.quoteAsset
            );
        }

        function findMax(a, b) {
            if (a !== Infinity && b !== Infinity) {
                return Math.max(a, b);
            } else if (a === Infinity) {
                return b;
            } else {
                return a;
            }
        }

        function findMin(a, b) {
            if (a !== 0 && b !== 0) {
                return Math.min(a, b);
            } else if (a === 0) {
                return b;
            } else {
                return a;
            }
        }

        if (low === 0) {
            low = findMin(open, close);
        }

        if (isNaN(high) || high === Infinity) {
            high = findMax(open, close);
        }

        if (close === Infinity || close === 0) {
            close = open;
        }

        if (open === Infinity || open === 0) {
            open = close;
        }

        if (high > 1.3 * ((open + close) / 2)) {
            high = findMax(open, close);
        }

        if (low < 0.7 * ((open + close) / 2)) {
            low = findMin(open, close);
        }

        prices.push({time: date.getTime(), open, high, low, close, volume});
    }

    marketsStore.priceData = prices;

    _notifySubscriber("subscribeBars");
}

function _orderBook(limitsChanged = true, callsChanged = false) {
    // Loop over limit orders and return array containing bids
    let constructBids = orderArray => {
        let bids = orderArray
            .filter(a => {
                return a.isBid();
            })
            .sort((a, b) => {
                return a.getPrice() - b.getPrice();
            })
            .map(order => {
                return order;
            })
            .toArray();

        // Sum bids at same price
        if (bids.length > 1) {
            for (let i = bids.length - 2; i >= 0; i--) {
                if (bids[i].getPrice() === bids[i + 1].getPrice()) {
                    bids[i] = bids[i].sum(bids[i + 1]);
                    bids.splice(i + 1, 1);
                }
            }
        }
        return bids;
    };
    // Loop over limit orders and return array containing asks
    let constructAsks = orderArray => {
        let asks = orderArray
            .filter(a => {
                return !a.isBid();
            })
            .sort((a, b) => {
                return a.getPrice() - b.getPrice();
            })
            .map(order => {
                return order;
            })
            .toArray();

        // Sum asks at same price
        if (asks.length > 1) {
            for (let i = asks.length - 2; i >= 0; i--) {
                if (asks[i].getPrice() === asks[i + 1].getPrice()) {
                    asks[i] = asks[i].sum(asks[i + 1]);
                    asks.splice(i + 1, 1);
                }
            }
        }
        return asks;
    };

    // Assign to store variables
    if (limitsChanged) {
        if (__DEV__)
            console.time("Construct limit orders " + marketsStore.activeMarket);
        marketsStore.marketData.bids = constructBids(marketsStore.marketLimitOrders);
        marketsStore.marketData.asks = constructAsks(marketsStore.marketLimitOrders);
        if (!callsChanged) {
            _combineOrders();
        }
        if (__DEV__)
            console.timeEnd("Construct limit orders " + marketsStore.activeMarket);
    }

    if (callsChanged) {
        if (__DEV__) console.time("Construct calls " + marketsStore.activeMarket);
        marketsStore.marketData.calls = marketsStore.constructCalls(marketsStore.marketCallOrders);
        _combineOrders();
        if (__DEV__)
            console.timeEnd("Construct calls " + marketsStore.activeMarket);
    }

    // console.log("time to construct orderbook:", new Date() - orderBookStart, "ms");
}

function _groupedOrderBook(groupedOrdersBids = null, groupedOrdersAsks = null) {
    // Sum and assign to store variables
    if (groupedOrdersBids && groupedOrdersAsks) {
        if (__DEV__)
            console.time("Sum grouped orders " + marketsStore.activeMarket);

        let totalToReceive = new Asset({
            asset_id: marketsStore.quoteAsset.get("id"),
            precision: marketsStore.quoteAsset.get("precision")
        });

        let totalForSale = new Asset({
            asset_id: marketsStore.baseAsset.get("id"),
            precision: marketsStore.baseAsset.get("precision")
        });
        groupedOrdersBids
            .sort((a, b) => {
                return b.getPrice() - a.getPrice();
            })
            .forEach(a => {
                totalForSale.plus(a.amountForSale());
                totalToReceive.plus(a.amountToReceive(true));

                a.setTotalForSale(totalForSale.clone());
                a.setTotalToReceive(totalToReceive.clone());
            });

        totalToReceive = new Asset({
            asset_id: marketsStore.baseAsset.get("id"),
            precision: marketsStore.baseAsset.get("precision")
        });

        totalForSale = new Asset({
            asset_id: marketsStore.quoteAsset.get("id"),
            precision: marketsStore.quoteAsset.get("precision")
        });

        groupedOrdersAsks
            .sort((a, b) => {
                return a.getPrice() - b.getPrice();
            })
            .forEach(a => {
                totalForSale.plus(a.amountForSale());
                totalToReceive.plus(a.amountToReceive(false));
                a.setTotalForSale(totalForSale.clone());
                a.setTotalToReceive(totalToReceive.clone());
            });

        marketsStore.marketData.groupedBids = groupedOrdersBids;
        marketsStore.marketData.groupedAsks = groupedOrdersAsks;

        if (__DEV__)
            console.timeEnd("Sum grouped orders " + marketsStore.activeMarket);
    }
}

function _saveMarketStats() {
    /*
     * Only save stats once every 30s to limit writes and
     * allMarketStats JS conversions
     */
    if (!marketsStore.saveStatsTimeout) {
        marketsStore.saveStatsTimeout = setTimeout(() => {
            marketStorage.set("allMarketStats", marketsStore.allMarketStats.toJS());
            marketsStore.saveStatsTimeout = null;
        }, 1000 * 30);
    }
}

function _combineOrders() {
    const hasCalls = !!marketsStore.marketCallOrders.size;
    const isBid = hasCalls && marketsStore.marketCallOrders.first().isBid();

    let combinedBids, combinedAsks;

    if (isBid) {
        combinedBids = marketsStore.marketData.bids.concat(marketsStore.marketData.calls);
        combinedAsks = marketsStore.marketData.asks.concat([]);
    } else {
        combinedBids = marketsStore.marketData.bids.concat([]);
        combinedAsks = marketsStore.marketData.asks.concat(marketsStore.marketData.calls);
    }

    let totalToReceive = new Asset({
        asset_id: marketsStore.quoteAsset.get("id"),
        precision: marketsStore.quoteAsset.get("precision")
    });

    let totalForSale = new Asset({
        asset_id: marketsStore.baseAsset.get("id"),
        precision: marketsStore.baseAsset.get("precision")
    });
    combinedBids
        .sort((a, b) => {
            return b.getPrice() - a.getPrice();
        })
        .forEach(a => {
            totalToReceive.plus(a.amountToReceive(true));
            totalForSale.plus(a.amountForSale());

            a.setTotalForSale(totalForSale.clone());
            a.setTotalToReceive(totalToReceive.clone());
        });

    totalToReceive = new Asset({
        asset_id: marketsStore.baseAsset.get("id"),
        precision: marketsStore.baseAsset.get("precision")
    });

    totalForSale = new Asset({
        asset_id: marketsStore.quoteAsset.get("id"),
        precision: marketsStore.quoteAsset.get("precision")
    });

    combinedAsks
        .sort((a, b) => {
            return a.getPrice() - b.getPrice();
        })
        .forEach(a => {
            totalForSale.plus(a.amountForSale());
            totalToReceive.plus(a.amountToReceive(false));
            a.setTotalForSale(totalForSale.clone());
            a.setTotalToReceive(totalToReceive.clone());
        });

    marketsStore.marketData.lowestAsk = !combinedAsks.length
        ? nullPrice
        : combinedAsks[0];

    marketsStore.marketData.highestBid = !combinedBids.length
        ? nullPrice
        : combinedBids[0];

    marketsStore.marketData.combinedBids = combinedBids;
    marketsStore.marketData.combinedAsks = combinedAsks;
}

function _depthChart() {
    let bids = [],
        asks = [],
        calls = [],
        totalBids = 0,
        totalAsks = 0,
        totalCalls = 0;
    let flat_bids = [],
        flat_asks = [],
        flat_calls = [],
        flat_settles = [];

    if (marketsStore.marketLimitOrders.size) {
        marketsStore.marketData.bids.forEach(order => {
            bids.push([
                order.getPrice(),
                order.amountToReceive().getAmount({real: true})
            ]);
            totalBids += order.amountForSale().getAmount({real: true});
        });

        marketsStore.marketData.asks.forEach(order => {
            asks.push([
                order.getPrice(),
                order.amountForSale().getAmount({real: true})
            ]);
        });

        // Make sure the arrays are sorted properly
        asks.sort((a, b) => {
            return a[0] - b[0];
        });

        bids.sort((a, b) => {
            return a[0] - b[0];
        });

        // Flatten the arrays to get the step plot look
        flat_bids = market_utils.flatten_orderbookchart_highcharts(
            bids,
            true,
            true,
            1000
        );

        if (flat_bids.length > 0) {
            flat_bids.unshift([0, flat_bids[0][1]]);
        }

        flat_asks = market_utils.flatten_orderbookchart_highcharts(
            asks,
            true,
            false,
            1000
        );

        if (flat_asks.length > 0) {
            flat_asks.push([
                flat_asks[flat_asks.length - 1][0] * 1.5,
                flat_asks[flat_asks.length - 1][1]
            ]);
            totalAsks = flat_asks[flat_asks.length - 1][1];
        }
    }

    /* Flatten call orders if there any */
    if (marketsStore.marketData.calls.length) {
        let callsAsBids = marketsStore.marketData.calls[0].isBid();
        marketsStore.marketData.calls.forEach(order => {
            calls.push([
                order.getSqueezePrice(),
                order[
                    order.isBid() ? "amountToReceive" : "amountForSale"
                ]().getAmount({real: true})
            ]);
        });

        // Calculate total value of call orders
        calls.forEach(call => {
            if (marketsStore.invertedCalls) {
                totalCalls += call[1];
            } else {
                totalCalls += call[1] * call[0];
            }
        });

        if (callsAsBids) {
            totalBids += totalCalls;
        } else {
            totalAsks += totalCalls;
        }

        // Make sure the array is sorted properly
        calls.sort((a, b) => {
            return a[0] - b[0];
        });

        // Flatten the array to get the step plot look
        if (marketsStore.invertedCalls) {
            flat_calls = market_utils.flatten_orderbookchart_highcharts(
                calls,
                true,
                false,
                1000
            );
            if (
                flat_asks.length > 0 &&
                flat_calls[flat_calls.length - 1][0] <
                    flat_asks[flat_asks.length - 1][0]
            ) {
                flat_calls.push([
                    flat_asks[flat_asks.length - 1][0],
                    flat_calls[flat_calls.length - 1][1]
                ]);
            }
        } else {
            flat_calls = market_utils.flatten_orderbookchart_highcharts(
                calls,
                true,
                true,
                1000
            );
            if (flat_calls.length > 0) {
                flat_calls.unshift([0, flat_calls[0][1]]);
            }
        }
    }

    /* Flatten settle orders if there are any */
    if (marketsStore.marketSettleOrders.size) {
        flat_settles = marketsStore.marketSettleOrders.reduce((final, a) => {
            if (!final) {
                return [
                    [
                        a.getPrice(),
                        a[
                            !a.isBid() ? "amountForSale" : "amountToReceive"
                        ]().getAmount({real: true})
                    ]
                ];
            } else {
                final[0][1] =
                    final[0][1] +
                    a[
                        !a.isBid() ? "amountForSale" : "amountToReceive"
                    ]().getAmount({real: true});
                return final;
            }
        }, null);

        if (!marketsStore.feedPrice.inverted) {
            flat_settles.unshift([0, flat_settles[0][1]]);
        } else if (flat_asks.length > 0) {
            flat_settles.push([
                flat_asks[flat_asks.length - 1][0],
                flat_settles[0][1]
            ]);
        }
    }

    if (
        marketsStore.marketData.groupedBids.length > 0 &&
        marketsStore.marketData.groupedAsks.length > 0
    ) {
        bids = [];
        asks = [];
        totalBids = 0;
        totalAsks = 0;
        marketsStore.marketData.groupedBids.forEach(order => {
            bids.push([
                order.getPrice(),
                order.amountToReceive().getAmount({real: true})
            ]);
            totalBids += order.amountForSale().getAmount({real: true});
        });

        marketsStore.marketData.groupedAsks.forEach(order => {
            asks.push([
                order.getPrice(),
                order.amountForSale().getAmount({real: true})
            ]);
        });

        // Make sure the arrays are sorted properly
        asks.sort((a, b) => {
            return a[0] - b[0];
        });

        bids.sort((a, b) => {
            return a[0] - b[0];
        });

        // Flatten the arrays to get the step plot look
        flat_bids = market_utils.flatten_orderbookchart_highcharts(
            bids,
            true,
            true,
            1000
        );

        if (flat_bids.length > 0) {
            flat_bids.unshift([0, flat_bids[0][1]]);
        }

        flat_asks = market_utils.flatten_orderbookchart_highcharts(
            asks,
            true,
            false,
            1000
        );
        if (flat_asks.length > 0) {
            flat_asks.push([
                flat_asks[flat_asks.length - 1][0] * 1.5,
                flat_asks[flat_asks.length - 1][1]
            ]);
            totalAsks = flat_asks[flat_asks.length - 1][1];
        }
    }

    // Assign to store variables
    marketsStore.marketData.flatAsks = flat_asks;
    marketsStore.marketData.flatBids = flat_bids;
    marketsStore.marketData.flatCalls = flat_calls;
    marketsStore.marketData.flatSettles = flat_settles;
    marketsStore.totals = {
        bid: totalBids,
        ask: totalAsks,
        call: totalCalls
    };
    // console.log(marketsStore.totals);
}

function _calcMarketStats(base, quote, market, ticker) {
    let volumeBaseAsset = new Asset({
        real: parseFloat(ticker.base_volume),
        asset_id: base.get("id"),
        precision: base.get("precision")
    });
    let volumeQuoteAsset = new Asset({
        real: parseFloat(ticker.quote_volume),
        asset_id: quote.get("id"),
        precision: quote.get("precision")
    });

    let price;
    try {
        price = new Price({
            base: volumeBaseAsset,
            quote: volumeQuoteAsset,
            real: parseFloat(ticker.latest)
        });
    } catch (err) {}
    let close = !!price
        ? {
              base: price.base.toObject(),
              quote: price.quote.toObject()
          }
        : null;

    if (!!price && isNaN(price.toReal())) {
        price = undefined;
        close = null;
    }

    return {
        change: parseFloat(ticker.percent_change).toFixed(2),
        volumeBase: volumeBaseAsset.getAmount({real: true}),
        volumeQuote: volumeQuoteAsset.getAmount({real: true}),
        price,
        close
    };
}

function _invertMarketStats(stats, market) {
    let invertedMarketName = market.split("_")[1] + "_" + market.split("_")[0];
    return {
        invertedStats: {
            change: (
                (1 / (1 + parseFloat(stats.change) / 100) - 1) *
                100
            ).toFixed(2),
            price: stats.price ? stats.price.invert() : stats.price,
            volumeBase: stats.volumeQuote,
            volumeQuote: stats.volumeBase,
            close: stats.close
                ? {
                      base: stats.close.quote,
                      quote: stats.close.base
                  }
                : stats.close
        },
        invertedMarketName
    };
}