import { DateTime } from "./datetime";
import { Settings } from "./settings";
import { Locale } from "./impl/locale";
import { IANAZone } from "./zones/IANAZone";
import { Zone } from "./zone";
import { normalizeZone } from "./impl/zoneUtil";

import { hasRelative } from "./impl/util";
import { StringUnitLength, UnitLength, WeekUnitLengths } from "./types/common";
import { InfoOptions, InfoCalendarOptions, InfoUnitOptions, Features } from "./types/info";
import { ZoneLike } from "./types/zone";

/**
 * The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
 */
export class Info {

    /**
     * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
     * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
     * @param {Object} options - options
     * @param {string} [options.locale] - the locale code
     * @example Info.eras() //=> [ 'BC', 'AD' ]
     * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
     * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
     * @return {string[]}
     */
    static eras(length: StringUnitLength = "short", { locale }: InfoOptions = {}): string[] {
        return Locale.create(locale, undefined, "gregory").eras(length);
    }

    /**
     * Return the set of available features in this environment.
     * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
     * Keys:
     * * `relative`: whether this environment supports relative time formatting
     * @example Info.features() //=> { relative: false }
     * @return {Object}
     */
    static features(): Features {
        return { relative: hasRelative() };
    }

    /**
     * Return whether the specified zone contains a DST.
     * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
     * @return {boolean}
     */
    static hasDST(zone: ZoneLike = Settings.defaultZone): boolean {
        const proto = DateTime.now().setZone(zone).set({ month: 12 });

        return !(zone as Zone).isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
    }

    /**
     * Return whether the specified zone is a valid IANA specifier.
     * @param {string} zone - Zone to check
     * @return {boolean}
     */
    static isValidIANAZone(zone: string): boolean {
        return IANAZone.isValidZone(zone);
    }

    /**
     * Return an array of meridiems.
     * @param {Object} options - options
     * @param {string} [options.locale] - the locale code
     * @example Info.meridiems() //=> [ 'AM', 'PM' ]
     * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
     * @return {string[]}
     */
    static meridiems({ locale }: InfoOptions = {}): string[] {
        return Locale.create(locale).meridiems();
    }

    /**
     * Return an array of standalone month names.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
     * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
     * @param {Object} opts - options
     * @param {string} [opts.locale] - the locale code
     * @param {string} [opts.numberingSystem] - the numbering system
     * @param {string} [opts.locObj=null] - an existing locale object to use
     * @param {string} [opts.outputCalendar='gregory'] - the calendar
     * @example Info.months()[0] //=> 'January'
     * @example Info.months('short')[0] //=> 'Jan'
     * @example Info.months('numeric')[0] //=> '1'
     * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
     * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
     * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
     * @return {string[]}
     */
    static months(length: UnitLength = "long", {
        locale = null,
        locObj = null,
        numberingSystem = null,
        outputCalendar = "gregory"
    }: InfoCalendarOptions = {}): string[] {
        return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
    }

    /**
     * Return an array of format month names.
     * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
     * changes the string.
     * See {@link Info.months}
     * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
     * @param {Object} opts - options
     * @param {string} [opts.locObj] - an existing locale object to use
     * @param {string} [opts.locale] - the locale code
     * @param {string} [opts.numberingSystem] - the numbering system
     * @param {string} [opts.outputCalendar='gregory'] - the calendar
     * @return {string[]}
     */
    static monthsFormat(length: UnitLength = "long", {
        locale,
        locObj,
        numberingSystem,
        outputCalendar = "gregory"
    }: InfoCalendarOptions = {}): string[] {
        return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
    }

    /**
     * Converts the input into a {@link Zone} instance.
     *
     * * If `input` is already a Zone instance, it is returned unchanged.
     * * If `input` is a string containing a valid IANA time zone name, a Zone instance
     *   with that name is returned.
     * * If `input` is the string "system", the system's time zone is returned.
     * * If `input` is the string "default", the default time zone, as defined in
     *   Settings.defaultZone is returned.
     * * If `input` is a string that doesn't refer to a known time zone, a Zone
     *   instance with {@link Zone#isValid} == false is returned.
     * * If `input is a number, a Zone instance with the specified fixed offset
     *   in minutes is returned.
     * * If `input` is `null` or `undefined`, the default zone is returned.
     * @param {string|Zone|number} [input] - the value to be converted
     * @return {Zone}
     */
    static normalizeZone(input?: ZoneLike): Zone {
        return normalizeZone(input, Settings.defaultZone);
    }

    /**
     * Return an array of standalone week names.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
     * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
     * @param {Object} opts - options
     * @param {string} [opts.locale] - the locale code
     * @param {string} [opts.locObj] - an existing locale object to use
     * @param {string} [opts.numberingSystem] - the numbering system
     * @example Info.weekdays()[0] //=> 'Monday'
     * @example Info.weekdays('short')[0] //=> 'Mon'
     * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
     * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
     * @return {string[]}
     */
    static weekdays(length: WeekUnitLengths = "long", { locale, locObj, numberingSystem }: InfoUnitOptions = {}): string[] {
        return (locObj || Locale.create(locale, numberingSystem)).weekdays(length);
    }

    /**
     * Return an array of format week names.
     * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
     * changes the string.
     * See {@link Info#weekdays}
     * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
     * @param {Object} options - options
     * @param {string} [options.locale] - the locale code
     * @param {string} [options.numberingSystem] - the numbering system
     * @return {string[]}
     */
    static weekdaysFormat(length: StringUnitLength = "long", {
        locale,
        locObj,
        numberingSystem
    }: InfoUnitOptions = {}): string[] {
        return (locObj || Locale.create(locale, numberingSystem)).weekdays(length, true);
    }

}
