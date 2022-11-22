import {Apis} from "bitsharesjs-ws";

import {useBlockchainStore} from "../stores/BlockchainStore";
const [blockchainStore, setBlockchainStore] = useBlockchainStore();

let latestBlocks = {};
let headerQueue = {};

/**
 * Get the latest block header
 * @param {String} height 
 * @returns {Object}
 */
function getHeader(height) {
    return new Promise ((resolve, reject) => {
        if (headerQueue[height]) {
            return {}
        };

        headerQueue[height] = true;

        return Apis.instance()
            .db_api()
            .exec("get_block_header", [height])
            .then(header => {
                blockchainStore.onGetHeader({
                    header: {
                        timestamp: header.timestamp,
                        witness: header.witness
                    },
                    height
                });
                return resolve({
                    header: {
                        timestamp: header.timestamp,
                        witness: header.witness
                    },
                    height
                });
            })
            .catch(error => {
                console.log(error);
                reject(error);
            }
                    
    });
}

/**
 * Get the latest block
 * @param {Number} height 
 * @param {Number} maxBlock 
 * @returns 
 */
function getLatest(height, maxBlock) {
    return new Promise ((resolve, reject) => {
        if (!latestBlocks[height] && maxBlock) {
            latestBlocks[height] = true;
            Apis.instance()
                .db_api()
                .exec("get_block", [height])
                .then(result => {
                    if (!result) {
                        return reject();
                    }
                    result.id = height; // The returned object for some reason does not include the block height..
                    blockchainStore.onGetLatest({block: result, maxBlock: maxBlock});
                    return resolve({block: result, maxBlock: maxBlock})
                })
                .catch(error => {
                    console.log(
                        "Error in BlockchainActions.getLatest: ",
                        error
                    );
                    return reject();
                });
        }
    });
}

/**
 * Get the block given a number
 * @param {Number} height 
 * @returns {Object}
 */
function getBlock(height) {
    return new Promise((resolve, reject) => {
        Apis.instance()
            .db_api()
            .exec("get_block", [height])
            .then(result => {
                if (!result) {
                    return;
                }
                result.id = height; // The returned object for some reason does not include the block height..
                blockchainStore.onGetBlock(result);
                resolve(result);
            })
            .catch(error => {
                console.log(
                    "Error in BlockchainActions.getBlock: ",
                    error
                );
                reject(error);
            });
    });
}

function updateRpcConnectionStatus(status) {
    blockchainStore.onUpdateRpcConnectionStatus(status);
    return status;
}


Apis.setRpcConnectionStatusCallback(updateRpcConnectionStatus);

export {
    getHeader,
    getLatest,
    getBlock,
    updateRpcConnectionStatus
};
