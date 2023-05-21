import { IANAZone } from "./zones/IANAZone";
import { Locale } from "./impl/locale";
import { normalizeZone } from "./impl/zoneUtil";
import { NumberingSystem, CalendarSystem } from "./types/locale";
import { Zone } from "./zone";
import { SystemZone } from "./zones/systemZone";
import { ZoneLike } from "./types/zone";

let now = () => Date.now(),
    defaultZone: ZoneLike | null = "system",
    defaultLocale: string | undefined,
    defaultNumberingSystem: NumberingSystem | undefined,
    defaultOutputCalendar: CalendarSystem | undefined,
    twoDigitCutoffYear = 60,
    throwOnInvalid: boolean = !1;

/**
 * Settings contains static getters and setters that control TsLuxon's overall behavior.
 * TsLuxon is a simple library with few options, but the ones it does have live here.
 */
export class Settings {
    /**
     * Get the callback for returning the current timestamp.
     * @type {function}
     */
    static get now() {
        return now;
    }

    /**
     * Set the callback for returning the current timestamp.
     * The function should return a number, which will be interpreted as an Epoch millisecond count
     * @type {function}
     * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
     * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
     */
    static set now(n) {
        now = n;
    }

    /**
     * [TS] can't use the real setter here because set and get must have the same type.
     * Let's face this. This is bullshit. But I get that you want to make life easier for users.
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     * Use the value "system" to reset this value to the system's time zone.
     * @type {string}
     */
    static set defaultZoneLike(zone: ZoneLike) {
        defaultZone = zone;
    }

    /**
     * [TS] had to use type Zone here. I created another setter to use a ZoneLike instead
     * Let's face it. This is ugly. The original should have this approach as well.
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     * Use the value "system" to reset this value to the system's time zone.
     * @type {string}
     */
    static set defaultZone(zone: Zone) {
        defaultZone = zone;
    }

    /**
     * Get the default time zone object to create DateTimes in. Does not affect existing instances.
     * @type {Zone}
     */
    static get defaultZone(): Zone {
        return normalizeZone(defaultZone, SystemZone.instance);
    }

    /**
     * Get the default locale to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static get defaultLocale() {
        return defaultLocale;
    }

    /**
     * Set the default locale to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static set defaultLocale(locale: string | undefined) {
        defaultLocale = locale;
    }

    /**
     * Get the default numbering system to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static get defaultNumberingSystem() {
        return defaultNumberingSystem;
    }

    /**
     * Set the default numbering system to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static set defaultNumberingSystem(numberingSystem: NumberingSystem | undefined) {
        defaultNumberingSystem = numberingSystem;
    }

    /**
     * Get the default output calendar to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static get defaultOutputCalendar() {
        return defaultOutputCalendar;
    }

    /**
     * Set the default output calendar to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static set defaultOutputCalendar(outputCalendar: CalendarSystem | undefined) {
        defaultOutputCalendar = outputCalendar;
    }

    /**
     * Get the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
     * @type {number}
     */
    static get twoDigitCutoffYear() {
        return twoDigitCutoffYear;
    }

    /**
     * Set the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
     * @example Settings.twoDigitCutoffYear = 0 // cut-off year is 0, so all 'yy' are interpreted as current century
     * @example Settings.twoDigitCutoffYear = 50 // '49' -> 1949; '50' -> 2050
     * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
     * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
     */
    static set twoDigitCutoffYear(cutoffYear: number) {
        twoDigitCutoffYear = cutoffYear % 100;
    }

    /**
     * Get whether TSLuxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     * @type {boolean}
     */
    static get throwOnInvalid() {
        return throwOnInvalid;
    }

    /**
     * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     * @type {boolean}
     */
    static set throwOnInvalid(t) {
        throwOnInvalid = t;
    }

    // Methods

    /**
     * Reset TSLuxon's global caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    static resetCaches() {
        Locale.resetCache();
        IANAZone.resetCache();
    }

}
