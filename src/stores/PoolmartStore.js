import Immutable from "immutable";
import { createStore } from "solid-js/store";

const [poolmartStore, setPoolmartStore] = createStore({
    liquidityPools: Immutable.Map(),
    liquidityPoolsLoading: false,
    assets: Immutable.Map(),
    lastPoolId: null,
    onGetLiquidityPools(payload) {
        if (!payload) {
            return false;
        }
        setPoolmartStore("liquidityPoolsLoading", payload.loading);

        if (payload.liquidityPools) {
            let tmp = Immutable.Map();
            payload.liquidityPools.forEach(pool => {
                tmp = tmp.set(pool.id, pool);
            });
            if (tmp.size === 0) return;
            setPoolmartStore({
                lastPoolId: tmp.last().id,
                liquidityPools: poolmartStore.liquidityPools.merge(tmp)
            });
        }

        if (payload.reset === true) {
            setPoolmartStore("lastPoolId", null);
        }
    },
    onGetLiquidityPoolsByShareAsset(payload) {
        if (!payload) {
            return false;
        }
        setPoolmartStore("liquidityPoolsLoading", payload.loading);

        if (payload.liquidityPools) {
            let tmp = Immutable.Map();
            payload.liquidityPools.forEach(pool => {
                tmp = tmp.set(pool.id, pool);
            });
            if (tmp.size === 0) return;
            setPoolmartStore({
                lastPoolId: tmp.last().id,
                liquidityPools: poolmartStore.liquidityPools.merge(tmp)
            });
        }

        if (payload.reset === true) {
            setPoolmartStore("lastPoolId", null);
        }
    },
    onGetLiquidityPoolsAccount(payload){
        console.log("onGetLiquidityPoolsAccount");
        if (!payload) {
            return false;
        }
        setPoolmartStore("liquidityPoolsLoading", payload.loading);

        if (payload.liquidityPools) {
            let tmp = Immutable.Map();
            payload.liquidityPools.forEach(pool => {
                tmp = tmp.set(pool.id, pool);
            });
            if (tmp.size === 0) {
                return;
            }
            setPoolmartStore({
                lastPoolId: tmp.last().id,
                // liquidityPools: this.liquidityPools.merge(tmp),
                liquidityPools: tmp
            });
        }

        if (payload.reset === true) {
            setPoolmartStore("lastPoolId", null);
        }
    },
    onResetLiquidityPools() {
        setPoolmartStore("liquidityPools", Immutable.Map());
    }
});

export const usePoolmartStore = () => [poolmartStore, setPoolmartStore];