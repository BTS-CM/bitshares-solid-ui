import { createStore } from "solid-js/store";
import IntlActions from "actions/IntlActions";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";
var locale_en = require("assets/locales/locale-en.json");
import ls from "common/localStorage";
let ss = ls("__graphene__");

counterpart.registerTranslations("en", locale_en);
counterpart.setFallbackLocale("en");

import {addLocaleData} from "react-intl";

import localeCodes from "assets/locales";
for (let localeCode of localeCodes) {
    addLocaleData(require(`react-intl/locale-data/${localeCode}`));
}

const [intlStore, setIntlStore] = createStore({
    locales: ["en"],
    localesObject: {en: locale_en},
    currentLocale: ss.get("settings_v4", {}).locale ?? "en",
    hasLocale(locale) {
        return intlStore.locales.indexOf(locale) !== -1;
    },
    getCurrentLocale() {
        return intlStore.currentLocale;
    },
    onSwitchLocale({locale, localeData}) {
        switch (locale) {
            case "en":
                counterpart.registerTranslations("en", intlStore.localesObject.en);
                break;

            default:
                counterpart.registerTranslations(locale, localeData);
                break;
        }

        counterpart.setLocale(locale);
        setIntlStore("currentLocale", locale);
    },
    onGetLocale(locale) {
        if (intlStore.locales.indexOf(locale) === -1) {
            setIntlStore("locales", [...intlStore.locales, locale]);
        }
    },
    onClearSettings() {
        intlStore.onSwitchLocale({locale: "en"});
    }
});

export const useIntlStore = () => [intlStore, setIntlStore];