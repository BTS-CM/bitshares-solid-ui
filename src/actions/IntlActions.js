import localeCodes from "assets/locales";
import { useIntlStore } from "~/stores/IntlStore";
const [intlStore, setIntlStore] = useIntlStore();

import { useSettingsStore } from "~/stores/SettingsStore";
const [settingsStore, setSettingsStore] = useSettingsStore();

var locales = {};
if (__ELECTRON__) {
    localeCodes.forEach(locale => {
        locales[locale] = require(`assets/locales/locale-${locale}.json`);
    });
}

function switchLocale(locale) {
    if (locale === "en") {
        return {locale};
    }
    if (__ELECTRON__) {
        return {
            locale: locale,
            localeData: locales[locale]
        };
    } else {
        fetch(`${__BASE_URL__}locale-${locale}.json`)
            .then(reply => {
                return reply.json().then(result => {
                    intlStore.onSwitchLocale({
                        locale,
                        localeData: result
                    });
                    settingsStore.onSwitchLocale({
                        locale,
                        localeData: result
                    });
                });
            })
            .catch(err => {
                console.log("fetch locale error:", err);
                intlStore.onSwitchLocale({locale: "en"});
                settingsStore.onSwitchLocale({locale: "en"});
            });
    }
}

function getLocale(locale) {
    intlStore.onGetLocale(locale);
    return locale;
}

export {
    switchLocale,
    getLocale
};
