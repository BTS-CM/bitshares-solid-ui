import { createStore } from "solid-js/store";

const [notificationStore, setNotificationStore] = createStore({
    notifications: null,
    addNotification(notification) {
        setNotificationStore("notifications", notification);
    }
});

export const useNotificationStore = () => [notificationStore, setNotificationStore];
