import SystemZone from "./zones/systemZone";
import IANAZone from "./zones/IANAZone";
import Locale from "./impl/locale";
import { normalizeZone } from "./impl/zoneUtil";
var now = function () { return Date.now(); }, defaultZone, defaultLocale, defaultNumberingSystem, defaultOutputCalendar;
/**
 * Settings contains static getters and setters that control Luxon's overall behavior. Luxon is a simple library with few options, but the ones it does have live here.
 */
var Settings = /** @class */ (function () {
    function Settings() {
    }
    Object.defineProperty(Settings, "now", {
        /**
         * Get the callback for returning the current timestamp.
         * @type {function}
         */
        get: function () {
            return now;
        },
        /**
         * Set the callback for returning the current timestamp.
         * The function should return a number, which will be interpreted as an Epoch millisecond count
         * @type {function}
         * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
         * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
         */
        set: function (n) {
            now = n;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     *
     * Use the value "system" (default) to reset this value to the system's time zone.
     *
     * zone can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3'.
     *
     * You may also supply an instance of a {@link Zone} class, or a number which will be interpreted as a UTC offset in minutes.
     * @param {Zone | string | number} [zone='system'] - the zone value
     */
    Settings.setDefaultZone = function (zone) {
        defaultZone = zone;
    };
    Object.defineProperty(Settings, "defaultZone", {
        /**
         * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
         * The default value is the system's time zone (the one set on the machine that runs this code).
         * @type {Zone}
         */
        get: function () {
            return normalizeZone(defaultZone, SystemZone.instance);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Settings, "defaultLocale", {
        /**
         * Get the default locale to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        get: function () {
            return defaultLocale;
        },
        /**
         * Set the default locale to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        set: function (locale) {
            defaultLocale = locale;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Settings, "defaultNumberingSystem", {
        /**
         * Get the default numbering system to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        get: function () {
            return defaultNumberingSystem;
        },
        /**
         * Set the default numbering system to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        set: function (numberingSystem) {
            defaultNumberingSystem = numberingSystem;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Settings, "defaultOutputCalendar", {
        /**
         * Get the default output calendar to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        get: function () {
            return defaultOutputCalendar;
        },
        /**
         * Set the default output calendar to create DateTimes with. Does not affect existing instances.
         * @type {string}
         */
        set: function (outputCalendar) {
            defaultOutputCalendar = outputCalendar;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Reset Luxon's global caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    Settings.resetCaches = function () {
        Locale.resetCache();
        IANAZone.resetCache();
    };
    return Settings;
}());
export default Settings;
//# sourceMappingURL=settings.js.map