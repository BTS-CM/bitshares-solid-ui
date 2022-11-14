import { createStore } from 'solid-js/store'

/*
const [accountStore, setAccountStore] = createStore({

});
*/

class ImportKeysStore extends BaseStore {
    constructor() {
        super();
        this.state = this._getInitialState();
        this._export("importing");
    }

    _getInitialState() {
        return {importing: false};
    }

    importing(importing) {
        this.setState({importing});
    }
}