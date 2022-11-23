import { useNotificationStore } from "~/stores/NotificationStore";
const [notificationStore, setNotificationStore] = useNotificationStore();

var normalize = (notification, level) => {
    if (typeof notification == "string") {
        notification = {message: notification};
    }
    if (level) {
        notification.level = level;
    }
    // Adjust the css position for notices.. bottom messages can't be seen
    //if(notification.level === "success" && ! notification.position)
    //    notification.position = 'br' //bottom right
    return notification;
};

function addNotification(notification) {
    notification = normalize(notification);
    notificationStore.addNotification(notification);
    return notification;
}

// Creating aliases: success, error, warning and info

function success(notification) {
    notification = normalize(notification, "success");
    notificationStore.addNotification(notification);
    return notification;
}

function error(notification) {
    notification = normalize(notification, "error");
    notificationStore.addNotification(notification);
    return notification;
}

function warning(notification) {
    notification = normalize(notification, "warning");
    notificationStore.addNotification(notification);
    return notification;
}

function info(notification) {
    notification = normalize(notification, "info");
    notificationStore.addNotification(notification);
    return notification;
}

export {
    addNotification,
    success,
    error,
    warning,
    info
};