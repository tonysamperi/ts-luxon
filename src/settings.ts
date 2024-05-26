import { IANAZone } from "./zones/IANAZone";
import { Locale } from "./impl/locale";
import { normalizeZone } from "./impl/zoneUtil";
import { NumberingSystem, CalendarSystem, WeekSettings } from "./types/locale";
import { Zone } from "./zone";
import { SystemZone } from "./zones/systemZone";
import { ZoneLike } from "./types/zone";
import { validateWeekSettings } from "./impl/util";
import { DateTime } from "./datetime";
import { resetDigitRegexCache } from "./impl/digits";

let now = (): number => Date.now(),
    defaultZone: ZoneLike | null = "system",
    defaultLocale: string | undefined,
    defaultNumberingSystem: NumberingSystem | undefined,
    defaultOutputCalendar: CalendarSystem | undefined,
    twoDigitCutoffYear = 60,
    throwOnInvalid: boolean = !1,
    defaultWeekSettings: WeekSettings | void;

/**
 * Settings contains static getters and setters that control TsLuxon's overall behavior.
 * TsLuxon is a simple library with few options, but the ones it does have live here.
 */
export class Settings {

    /**
     * Set the default locale to create DateTimes with. Does not affect existing instances.
     */
    static set defaultLocale(locale: string | undefined) {
        defaultLocale = locale;
    }

    /**
     * Get the default locale to create DateTimes with. Does not affect existing instances.
     */
    static get defaultLocale(): string {
        return defaultLocale;
    }

    /**
     * Set the default numbering system to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    static set defaultNumberingSystem(numberingSystem: NumberingSystem | undefined) {
        defaultNumberingSystem = numberingSystem;
    }

    /**
     * Get the default numbering system to create DateTimes with. Does not affect existing instances.
     */
    static get defaultNumberingSystem(): NumberingSystem {
        return defaultNumberingSystem;
    }

    /**
     * Set the default output calendar to create DateTimes with. Does not affect existing instances.
     */
    static set defaultOutputCalendar(outputCalendar: CalendarSystem | undefined) {
        defaultOutputCalendar = outputCalendar;
    }

    /**
     * Get the default output calendar to create DateTimes with. Does not affect existing instances.
     */
    static get defaultOutputCalendar(): CalendarSystem {
        return defaultOutputCalendar;
    }

    /**
     * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
     * how many days are required in the first week of a year.
     * Does not affect existing instances.
     */
    static set defaultWeekSettings(weekSettings: WeekSettings | void) {
        defaultWeekSettings = validateWeekSettings(weekSettings);
    }

    static get defaultWeekSettings(): WeekSettings | void {
        return defaultWeekSettings;
    }

    /**
     * [TS] had to use type Zone here. I created another setter to use a ZoneLike instead
     * Let's face it. This is ugly. The original should have this approach as well.
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     * Use the value "system" to reset this value to the system's time zone.
     */
    static set defaultZone(zone: Zone) {
        defaultZone = zone;
    }

    /**
     * Get the default time zone object to create DateTimes in. Does not affect existing instances.
     */
    static get defaultZone(): Zone {
        return normalizeZone(defaultZone, SystemZone.instance);
    }

    /**
     * [TS] can't use the real setter here because set and get must have the same type.
     * Let's face this. This is bullshit. But I get that you want to make life easier for users.
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     * Use the value "system" to reset this value to the system's time zone.
     */
    static set defaultZoneLike(zone: ZoneLike) {
        defaultZone = zone;
    }

    /**
     * Set the callback for returning the current timestamp.
     * The function should return a number, which will be interpreted as an Epoch millisecond count
     * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
     * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static set now(n: () => number) {
        now = n;
    }

    /**
     * Get the callback for returning the current timestamp.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static get now(): () => number {
        return now;
    }

    /**
     * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     * @type {boolean}
     */
    static set throwOnInvalid(t) {
        throwOnInvalid = t;
    }

    /**
     * Get whether TSLuxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     */
    static get throwOnInvalid(): boolean {
        return throwOnInvalid;
    }

    /**
     * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
     * @type {number}
     * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
     * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
     * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
     * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
     * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
     */
    static set twoDigitCutoffYear(cutoffYear: number) {
        twoDigitCutoffYear = cutoffYear % 100;
    }

    /**
     * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
     * @type {number}
     */
    static get twoDigitCutoffYear(): number {
        return twoDigitCutoffYear;
    }

    // Methods

    /**
     * Reset TSLuxon's global caches. Should only be necessary in testing scenarios.
     */
    static resetCaches(): void {
        Locale.resetCache();
        IANAZone.resetCache();
        DateTime.resetCache();
        resetDigitRegexCache();
    }

}
