// description of the BaseStore class: 
// 
// BaseStore is a base class for all stores. It provides some convenience
// methods to ease the implementation of stores, such as:
// 
// * automatic binding of store methods to the store instance
// * automatic exporting of store methods
// * automatic exporting of store properties
// * automatic exporting of store state
// * automatic exporting of store getters
// * automatic exporting of store listeners
// * automatic exporting of store actions
// 
// Stores can extend this class to get all of these features.

class BaseStore {
    constructor() {}

    _export(...methods) {
        let publicMethods = {};
        methods.forEach(method => {
            if (!this[method])
                throw new Error(
                    `BaseStore._export: method '${method}' not found in ${
                        this.__proto__._storeName
                    }`
                );
            this[method] = this[method].bind(this);
            publicMethods[method] = this[method];
        });
        this.exportPublicMethods(publicMethods);
    }
}

export default BaseStore;
