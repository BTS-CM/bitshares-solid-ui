import { createStore } from 'solid-js/store';
//import * as NotificationActions from "actions/NotificationActions";

/*
    this.bindListeners({
        addNotification: [
            NotificationActions.addNotification,
            NotificationActions.success,
            NotificationActions.warning,
            NotificationActions.error,
            NotificationActions.info
        ]
    });
*/

const [notificationStore, setNotificationStore] = createStore({
    notifications: null,
    addNotification(notification) {
        setNotificationStore("notifications", notification);
    }
});

export const useNotificationStore = () => [notificationStore, setNotificationStore];
