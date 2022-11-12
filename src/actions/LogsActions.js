import ls from "common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = ls(STORAGE_KEY);

async function setLog(log) {
    return await ss.set("logs", JSON.stringify(log));
}

function getLogs() {
    return new Promise(resolve => {
        try {
            resolve(JSON.parse(ss.get("logs", [])));
        } catch (err) {
            resolve(["Error loading logs from localStorage"]);
        }
    });
}

export {
    setLog,
    getLogs
};
