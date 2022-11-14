import { createStore } from 'solid-js/store';
import NotificationActions from "actions/NotificationActions";

/*
const [accountStore, setAccountStore] = createStore({

});
*/

class NotificationStore {
    constructor() {
        this.bindListeners({
            addNotification: [
                NotificationActions.addNotification,
                NotificationActions.success,
                NotificationActions.warning,
                NotificationActions.error,
                NotificationActions.info
            ]
        });

        this.state = {
            notification: null
        };
    }

    addNotification(notification) {
        this.setState({notification: notification});
    }
}