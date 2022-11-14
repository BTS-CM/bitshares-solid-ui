import { createStore } from 'solid-js/store'
import Immutable from "immutable";
//import AssetActions from "actions/AssetActions";

/*
this.bindListeners({
    onGetAssetList: AssetActions.getAssetList,
    onLookupAsset: AssetActions.lookupAsset,
    onGetAssetsByIssuer: AssetActions.getAssetsByIssuer
});
*/

const [assetStore, setAssetStore] = createStore({
    // contents of assetstore constructor
    assets: Immutable.Map(),
    asset_symbol_to_id: {},
    searchTerms: {},
    lookupResults: [],
    assetsLoading: false,
    onGetAssetList(payload) {
        if (!payload) {
            return false;
        }
        setAssetStore('assetsLoading', payload.loading);

        if (payload.assets) {
            payload.assets.forEach(asset => {
                for (var i = 0; i < payload.dynamic.length; i++) {
                    if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                        asset.dynamic = payload.dynamic[i];
                        break;
                    }
                }

                if (asset.bitasset_data_id) {
                    asset.market_asset = true;

                    for (var i = 0; i < payload.bitasset_data.length; i++) {
                        if (
                            payload.bitasset_data[i].id ===
                            asset.bitasset_data_id
                        ) {
                            asset.bitasset_data = payload.bitasset_data[i];
                            break;
                        }
                    }
                } else {
                    asset.market_asset = false;
                }

                setAssetStore('assets', assetStore.assets.set(asset.id, asset));
                setAssetStore(
                    'asset_symbol_to_id', 
                    {...assetStore.asset_symbol_to_id, [asset.symbol]: asset.id}
                );
            });
        }
    },
    onGetAssetsByIssuer(payload) {
        if (!payload) {
            return false;
        }
        setAssetStore('assetsLoading', payload.loading);

        if (payload.assets) {
            payload.assets.forEach(asset => {
                for (var i = 0; i < payload.dynamic.length; i++) {
                    if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                        asset.dynamic = payload.dynamic[i];
                        break;
                    }
                }

                setAssetStore(
                    'assets', 
                    assetStore.assets.set(asset.id, asset)
                );
                setAssetStore(
                    'asset_symbol_to_id',
                    {...assetStore.asset_symbol_to_id, [asset.symbol]: asset.id}
                );
            });
        }
    },
    onLookupAsset(payload) {
        setAssetStore(
            'searchTerms',
            {...assetStore.searchTerms, [payload.searchID]: payload.symbol}
        )
        setAssetStore('lookupResults', payload.assets)
    }
});

export const useAssetStore = () => [assetStore, setAssetStore];