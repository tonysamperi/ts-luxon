import Duration, { DurationLike } from "./duration";
import Interval from "./interval";
import Zone from "./zone";
import { DateTimeOptions, ToISOTimeOptions, ToISOFormat, ToSQLOptions, ToRelativeOptions, ToRelativeCalendarOptions, SetZoneOptions, GregorianDateTime, GenericDateTime, DateTimeWithZoneOptions } from "./types/datetime";
import { DurationUnit, DurationOptions } from "./types/duration";
import { LocaleOptions, NumberingSystem, CalendarSystem } from "./types/locale";
import { ThrowOnInvalid } from "./types/common";
import { ZoneLike } from "./types/zone";
/**
 * A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
 *
 * A DateTime comprises of:
 * * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
 * * A time zone. Each instance is considered in the context of a specific zone (by default the system's time zone).
 * * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
 *
 * Here is a brief overview of the most commonly used functionality it provides:
 *
 * * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link DateTime.local}, {@link DateTime.utc}, and (most flexibly) {@link DateTime.fromObject}. To create one from a standard string format, use {@link DateTime.fromISO}, {@link DateTime.fromHTTP}, and {@link DateTime.fromRFC2822}. To create one from a custom string format, use {@link DateTime.fromFormat}. To create one from a native JS date, use {@link DateTime.fromJSDate}.
 * * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e as opposed to collectively through {@link DateTime#toObject}), use the {@link DateTime#year}, {@link DateTime#month},
 * {@link DateTime#day}, {@link DateTime#hour}, {@link DateTime#minute}, {@link DateTime#second}, {@link DateTime#millisecond} accessors.
 * * **Week calendar**: For ISO week calendar attributes, see the {@link DateTime#weekYear}, {@link DateTime#weekNumber}, and {@link DateTime#weekday} accessors.
 * * **Configuration** See the {@link DateTime#locale} and {@link DateTime#numberingSystem} accessors.
 * * **Transformation**: To transform the DateTime into other DateTimes, use {@link DateTime#set}, {@link DateTime#reconfigure}, {@link DateTime#setZone}, {@link DateTime#setLocale}, {@link DateTime#plus}, {@link DateTime#minus}, {@link DateTime#endOf}, {@link DateTime#startOf}, {@link DateTime#toUTC}, and {@link DateTime#toSystemZone}.
 * * **Output**: To convert the DateTime to other representations, use the {@link DateTime#toRelative}, {@link DateTime#toRelativeCalendar}, {@link DateTime#toJSON}, {@link DateTime#toISO}, {@link DateTime#toHTTP}, {@link DateTime#toObject}, {@link DateTime#toRFC2822}, {@link DateTime#toString}, {@link DateTime#toLocaleString}, {@link DateTime#toFormat}, {@link DateTime#toMillis} and {@link DateTime#toJSDate}.
 *
 * There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
 */
export default class DateTime {
    private readonly ts;
    private _zone;
    private loc;
    private weekData;
    private c;
    private readonly o;
    private readonly isLuxonDateTime;
    /**
     * @access private
     */
    private constructor();
    /**
     * Create a DateTime for the current instant, in the system's time zone.
     *
     * Use Settings to override these default values if needed.
     * @example DateTime.now().toISO() //~> now in the ISO format
     * @return {DateTime}
     */
    static now(): DateTime;
    static local(...args: number[]): DateTime;
    static local(...args: (number | (DateTimeOptions & ThrowOnInvalid))[]): DateTime;
    static local(...args: (number | DateTimeOptions)[]): DateTime | null;
    static utc(...args: number[]): DateTime;
    static utc(...args: (number | (DateTimeOptions & ThrowOnInvalid))[]): DateTime;
    static utc(...args: (number | DateTimeOptions)[]): DateTime | null;
    static fromJSDate(date: Date): DateTime;
    static fromJSDate(date: Date, options: DateTimeOptions & ThrowOnInvalid): DateTime;
    static fromJSDate(date: Date, options: DateTimeOptions): DateTime | null;
    static fromMillis(milliseconds: number): DateTime;
    static fromMillis(milliseconds: number, options: DateTimeOptions & ThrowOnInvalid): DateTime;
    static fromMillis(milliseconds: number, options: DateTimeOptions): DateTime | null;
    static fromSeconds(seconds: number): DateTime;
    static fromSeconds(seconds: number, options: DateTimeOptions & ThrowOnInvalid): DateTime;
    static fromSeconds(seconds: number, options: DateTimeOptions): DateTime | null;
    static fromObject(object?: GenericDateTime): DateTime;
    static fromObject(object: GenericDateTime, options: DateTimeOptions & ThrowOnInvalid): DateTime;
    static fromObject(object: GenericDateTime, options: DateTimeOptions): DateTime | null;
    static fromISO(text: string): DateTime;
    static fromISO(text: string, options: DateTimeWithZoneOptions & ThrowOnInvalid): DateTime;
    static fromISO(text: string, options: DateTimeWithZoneOptions): DateTime | null;
    static fromRFC2822(text: string): DateTime;
    static fromRFC2822(text: string, options: DateTimeWithZoneOptions & ThrowOnInvalid): DateTime;
    static fromRFC2822(text: string, options: DateTimeWithZoneOptions): DateTime | null;
    static fromHTTP(text: string): DateTime;
    static fromHTTP(text: string, options: DateTimeWithZoneOptions & ThrowOnInvalid): DateTime;
    static fromHTTP(text: string, options: DateTimeWithZoneOptions): DateTime | null;
    static fromFormat(text: string, format: string): DateTime;
    static fromFormat(text: string, format: string, options: DateTimeWithZoneOptions & ThrowOnInvalid): DateTime;
    static fromFormat(text: string, format: string, options: DateTimeWithZoneOptions): DateTime | null;
    static fromSQL(text: string): DateTime;
    static fromSQL(text: string, options: DateTimeWithZoneOptions & ThrowOnInvalid): DateTime;
    static fromSQL(text: string, options: DateTimeWithZoneOptions): DateTime | null;
    /**
     * Check if an object is a DateTime. Works across context boundaries
     * @param {Object} o
     * @return {boolean}
     */
    static isDateTime(o: unknown): o is DateTime;
    /**
     * Get the value of unit.
     * @param {string} unit - a unit such as 'minute' or 'day'
     * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
     * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
     * @return {number}
     */
    get(unit: keyof GenericDateTime): number;
    /**
     * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
     *
     * @type {string}
     */
    get locale(): string;
    /**
     * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
     *
     * @type {string}
     */
    get numberingSystem(): "arab" | "arabext" | "bali" | "beng" | "deva" | "fullwide" | "gujr" | "hanidec" | "khmr" | "knda" | "laoo" | "latn" | "limb" | "mlym" | "mong" | "mymr" | "orya" | "tamldec" | "telu" | "thai" | "tibt" | undefined;
    /**
     * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
     *
     * @type {string}
     */
    get outputCalendar(): "buddhist" | "chinese" | "coptic" | "ethioaa" | "ethiopic" | "gregory" | "hebrew" | "indian" | "islamic" | "islamicc" | "iso8601" | "japanese" | "persian" | "roc" | undefined;
    /**
     * Get the time zone associated with this DateTime.
     * @type {Zone}
     */
    get zone(): Readonly<Zone>;
    /**
     * Get the name of the time zone.
     * @type {string}
     */
    get zoneName(): string;
    /**
     * Get the year
     * @example DateTime.local(2017, 5, 25).year //=> 2017
     * @type {number}
     */
    get year(): number;
    /**
     * Get the quarter
     * @example DateTime.local(2017, 5, 25).quarter //=> 2
     * @type {number}
     */
    get quarter(): number;
    /**
     * Get the month (1-12).
     * @example DateTime.local(2017, 5, 25).month //=> 5
     * @type {number}
     */
    get month(): number;
    /**
     * Get the day of the month (1-30ish).
     * @example DateTime.local(2017, 5, 25).day //=> 25
     * @type {number}
     */
    get day(): number;
    /**
     * Get the hour of the day (0-23).
     * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
     * @type {number}
     */
    get hour(): number;
    /**
     * Get the minute of the hour (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
     * @type {number}
     */
    get minute(): number;
    /**
     * Get the second of the minute (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
     * @type {number}
     */
    get second(): number;
    /**
     * Get the millisecond of the second (0-999).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
     * @type {number}
     */
    get millisecond(): number;
    /**
     * Get the week year
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 11, 31).weekYear //=> 2015
     * @type {number}
     */
    get weekYear(): number;
    /**
     * Get the week number of the week year (1-52ish).
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
     * @type {number}
     */
    get weekNumber(): number;
    /**
     * Get the day of the week.
     * 1 is Monday and 7 is Sunday
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 11, 31).weekday //=> 4
     * @type {number}
     */
    get weekday(): number;
    /**
     * Get the ordinal (meaning the day of the year)
     * @example DateTime.local(2017, 5, 25).ordinal //=> 145
     * @type {number}
     */
    get ordinal(): number;
    /**
     * Get the human readable short month name, such as 'Oct'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
     * @type {string}
     */
    get monthShort(): string;
    /**
     * Get the human readable long month name, such as 'October'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthLong //=> October
     * @type {string}
     */
    get monthLong(): string;
    /**
     * Get the human readable short weekday, such as 'Mon'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
     * @type {string}
     */
    get weekdayShort(): string;
    /**
     * Get the human readable long weekday, such as 'Monday'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
     * @type {string}
     */
    get weekdayLong(): string;
    /**
     * Get the UTC offset of this DateTime in minutes
     * @example DateTime.now().offset //=> -240
     * @example DateTime.utc().offset //=> 0
     * @type {number}
     */
    get offset(): number;
    /**
     * Get the short human name for the zone's current offset, for example "EST" or "EDT".
     * Defaults to the system's locale if no locale has been specified
     * @type {string}
     */
    get offsetNameShort(): string | null;
    /**
     * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
     * Defaults to the system's locale if no locale has been specified
     * @type {string}
     */
    get offsetNameLong(): string | null;
    /**
     * Get whether this zone's offset ever changes, as in a DST.
     * @type {boolean}
     */
    get isOffsetFixed(): boolean;
    /**
     * Get whether the DateTime is in a DST.
     * @type {boolean}
     */
    get isInDST(): boolean;
    /**
     * Returns true if this DateTime is in a leap year, false otherwise
     * @example DateTime.local(2016).isInLeapYear //=> true
     * @example DateTime.local(2013).isInLeapYear //=> false
     * @type {boolean}
     */
    get isInLeapYear(): boolean;
    /**
     * Returns the number of days in this DateTime's month
     * @example DateTime.local(2016, 2).daysInMonth //=> 29
     * @example DateTime.local(2016, 3).daysInMonth //=> 31
     * @type {number}
     */
    get daysInMonth(): number;
    /**
     * Returns the number of days in this DateTime's year
     * @example DateTime.local(2016).daysInYear //=> 366
     * @example DateTime.local(2013).daysInYear //=> 365
     * @type {number}
     */
    get daysInYear(): 366 | 365;
    /**
     * Returns the number of weeks in this DateTime's year
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2004).weeksInWeekYear //=> 53
     * @example DateTime.local(2013).weeksInWeekYear //=> 52
     * @type {number}
     */
    get weeksInWeekYear(): 53 | 52;
    /**
     * Returns the resolved Intl options for this DateTime.
     * This is useful in understanding the behavior of formatting methods
     * @return {Object}
     */
    resolvedLocaleOptions(): {
        locale: string;
        numberingSystem: NumberingSystem;
        outputCalendar: CalendarSystem;
    };
    /**
     * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
     *
     * Equivalent to {@link DateTime#setZone}('utc')
     * @param {number} [offset=0] - optionally, an offset from UTC in minutes
     * @param {Object} [options={}] - options to pass to `setZone()`
     * @return {DateTime}
     */
    toUTC(offset?: number, options?: SetZoneOptions): DateTime;
    /**
     * "Set" the DateTime's zone to the system's time zone. Returns a newly-constructed DateTime.
     * The system time zone is the one set on the machine where this code gets executed.
     *
     * Equivalent to `setZone("system")`
     * @return {DateTime}
     */
    toSystemZone(): DateTime;
    /**
     * "Set" the DateTime's zone to the default zone. Returns a newly-constructed DateTime.
     * The default time zone is used when creating new DateTimes, unless otherwise specified.
     * It defaults to the system's time zone, but can be overriden in `Settings`.
     *
     * Equivalent to `setZone("default")`
     * @return {DateTime}
     */
    toDefaultZone(): DateTime;
    /**
     * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
     *
     * By default, the setter keeps the underlying instant the same (as in, the same timestamp), but the new instance will report different local time and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toSystemZone} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
     * @param {string|Zone} [zone='default'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'default', 'system' or 'utc'. You may also supply an instance of a {@link Zone} class.
     * @param {Object} options - options
     * @param {boolean} [options.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
     * @return {DateTime}
     */
    setZone(zone: ZoneLike, { keepLocalTime }?: SetZoneOptions): DateTime;
    /**
     * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
     * @param {Object} [options] - the options to set
     * @param {string} [options.locale] - ;
     * @param {CalendarSystem} [options.outputCalendar] - ;
     * @param {NumberingSystem} [options.numberingSystem] - ;
     * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
     * @return {DateTime}
     */
    reconfigure(options: LocaleOptions): DateTime;
    /**
     * "Set" the locale. Returns a newly-constructed DateTime.
     * Just a convenient alias for reconfigure({ locale })
     * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
     * @return {DateTime}
     */
    setLocale(locale: string): DateTime;
    /**
     * "Set" the values of specified units. Returns a newly-constructed DateTime.
     * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
     * @param {Object} values - a mapping of units to numbers
     * @example dt.set({ year: 2017 })
     * @example dt.set({ hour: 8, minute: 30 })
     * @example dt.set({ weekday: 5 })
     * @example dt.set({ year: 2005, ordinal: 234 })
     * @return {DateTime}
     */
    set(values: GenericDateTime): DateTime;
    /**
     * Add a period of time to this DateTime and return the resulting DateTime
     *
     * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
     * @param {Duration|Object} duration - The amount to add. Either a Luxon Duration or the object argument to Duration.fromObject()
     * @example DateTime.now().plus(123) //~> in 123 milliseconds
     * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
     * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
     * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
     * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
     * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
     * @return {DateTime}
     */
    plus(duration: DurationLike): DateTime;
    /**
     * Subtract a period of time to this DateTime and return the resulting DateTime
     * See {@link DateTime#plus}
     * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
     @return {DateTime}
    */
    minus(duration: DurationLike): DateTime;
    /**
     * "Set" this DateTime to the beginning of a unit of time.
     * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
     * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
     * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('week').toISOTime(); //=> '2014-03-03', weeks always start on a Monday
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
     * @return {DateTime}
     */
    startOf(unit: DurationUnit): DateTime;
    /**
     * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
     * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
     * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
     * @return {DateTime}
     */
    endOf(unit: DurationUnit): DateTime;
    /**
     * Returns a string representation of this DateTime formatted according to the specified format string.
     * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens).
     * Defaults to en-US if no locale has been specified, regardless of the system's locale.
     * @see https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens
     * @param {string} format - the format string
     * @param {Object} options - overriden configuration options
     * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
     * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
     * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
     * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
     * @return {string}
     */
    toFormat(format: string, options?: LocaleOptions): string;
    /**
     * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
     * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
     * of the DateTime in the assigned locale.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
     * @param options {Object} - Intl.DateTimeFormat constructor options and configuration options
     * @example DateTime.now().toLocaleString(); //=> 4/20/2017
     * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
     * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
     * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
     * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
     * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
     * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
     * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hour12: false }); //=> '21:32'
     * @return {string}
     */
    toLocaleString(options?: Intl.DateTimeFormatOptions): string;
    /**
     * Returns an array of format "parts", meaning individual tokens along with metadata. This allows callers to post-process individual sections of the formatted output.
     * Defaults to the system's locale if no locale has been specified
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
     * @param options {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
     * @example DateTime.now().toLocaleParts(); //=> [
     *                                   //=>   { type: 'day', value: '25' },
     *                                   //=>   { type: 'literal', value: '/' },
     *                                   //=>   { type: 'month', value: '05' },
     *                                   //=>   { type: 'literal', value: '/' },
     *                                   //=>   { type: 'year', value: '1982' }
     *                                   //=> ]
     */
    toLocaleParts(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormatPart[];
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime
     * @param {Object} options - options
     * @param {boolean} [options.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
     * @param {boolean} [options.suppressSeconds=false] - exclude seconds from the format if they're 0
     * @param {boolean} [options.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {string} [options.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc(1982, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
     * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
     * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
     * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
     * @return {string}
     */
    toISO(options?: ToISOTimeOptions): string;
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's date component
     * @param {Object} options - options
     * @param {string} [options.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
     * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
     * @return {string}
     */
    toISODate(options?: {
        format?: ToISOFormat;
    }): string;
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's week date
     * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
     * @return {string}
     */
    toISOWeekDate(): string;
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's time component
     * @param {Object} options - options
     * @param {boolean} [options.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
     * @param {boolean} [options.suppressSeconds=false] - exclude seconds from the format if they're 0
     * @param {boolean} [options.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {string} [options.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
     * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
     * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
     * @return {string}
     */
    toISOTime({ suppressMilliseconds, suppressSeconds, includeOffset, format }?: ToISOTimeOptions): string;
    /**
     * Returns an RFC 2822-compatible string representation of this DateTime, always in UTC
     * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
     * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
     * @return {string}
     */
    toRFC2822(): string;
    /**
     * Returns a string representation of this DateTime appropriate for use in HTTP headers.
     * Specifically, the string conforms to RFC 1123.
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
     * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
     * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
     * @return {string}
     */
    toHTTP(): string;
    /**
     * Returns a string representation of this DateTime appropriate for use in SQL Date
     * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
     * @return {string}
     */
    toSQLDate(): string;
    /**
     * Returns a string representation of this DateTime appropriate for use in SQL Time
     * @param {Object} options - options
     * @param {boolean} [options.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
     * @param {boolean} [options.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @example DateTime.utc().toSQL() //=> '05:15:16.345'
     * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
     * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
     * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
     * @return {string}
     */
    toSQLTime({ includeOffset, includeZone }?: ToSQLOptions): string;
    /**
     * Returns a string representation of this DateTime appropriate for use in SQL DateTime
     * @param {Object} options - options
     * @param {boolean} [options.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
     * @param {boolean} [options.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
     * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
     * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
     * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
     * @return {string}
     */
    toSQL(options?: ToSQLOptions): string;
    /**
     * Returns a string representation of this DateTime appropriate for debugging
     * @return {string}
     */
    toString(): string;
    /**
     * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
     * @return {number}
     */
    valueOf(): number;
    /**
     * Returns the epoch milliseconds of this DateTime.
     * @return {number}
     */
    toMillis(): number;
    /**
     * Returns the epoch seconds of this DateTime.
     * @return {number}
     */
    toSeconds(): number;
    /**
     * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
     * @return {string}
     */
    toJSON(): string;
    /**
     * Returns a BSON serializable equivalent to this DateTime.
     * @return {Date}
     */
    toBSON(): Date;
    /**
     * Returns a Javascript object with this DateTime's year, month, day, and so on.
     * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
     * @return {Object}
     */
    toObject(): GregorianDateTime;
    /**
     * Returns a Javascript Date equivalent to this DateTime.
     * @return {Date}
     */
    toJSDate(): Date;
    diff(other: DateTime, unit?: DurationUnit | DurationUnit[]): Duration;
    diff(other: DateTime, unit: DurationUnit | DurationUnit[], options: DurationOptions & ThrowOnInvalid): Duration;
    diff(other: DateTime, unit: DurationUnit | DurationUnit[], options: DurationOptions): Duration | null;
    diffNow(unit?: DurationUnit | DurationUnit[]): Duration;
    diffNow(unit: DurationUnit | DurationUnit[], options: DurationOptions & ThrowOnInvalid): Duration;
    diffNow(unit: DurationUnit | DurationUnit[], options: DurationOptions): Duration | null;
    /**
     * Return an Interval spanning between this DateTime and another DateTime
     * @param {DateTime} other - the other end point of the Interval
     * @return {Interval}
     */
    until(other: DateTime): Interval;
    /**
     * Return whether this DateTime is in the same unit of time as another DateTime
     * @param {DateTime} other - the other DateTime
     * @param {string} unit - the unit of time to check sameness on
     * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if both have the same calendar day
     * @return {boolean}
     */
    hasSame(other: DateTime, unit: DurationUnit): boolean;
    /**
     * Equality check
     * Two DateTimes are equal iff they represent the same millisecond and have the same zone and location.
     * To compare just the millisecond values, use `+dt1 === +dt2`.
     * @param {DateTime} other - the other DateTime
     * @return {boolean}
     */
    equals(other: DateTime): boolean;
    /**
     * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
     * platform supports Intl.RelativeTimeFormat. Rounds down by default.
     * @param {Object} options - options that affect the output
     * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
     * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
     * @param {string} [options.unit] - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
     * @param {boolean} [options.round=true] - whether to round the numbers in the output.
     * @param {boolean} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
     * @param {string} [options.locale] - override the locale of this DateTime
     * @param {string} [options.numberingSystem] - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
     * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
     * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
     * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
     * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
     * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
     * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
     */
    toRelative(options?: ToRelativeOptions): string;
    /**
     * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
     * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
     * @param {Object} options - options that affect the output
     * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
     * @param {string} [options.locale] - override the locale of this DateTime
     * @param {string} [options.unit] - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
     * @param {string} [options.numberingSystem] - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
     * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
     * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
     * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
     * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
     */
    toRelativeCalendar(options?: ToRelativeCalendarOptions): string;
    static min(): undefined;
    static min(...dateTimes: DateTime[]): DateTime;
    static max(): undefined;
    static max(...dateTimes: DateTime[]): DateTime;
    /**
     * Explain how a string would be parsed by fromFormat()
     * @param {string} text - the string to parse
     * @param {string} format - the format the string is expected to be in (see description)
     * @param {Object} options - options taken by fromFormat()
     * @return {Object}
     */
    static fromFormatExplain(text: string, format: string, options?: DateTimeOptions): import("./types/datetime").ExplainedFormat;
    /**
     * {@link DateTime#toLocaleString} format like 10/14/1983
     * @type {Object}
     */
    static get DATE_SHORT(): {
        year: string;
        month: string;
        day: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
     * @type {Object}
     */
    static get DATE_MED(): {
        year: string;
        month: string;
        day: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
     * @type {Object}
     */
    static get DATE_MED_WITH_WEEKDAY(): {
        year: string;
        month: string;
        day: string;
        weekday: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983'
     * @type {Object}
     */
    static get DATE_FULL(): {
        year: string;
        month: string;
        day: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
     * @type {Object}
     */
    static get DATE_HUGE(): {
        year: string;
        month: string;
        day: string;
        weekday: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get TIME_SIMPLE(): {
        hour: string;
        minute: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get TIME_WITH_SECONDS(): {
        hour: string;
        minute: string;
        second: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get TIME_WITH_SHORT_OFFSET(): {
        hour: string;
        minute: string;
        second: string;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get TIME_WITH_LONG_OFFSET(): {
        hour: string;
        minute: string;
        second: string;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
     * @type {Object}
     */
    static get TIME_24_SIMPLE(): {
        hour: string;
        minute: string;
        hour12: boolean;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
     * @type {Object}
     */
    static get TIME_24_WITH_SECONDS(): {
        hour: string;
        minute: string;
        second: string;
        hour12: boolean;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
     * @type {Object}
     */
    static get TIME_24_WITH_SHORT_OFFSET(): {
        hour: string;
        minute: string;
        second: string;
        hour12: boolean;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
     * @type {Object}
     */
    static get TIME_24_WITH_LONG_OFFSET(): {
        hour: string;
        minute: string;
        second: string;
        hour12: boolean;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_SHORT(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_SHORT_WITH_SECONDS(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
        second: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_MED(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_MED_WITH_SECONDS(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
        second: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_MED_WITH_WEEKDAY(): {
        year: string;
        month: string;
        day: string;
        weekday: string;
        hour: string;
        minute: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_FULL(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_FULL_WITH_SECONDS(): {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
        second: string;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_HUGE(): {
        year: string;
        month: string;
        day: string;
        weekday: string;
        hour: string;
        minute: string;
        timeZoneName: string;
    };
    /**
     * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */
    static get DATETIME_HUGE_WITH_SECONDS(): {
        year: string;
        month: string;
        day: string;
        weekday: string;
        hour: string;
        minute: string;
        second: string;
        timeZoneName: string;
    };
    /**
     * @private
     */
    private possiblyCachedWeekData;
    /**
     * @private
     */
    private clone;
    /**
     * @private
     */
    private static quickDT;
    /**
     * @private
     */
    private adjustTime;
    /**
     * @private
     */
    private static normalizeWithDefaults;
    /**
     * @private
     */
    private static diffRelative;
}
export declare type DateTimeLike = DateTime | Date | GenericDateTime;
