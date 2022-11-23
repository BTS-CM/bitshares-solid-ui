import Immutable from "immutable";
import { createStore } from "solid-js/store";
import {ChainStore} from "bitsharesjs";

const [blockchainStore, setBlockchainStore] = createStore({
    blocks: Immutable.Map(),
    latestBlocks: Immutable.List(),
    latestTransactions: Immutable.List(),
    rpc_connection_status: null,
    no_ws_connection: false,
    blockHeaders: new Map(),
    maxBlocks: 30,
    onGetHeader({header, height}) {
        if (header && height) {
            if (!/Z$/.test(header.timestamp)) {
                header.timestamp += "Z";
            }
            header.timestamp = new Date(header.timestamp);
            setBlockchainStore(
                "blockHeaders", 
                blockchainStore.blockHeaders.set(height, header)
            );
        } else {
            return false;
        }
    },
    onGetBlock(block) {
        if (!blockchainStore.blocks.get(block.id)) {
            if (!/Z$/.test(block.timestamp)) {
                block.timestamp += "Z";
            }
            block.timestamp = new Date(block.timestamp);
            setBlockchainStore("blocks", blockchainStore.blocks.set(block.id, block));
        }
    },
    onGetLatest(payload) {
        let {block, maxBlock} = payload;
        if (typeof block.timestamp === "string") {
            if (!/Z$/.test(block.timestamp)) {
                block.timestamp += "Z";
            }
        }
        block.timestamp = new Date(block.timestamp);
        setblockchainStore("blocks", blockchainStore.blocks.set(block.id, block));
        if (block.id > maxBlock - this.maxBlocks) {
            setblockchainStore(
                "latestBlocks",
                blockchainStore.latestBlocks.unshift(block.id)
            );
            if (blockchainStore.latestBlocks.size > blockchainStore.maxBlocks) {
                setblockchainStore("latestBlocks", blockchainStore.latestBlocks.pop());
            }

            if (block.transactions.length > 0) {
                block.transactions.forEach(trx => {
                    trx.block_num = block.id;
                    setblockchainStore(
                        "latestTransactions",
                        blockchainStore.latestTransactions.unshift(trx)
                    );
                });
            }

            if (blockchainStore.latestTransactions.size > blockchainStore.maxBlocks) {
                setblockchainStore("latestTransactions", blockchainStore.latestTransactions.pop());
            }
        }
    },
    onUpdateRpcConnectionStatus(status) {
        let prev_status = blockchainStore.rpc_connection_status;
        if (status === "reconnect") {
            ChainStore.resetCache(false);
        } else {
            setblockchainStore("rpc_connection_status", status);
        } 

        if (prev_status === null && status === "error" || status === "closed") {
            setblockchainStore("no_ws_connection", true);
        }

        if (blockchainStore.no_ws_connection && status === "open") {
            setblockchainStore("no_ws_connection", false);
        }
    }
});

export const useBlockchainStore = () => [blockchainStore, setBlockchainStore];