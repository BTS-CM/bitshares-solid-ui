var normalize = (notification, level) => {
    if (typeof notification == "string") notification = {message: notification};
    if (level) notification.level = level;
    // Adjust the css position for notices.. bottom messages can't be seen
    //if(notification.level === "success" && ! notification.position)
    //    notification.position = 'br' //bottom right
    return notification;
};

function addNotification(notification) {
    notification = normalize(notification);
    return notification;
}

// Creating aliases: success, error, warning and info

function success(notification) {
    notification = normalize(notification, "success");
    return notification;
}

function error(notification) {
    notification = normalize(notification, "error");
    return notification;
}

function warning(notification) {
    notification = normalize(notification, "warning");
    return notification;
}

function info(notification) {
    notification = normalize(notification, "info");
    return notification;
}

export {
    addNotification,
    success,
    error,
    warning,
    info
};