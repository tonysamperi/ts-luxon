import { Duration, DurationLike } from "./duration";
import { Interval } from "./interval";
import { Settings } from "./settings";
import { Info } from "./info";
import { Formatter } from "./impl/formatter";
import { FixedOffsetZone } from "./zones/fixedOffsetZone";
import { Locale } from "./impl/locale";
import {
    isDefined,
    isUndefined,
    maybeArray,
    isDate,
    isNumber,
    bestBy,
    daysInMonth,
    daysInYear,
    isLeapYear,
    weeksInWeekYear,
    normalizeObject,
    roundTo,
    objToLocalTS,
    padStart,
    PLURAL_MAPPING
} from "./impl/util";
import { normalizeZone } from "./impl/zoneUtil";
import { diff } from "./impl/diff";
import { parseRFC2822Date, parseISODate, parseHTTPDate, parseSQL } from "./impl/regexParser";
import {
    parseFromTokens,
    explainFromTokens,
    formatOptsToTokens,
    expandMacroTokens,
    TokenParser
} from "./impl/tokenParser";
import {
    gregorianToWeek,
    weekToGregorian,
    gregorianToOrdinal,
    ordinalToGregorian,
    hasInvalidGregorianData,
    hasInvalidWeekData,
    hasInvalidOrdinalData,
    hasInvalidTimeData,
    usesLocalWeekValues
} from "./impl/conversions";
import * as Formats from "./impl/formats";
import {
    InvalidArgumentError,
    ConflictingSpecificationError,
    InvalidUnitError,
    InvalidDateTimeError
} from "./errors";
import { Zone } from "./zone";
import {
    ToISOTimeOptions,
    ToISOFormat,
    ToSQLOptions,
    ToRelativeOptions,
    ToRelativeCalendarOptions,
    SetZoneOptions,
    GregorianDateTime,
    WeekDateTime,
    OrdinalDateTime,
    GenericDateTime,
    DefaultUnitValues,
    DefaultWeekUnitValues,
    DefaultOrdinalUnitValues,
    TimeObject,
    InnerBuildObjectConfig,
    GenericDateTimePlurals, GenericDateTimeExtended, DateTimeOptions, ExplainedFormat
} from "./types/datetime";
import { DurationUnit, DurationOptions, DurationObject } from "./types/duration";
import { LocaleOptions, CalendarSystem, NumberingSystem } from "./types/locale";
import { ZoneLike } from "./types/zone";
import { Invalid } from "./types/invalid";
import Intl from "./types/intl-next";
import { DayOfWeek } from "./types/common";

// eslint-disable-next-line @typescript-eslint/naming-convention
const INVALID = "Invalid DateTime";
// eslint-disable-next-line @typescript-eslint/naming-convention
const MAX_DATE = 8.64e15;

// find the right offset at a given local time. The o input is our guess, which determines which
// offset we'll pick in ambiguous cases (e.g. there are two 3 AMs b/c Fallback DST)
function fixOffset(localTS: number, o: number, tz: Zone): [number, number] {
    // Our UTC time is just a guess because our offset is just a guess
    let utcGuess = localTS - o * 60 * 1000;

    // Test whether the zone matches the offset for this ts
    const o2 = tz.offset(utcGuess);

    // If so, offset didn't change and we're done
    if (o === o2) {
        return [utcGuess, o];
    }

    // If not, change the ts by the difference in the offset
    utcGuess -= (o2 - o) * 60 * 1000;

    // If that gives us the local time we want, we're done
    const o3 = tz.offset(utcGuess);
    if (o2 === o3) {
        return [utcGuess, o2];
    }

    // If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
    return [localTS - Math.min(o2, o3) * 60 * 1000, Math.max(o2, o3)];
}

// convert an epoch timestamp into a calendar object with the given offset
function tsToObj(ts: number, offset: number): GregorianDateTime {
    ts += offset * 60 * 1000;

    const d = new Date(ts);

    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        millisecond: d.getUTCMilliseconds()
    };
}

// convert a calendar object to an epoch timestamp
function objToTS(obj: GregorianDateTime, offset: number, zone: Zone): [number, number] {
    return fixOffset(objToLocalTS(obj), offset, zone);
}

// helper useful in turning the results of parsing into real dates
// by handling the zone options
function parseDataToDateTime(parsed: GenericDateTime | null | void,
                             parsedZone: Zone | null,
                             opts: DateTimeOptions,
                             format: string,
                             text: string,
                             specificOffset?: number): DateTime {
    const { setZone, zone } = opts;
    if ((parsed && Object.keys(parsed).length !== 0) || parsedZone) {
        const interpretationZone = parsedZone || zone;
        // While null is not a suitable value for the arg default, void is.
        const inst = DateTime.fromObject(parsed || void 0, {
            ...opts,
            zone: interpretationZone,
            specificOffset
        });

        return setZone ? inst : inst.setZone(zone);
    }
    else {
        return DateTime.invalid(
            new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`)
        );
    }
}

// if you want to output a technical format (e.g. RFC 2822), this helper
// helps handle the details
function toTechFormat(dt: DateTime, format: string, allowZ = true): string {
    return dt.isValid
        ? Formatter.create(Locale.create("en-US"), {
            allowZ,
            forceSimple: true
        }).formatDateTimeFromString(dt, format)
        : null;
}

// defaults for unspecified units in the supported calendars
const defaultUnitValues: DefaultUnitValues = {
        year: 0, // unused value
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    },
    defaultWeekUnitValues: DefaultWeekUnitValues = {
        weekNumber: 1,
        weekday: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    },
    defaultOrdinalUnitValues: DefaultOrdinalUnitValues = {
        ordinal: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    };

// Units in the supported calendars, sorted by bigness
const orderedUnits: Array<keyof GregorianDateTime> = [
        "year",
        "month",
        "day",
        "hour",
        "minute",
        "second",
        "millisecond"
    ],
    orderedWeekUnits: Array<keyof WeekDateTime> = [
        "weekYear",
        "weekNumber",
        "weekday",
        "hour",
        "minute",
        "second",
        "millisecond"
    ],
    orderedOrdinalUnits: Array<keyof OrdinalDateTime> = [
        "year",
        "ordinal",
        "hour",
        "minute",
        "second",
        "millisecond"
    ];

// standardize case and plurality in units
function normalizeUnit(unit: string): keyof GenericDateTimeExtended {

    const normalized = PLURAL_MAPPING[unit.toLowerCase()];

    if (!normalized) {
        throw new InvalidUnitError(unit);
    }

    return normalized;
}

type DiffRelativeOptions = ToRelativeOptions & {
    numeric: Intl.RelativeTimeFormatNumeric;
    units: Intl.RelativeTimeFormatUnit[];
    calendary?: boolean;
};

interface DateTimeConfig {
    loc?: Locale;
    ts?: number;
    zone?: Zone;
}

interface Config extends DateTimeConfig {
    invalid?: Invalid;
    o?: number;
    old?: {
        ts: number;
        zone: Zone;
        o: number;
        c: GregorianDateTime;
    };
}

/**
 * A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
 *
 * A DateTime consists of:
 * * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
 * * A time zone. Each instance is considered in the context of a specific zone (by default the system's time zone).
 * * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
 *
 * Here is a brief overview of the most commonly used functionality it provides:
 *
 * * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link DateTime.local}, {@link DateTime.utc}, and (most flexibly) {@link DateTime.fromObject}. To create one from a standard string format, use {@link DateTime.fromISO}, {@link DateTime.fromHTTP}, and {@link DateTime.fromRFC2822}. To create one from a custom string format, use {@link DateTime.fromFormat}. To create one from a native JS date, use {@link DateTime.fromJSDate}.
 * * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e. as opposed to collectively through {@link DateTime#toObject}), use the {@link DateTime#year}, {@link DateTime#month},
 * {@link DateTime#day}, {@link DateTime#hour}, {@link DateTime#minute}, {@link DateTime#second}, {@link DateTime#millisecond} accessors.
 * * **Week calendar**: For ISO week calendar attributes, see the {@link DateTime#weekYear}, {@link DateTime#weekNumber}, and {@link DateTime#weekday} accessors.
 * * **Configuration** See the {@link DateTime#locale} and {@link DateTime#numberingSystem} accessors.
 * * **Transformation**: To transform the DateTime into other DateTimes, use {@link DateTime#set}, {@link DateTime#reconfigure}, {@link DateTime#setZone}, {@link DateTime#setLocale}, {@link DateTime#plus}, {@link DateTime#minus}, {@link DateTime#endOf}, {@link DateTime#startOf}, {@link DateTime#toUTC}, and {@link DateTime#toLocal}.
 * * **Output**: To convert the DateTime to other representations, use the {@link DateTime#toRelative}, {@link DateTime#toRelativeCalendar}, {@link DateTime#toJSON}, {@link DateTime#toISO}, {@link DateTime#toHTTP}, {@link DateTime#toObject}, {@link DateTime#toRFC2822}, {@link DateTime#toString}, {@link DateTime#toLocaleString}, {@link DateTime#toFormat}, {@link DateTime#toMillis} and {@link DateTime#toJSDate}.
 *
 * There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
 */
export class DateTime {


    // FORMAT PRESETS

    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_FULL = Formats.DATETIME_FULL;

    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_FULL_WITH_SECONDS = Formats.DATETIME_FULL_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_HUGE = Formats.DATETIME_HUGE;

    /**
     * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_HUGE_WITH_SECONDS = Formats.DATETIME_HUGE_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_MED = Formats.DATETIME_MED;

    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_MED_WITH_SECONDS = Formats.DATETIME_MED_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
     */
    static readonly DATETIME_MED_WITH_WEEKDAY = Formats.DATETIME_MED_WITH_WEEKDAY;

    /**
     * {@link DateTime#toLocaleString} format like "10/14/1983, 9:30 AM". Only 12-hour if the locale is.
     */
    static readonly DATETIME_SHORT = Formats.DATETIME_SHORT;

    /**
     * {@link DateTime#toLocaleString} format like "10/14/1983, 9:30:33 AM". Only 12-hour if the locale is.
     */
    static readonly DATETIME_SHORT_WITH_SECONDS = Formats.DATETIME_SHORT_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like 'October 14, 1983'
     */
    static readonly DATE_FULL = Formats.DATE_FULL;

    /**
     * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983'
     */
    static readonly DATE_HUGE = Formats.DATE_HUGE;

    /**
     * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
     */
    static readonly DATE_MED = Formats.DATE_MED;

    /**
     * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
     */
    static readonly DATE_MED_WITH_WEEKDAY = Formats.DATE_MED_WITH_WEEKDAY;

    /**
     * {@link DateTime#toLocaleString} format like 10/14/1983
     */
    static readonly DATE_SHORT = Formats.DATE_SHORT;

    /**
     * {@link DateTime#toLocaleString} format like "09:30", always 24-hour.
     */
    static readonly TIME_24_SIMPLE = Formats.TIME_24_SIMPLE;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23 Eastern Daylight Time", always 24-hour.
     */
    static readonly TIME_24_WITH_LONG_OFFSET = Formats.TIME_24_WITH_LONG_OFFSET;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23", always 24-hour.
     */
    static readonly TIME_24_WITH_SECONDS = Formats.TIME_24_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23 EDT", always 24-hour.
     */
    static readonly TIME_24_WITH_SHORT_OFFSET = Formats.TIME_24_WITH_SHORT_OFFSET;

    /**
     * {@link DateTime#toLocaleString} format like "09:30 AM". Only 12-hour if the locale is.
     */
    static readonly TIME_SIMPLE = Formats.TIME_SIMPLE;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23 AM Eastern Daylight Time". Only 12-hour if the locale is.
     */
    static readonly TIME_WITH_LONG_OFFSET = Formats.TIME_WITH_LONG_OFFSET;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23 AM". Only 12-hour if the locale is.
     */
    static readonly TIME_WITH_SECONDS = Formats.TIME_WITH_SECONDS;

    /**
     * {@link DateTime#toLocaleString} format like "09:30:23 AM EDT". Only 12-hour if the locale is.
     */
    static readonly TIME_WITH_SHORT_OFFSET = Formats.TIME_WITH_SHORT_OFFSET;

    private static _zoneOffsetGuessCache: Map<Zone, number> = new Map();
    private static _zoneOffsetTs: number;

    /**
     * Get the day of the month (1-30ish).
     * @example DateTime.local(2017, 5, 25).day //=> 25
     */
    get day(): number {
        return this.isValid ? this._c.day : NaN;
    }

    /**
     * Returns the number of days in this DateTime's month
     * @example DateTime.local(2016, 2).daysInMonth //=> 29
     * @example DateTime.local(2016, 3).daysInMonth //=> 31
     */
    get daysInMonth(): number {
        return daysInMonth(this.year, this.month);
    }

    /**
     * Returns the number of days in this DateTime's year
     * @example DateTime.local(2016).daysInYear //=> 366
     * @example DateTime.local(2013).daysInYear //=> 365
     */
    get daysInYear(): number {
        return this.isValid ? daysInYear(this.year) : NaN;
    }

    /**
     * Get the hour of the day (0-23).
     * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
     */
    get hour(): number {
        return this.isValid ? this._c.hour : NaN;
    }

    /**
     * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
     */
    get invalidExplanation(): string | void {
        return this._invalid ? this._invalid.explanation : void 0;
    }

    /**
     * Returns an error code if this Duration became invalid, or null if the Duration is valid
     */
    get invalidReason(): string | void {
        return this._invalid ? this._invalid.reason : void 0;
    }

    /**
     * Get whether the DateTime is in a DST.
     */
    get isInDST(): boolean {
        if (this.isOffsetFixed) {
            return false;
        }
        else {
            return (
                this.offset > this.set({ month: 1, day: 1 }).offset || this.offset > this.set({ month: 5 }).offset
            );
        }
    }

    /**
     * Returns true if this DateTime is in a leap year, false otherwise
     * @example DateTime.local(2016).isInLeapYear //=> true
     * @example DateTime.local(2013).isInLeapYear //=> false
     */
    get isInLeapYear(): boolean {
        return isLeapYear(this.year);
    }

    /**
     * Get whether this zone's offset ever changes, as in a DST.
     */
    get isOffsetFixed(): boolean {
        return this.isValid ? this.zone.isUniversal : null;
    }

    /**
     * Returns whether the DateTime is valid. Invalid DateTimes occur when:
     * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
     * * The DateTime was created by an operation on another invalid date
     */
    get isValid(): boolean {
        return this._invalid === null;
    }

    /**
     * Returns true if this date is on a weekend according to the locale, false otherwise
     * @returns {boolean}
     */
    get isWeekend(): boolean {
        return this.isValid && this.loc.getWeekendDays().includes(this.weekday as DayOfWeek);
    }

    /**
     * Get a clone of the Locale instance of a DateTime.
     */
    get loc(): Locale {
        return this.isValid ? this._loc.clone() : void 0;
    }

    /**
     * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
     * because the week can start on different days of the week (see localWeekday) and because a different number of days
     * is required for a week to count as the first week of a year.
     */
    get localWeekNumber(): number {
        return this.isValid ? this._possiblyCachedLocalWeekData(this).weekNumber : NaN;
    }

    /**
     * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
     * differently, see localWeekNumber.
     */
    get localWeekYear(): number {
        return this.isValid ? this._possiblyCachedLocalWeekData(this).weekYear : NaN;
    }

    /**
     * Get the day of the week according to the locale.
     * 1 is the first day of the week and 7 is the last day of the week.
     * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
     */
    get localWeekday(): number {
        return this.isValid ? this._possiblyCachedLocalWeekData(this).weekday : NaN;
    }

    /**
     * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
     */
    get locale(): string {
        return this.isValid ? this._loc.locale : void 0;
    }

    /**
     * Get the millisecond of the second (0-999).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
     */
    get millisecond(): number {
        return this.isValid ? this._c.millisecond : NaN;
    }

    /**
     * Get the minute of the hour (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
     */
    get minute(): number {
        return this.isValid ? this._c.minute : NaN;
    }

    /**
     * Get the month (1-12).
     * @example DateTime.local(2017, 5, 25).month //=> 5
     */
    get month(): number {
        return this.isValid ? this._c.month : NaN;
    }

    /**
     * Get the human-readable long month name, such as 'October'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthLong //=> October
     */
    get monthLong(): string {
        return this.isValid ? Info.months("long", { locObj: this._loc })[this.month - 1] : null;
    }

    /**
     * Get the human-readable short month name, such as 'Oct'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
     */
    get monthShort(): string {
        return this.isValid ? Info.months("short", { locObj: this._loc })[this.month - 1] : null;
    }

    /**
     * Get the numbering system of a DateTime, such as "beng". The numbering system is used when formatting the DateTime
     */
    get numberingSystem(): Readonly<NumberingSystem> {
        return this.isValid ? this._loc.numberingSystem : void 0;
    }

    /**
     * Get the UTC offset of this DateTime in minutes
     * @example DateTime.now().offset //=> -240
     * @example DateTime.utc().offset //=> 0
     */
    get offset(): number {
        return this.isValid ? +this._o : NaN;
    }

    /**
     * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
     * Defaults to the system's locale if no locale has been specified
     */
    get offsetNameLong(): string {
        if (!this.isValid) {
            return null;
        }

        return this.zone.offsetName(this._ts, {
            format: "long",
            locale: this.locale
        });
    }

    /**
     * Get the short human name for the zone's current offset, for example "EST" or "EDT".
     * Defaults to the system's locale if no locale has been specified
     */
    get offsetNameShort(): string {
        if (!this.isValid) {
            return null;
        }
        return this.zone.offsetName(this._ts, {
            format: "short",
            locale: this.locale
        });
    }

    /**
     * Get the ordinal (meaning the day of the year)
     * @example DateTime.local(2017, 5, 25).ordinal //=> 145
     */
    get ordinal(): number {
        return this.isValid ? gregorianToOrdinal(this._c).ordinal : NaN;
    }

    /**
     * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
     */
    get outputCalendar(): CalendarSystem | undefined {
        return this.isValid
            ? this._loc.outputCalendar
            : void 0;
    }

    /**
     * Get the quarter
     * @example DateTime.local(2017, 5, 25).quarter //=> 2
     */
    get quarter(): number {
        return this.isValid ? Math.ceil(this._c.month / 3) : NaN;
    }

    /**
     * Get the second of the minute (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
     */
    get second(): number {
        return this.isValid ? this._c.second : NaN;
    }

    /**
     * Get the timestamp.
     * @example DateTime.local(1970, 1, 1, 0, 0, 0, 654).ts //=> 654
     */
    get ts(): number {
        return this._ts;
    }

    /**
     * Get the week number of the week year (1-52ish).
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
     */
    get weekNumber(): number {
        return this.isValid ? this._possiblyCachedWeekData(this).weekNumber : NaN;
    }

    /**
     * Get the week year
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
     */
    get weekYear(): number {
        return this.isValid ? this._possiblyCachedWeekData(this).weekYear : NaN;
    }

    /**
     * Get the day of the week.
     * 1 is Monday and 7 is Sunday
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 11, 31).weekday //=> 4
     */
    get weekday(): number {
        return this.isValid ? this._possiblyCachedWeekData(this).weekday : NaN;
    }

    /**
     * Get the human-readable long weekday, such as 'Monday'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
     */
    get weekdayLong(): string {
        return this.isValid ? Info.weekdays("long", { locObj: this._loc })[this.weekday - 1] : null;
    }

    /**
     * Get the human-readable short weekday, such as 'Mon'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
     */
    get weekdayShort(): string {
        return this.isValid ? Info.weekdays("short", { locObj: this._loc })[this.weekday - 1] : null;
    }

    /**
     * Returns the number of weeks in this DateTime's local week year
     * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
     * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
     * @type {number}
     */
    get weeksInLocalWeekYear(): number {
        return this.isValid
            ? weeksInWeekYear(
                this.localWeekYear,
                this.loc.getMinDaysInFirstWeek(),
                this.loc.getStartOfWeek()
            )
            : NaN;
    }

    /**
     * Returns the number of weeks in this DateTime's year
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2004).weeksInWeekYear //=> 53
     * @example DateTime.local(2013).weeksInWeekYear //=> 52
     */
    get weeksInWeekYear(): number {
        return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
    }

    /**
     * Get the year
     * @example DateTime.local(2017, 5, 25).year //=> 2017
     */
    get year(): number {
        return this.isValid ? this._c.year : NaN;
    }

    /**
     * Get the time zone associated with this DateTime.
     */
    get zone(): Zone {
        return this._zone;
    }

    /**
     * Get the name of the time zone.
     */
    get zoneName(): string {
        return this.isValid ? this.zone.name : null;
    }


    // Private readonly fields
    private _c: Readonly<GregorianDateTime>;
    private readonly _invalid: Invalid | null;
    private readonly _isLuxonDateTime: true;
    private _loc: Locale;
    private _localWeekData?: WeekDateTime;
    private readonly _o: number;
    private readonly _ts: number;
    private _weekData: WeekDateTime | null;
    private readonly _zone: Readonly<Zone>;

    /**
     * @access private
     */
    private constructor(config: Config) {

        const zone: Zone = config.zone || Settings.defaultZone;

        let invalid =
            config.invalid ||
            // invalid timestamp can happen when using plus or minus with 1E8 days resulting in overflows
            (Number.isNaN(config.ts) ? new Invalid("invalid timestamp") : null) ||
            (!zone.isValid ? DateTime._unsupportedZone(zone) : null);

        /**
         * @access private
         */
        this._ts = isUndefined(config.ts) ? Settings.now() : config.ts;

        let o, c;
        if (!invalid) {
            const unchanged = !!config.old && config.old.ts === this._ts && config.old.zone.equals(zone);

            if (unchanged) {
                [c, o] = [config.old.c, config.old.o];
            }
            else {
                // If an offset has been passed + we have not been called from clone(), we can trust it and avoid the offset calculation.
                const ot = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
                c = tsToObj(this._ts, ot);
                invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
                c = invalid ? void 0 : c;
                o = invalid ? void 0 : ot;
            }
        }

        /**
         * @access private
         */
        this._zone = zone;
        /**
         * @access private
         */
        this._loc = config.loc || Locale.create();
        /**
         * @access private
         */
        this._invalid = invalid;
        /**
         * @access private
         */
        this._weekData = null;
        /**
         * @access private
         */
        this._c = c as GregorianDateTime;
        /**
         * @access private
         */
        this._o = o as number;
        /**
         * @access private
         */
        this._isLuxonDateTime = true;
    }

    /**
     * Build a parser for `fmt` using the given locale. This parser can be passed
     * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
     * can be used to optimize cases where many dates need to be parsed in a
     * specific format.
     *
     * @param {String} fmt - the format the string is expected to be in (see
     * description)
     * @param {Object} options - options used to set locale and numberingSystem
     * for parser
     * @returns {TokenParser} - opaque object to be used
     */
    static buildFormatParser(fmt: string, options: LocaleOptions = {}): TokenParser {
        const { locale = null, numberingSystem = null } = options,
            localeToUse = Locale.fromOpts({
                locale,
                numberingSystem,
                defaultToEN: true
            });
        return new TokenParser(localeToUse, fmt);
    }

    /**
     * Produce the fully expanded format token for the locale
     * Does NOT quote characters, so quoted tokens will not round trip correctly
     * @param fmt
     * @param localeOpts
     */
    static expandFormat(fmt: string, localeOpts: LocaleOptions = {}): string {
        const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
        return expanded.map((t) => t.val).join("");
    }

    /**
     * Create a DateTime from an input string and format string.
     * Defaults to en-US if no locale has been specified, regardless of the system's locale.
     * @see https://moment.github.io/luxon/docs/manual/parsing.html#table-of-tokens
     * @param {string} text - the string to parse
     * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
     * @param {Object} opts - options to affect the creation
     * @param {string|Zone} [opts.zone="local"] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
     * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
     * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
     * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
     * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     */
    static fromFormat(text: string, fmt: string, opts: DateTimeOptions = {}): DateTime {
        if (isUndefined(text) || isUndefined(fmt)) {
            throw new InvalidArgumentError("fromFormat requires an input string and a format");
        }

        const { locale, numberingSystem } = opts,
            localeToUse = Locale.fromOpts({
                locale,
                numberingSystem,
                defaultToEN: true
            }),
            [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
        if (invalid) {
            return DateTime.invalid(invalid);
        }
        else {
            return parseDataToDateTime(vals as GenericDateTimeExtended, parsedZone || null, opts, `format ${fmt}`, text, specificOffset);
        }
    }

    /**
     * Explain how a string would be parsed by fromFormat()
     * @param {string} text - the string to parse
     * @param {string} fmt - the format the string is expected to be in (see description)
     * @param {DateTimeOptions} options - options taken by fromFormat()
     */
    static fromFormatExplain(text: string, fmt: string, options: DateTimeOptions = {}): ExplainedFormat {
        const { locale, numberingSystem } = options,
            localeToUse = Locale.fromOpts({
                locale,
                numberingSystem,
                defaultToEN: true
            });
        return explainFromTokens(localeToUse, text, fmt);
    }

    /**
     * Create a DateTime from an input string and format parser.
     *
     * The format parser must have been created with the same locale as this call.
     *
     * @param {String} text - the string to parse
     * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
     * @param {DateTimeOptions} opts - options taken by fromFormat()
     * @returns {DateTime}
     */
    static fromFormatParser(text: string, formatParser: TokenParser, opts: DateTimeOptions = {}): DateTime {
        if (isUndefined(text) || isUndefined(formatParser)) {
            throw new InvalidArgumentError(
                "fromFormatParser requires an input string and a format parser"
            );
        }
        const { locale = null, numberingSystem = null } = opts,
            localeToUse = Locale.fromOpts({
                locale,
                numberingSystem,
                defaultToEN: true
            });

        if (!localeToUse.equals(formatParser.locale)) {
            throw new InvalidArgumentError(
                `fromFormatParser called with a locale of ${localeToUse}, ` +
                `but the format parser was created for ${formatParser.locale}`
            );
        }

        const { result, zone, specificOffset, invalidReason } = formatParser.explainFromTokens(text);

        if (invalidReason) {
            return DateTime.invalid(invalidReason);
        }
        else {
            return parseDataToDateTime(
                result,
                zone,
                opts,
                `format ${formatParser.format}`,
                text,
                specificOffset
            );
        }
    }

    /**
     * Create a DateTime from an HTTP header date
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
     * @param {string} text - the HTTP header date
     * @param {Object} opts - options to affect the creation
     * @param {string|Zone} [opts.zone="local"] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
     * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
     * @param {string} [opts.locale="system's locale"] - a locale to set on the resulting DateTime instance
     * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
     * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
     * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
     * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
     */
    static fromHTTP(text: string, opts: DateTimeOptions = {}): DateTime {
        const [vals, parsedZone] = parseHTTPDate(text);

        return parseDataToDateTime(vals, parsedZone, opts, "HTTP", text);
    }

    /**
     * Create a DateTime from an ISO 8601 string
     * @param {string} text - the ISO string
     * @param {Object} opts - options to affect the creation
     * @param {string|Zone} [opts.zone="local"] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
     * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
     * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
     * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     * @example DateTime.fromISO('2016-05-25T09:08:34.123')
     * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
     * @example DateTime.fromISO("2016-05-25T09:08:34.123+06:00", {setZone: true})
     * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
     * @example DateTime.fromISO('2016-W05-4')
     * @return {DateTime}
     */
    static fromISO(text: string, opts: DateTimeOptions = {}): DateTime {
        const [vals, parsedZone] = parseISODate(text);

        return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
    }

    /**
     * Create a DateTime from a Javascript Date object. Uses the default zone.
     * @param {Date} date - a Javascript Date object
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone="local"] - the zone to place the DateTime into
     * @return {DateTime}
     */
    static fromJSDate(date: Date, options: DateTimeOptions = {}): DateTime {
        const ts = isDate(date) ? date.valueOf() : NaN;
        if (Number.isNaN(ts)) {
            return DateTime.invalid("invalid input");
        }

        const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
        if (!zoneToUse.isValid) {
            return DateTime.invalid(DateTime._unsupportedZone(zoneToUse));
        }

        return new DateTime({
            ts: ts,
            zone: zoneToUse,
            loc: Locale.fromObject(options)
        });
    }

    /**
     * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
     * @param {number} milliseconds - a number of milliseconds since 1970 UTC
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone="local"] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
     * @return {DateTime}
     */
    static fromMillis(milliseconds: number, options: DateTimeOptions = {}): DateTime {
        if (!isNumber(milliseconds)) {
            throw new InvalidArgumentError(
                `fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`
            );
        }
        else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
            // this isn't perfect because we can still end up out of range because of additional shifting, but it's a start
            return DateTime.invalid("Timestamp out of range");
        }
        else {
            return new DateTime({
                ts: milliseconds,
                zone: normalizeZone(options.zone, Settings.defaultZone),
                loc: Locale.fromObject(options)
            });
        }
    }

    /**
     * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
     * @param {Object} obj - the object to create the DateTime from
     * @param {number} obj.year - a year, such as 1987
     * @param {number} obj.month - a month, 1-12
     * @param {number} obj.day - a day of the month, 1-31, depending on the month
     * @param {number} obj.ordinal - day of the year, 1-365 or 366
     * @param {number} obj.weekYear - an ISO week year
     * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
     * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
     * @param {number} obj.localWeekYear - a week year, according to the locale
     * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
     * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
     * @param {number} obj.hour - hour of the day, 0-23
     * @param {number} obj.minute - minute of the hour, 0-59
     * @param {number} obj.second - second of the minute, 0-59
     * @param {number} obj.millisecond - millisecond of the second, 0-999
     * @param {Object} opts - options for creating this DateTime
     * @param {string|Zone} [opts.zone="local"] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
     * @param {string} [opts.locale="system's locale"] - a locale to set on the resulting DateTime instance
     * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
     * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
     * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
     * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
     * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
     * @return {DateTime}
     */
    static fromObject(obj: DurationObject & GenericDateTime = {},
                      opts: DateTimeOptions = {} as DateTimeOptions): DateTime {
        const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
        if (!zoneToUse.isValid) {

            return DateTime.invalid(DateTime._unsupportedZone(zoneToUse));
        }

        const loc = Locale.fromObject(opts);
        const normalized = normalizeObject(obj as Record<string, any>, normalizeUnit);

        const tsNow = Settings.now(),
            offsetProvis = isNumber(opts.specificOffset)
                ? opts.specificOffset
                : zoneToUse.offset(tsNow),
            containsOrdinal = isDefined(normalized.ordinal),
            containsGregorYear = isDefined(normalized.year),
            containsGregorMD = isDefined(normalized.month) || isDefined(normalized.day),
            containsGregor = containsGregorYear || containsGregorMD,
            definiteWeekDef = normalized.weekYear || normalized.weekNumber
        ;

        // cases:
        // just a weekday -> this week's instance of that weekday, no worries
        // (gregorian data or ordinal) + (weekYear or weekNumber) -> error
        // (gregorian month or day) + ordinal -> error
        // otherwise just use weeks or ordinals or gregorian, depending on what's specified

        if ((containsGregor || containsOrdinal) && definiteWeekDef) {
            throw new ConflictingSpecificationError(
                "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
            );
        }

        if (containsGregorMD && containsOrdinal) {
            throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
        }

        const useWeekData = definiteWeekDef || (normalized.weekday && !containsGregor);
        const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
        // configure ourselves to deal with gregorian dates or week stuff
        const tmpNow: GregorianDateTime = tsToObj(tsNow, offsetProvis);
        const config = {
            containsGregor,
            containsOrdinal,
            loc,
            normalized,
            obj,
            offsetProvis,
            useWeekData,
            zoneToUse
        };
        /*
         * For future refactors here, I assume the original had a lot of duplicated code,
         * while I decided to create this cool _buildObject method, to minimize the code
         * and simplify maintenance
         **/
        if (useWeekData) {
            return DateTime._buildObject<WeekDateTime>(config,
                orderedWeekUnits,
                defaultWeekUnitValues,
                gregorianToWeek(tmpNow, minDaysInFirstWeek, startOfWeek)
            );
        }
        else if (containsOrdinal) {
            return DateTime._buildObject(config, orderedOrdinalUnits, defaultOrdinalUnitValues, gregorianToOrdinal(tmpNow));
        }
        else {
            return DateTime._buildObject(config, orderedUnits, defaultUnitValues, tmpNow);
        }

    }

    /**
     * Create a DateTime from an RFC 2822 string
     * @param {string} text - the RFC 2822 string
     * @param {Object} opts - options to affect the creation
     * @param {string|Zone} [opts.zone="local"] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
     * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
     * @param {string} [opts.locale="system's locale"] - a locale to set on the resulting DateTime instance
     * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
     * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
     * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
     * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
     */
    static fromRFC2822(text: string, opts: DateTimeOptions = {}): DateTime {
        const [vals, parsedZone] = parseRFC2822Date(text);
        return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
    }

    /**
     * Create a DateTime from a SQL date, time, or datetime
     * Defaults to en-US if no locale has been specified, regardless of the system's locale
     * @param {string} text - the string to parse
     * @param {Object} opts - options to affect the creation
     * @param {string|Zone} [opts.zone="local"] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
     * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
     * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
     * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
     * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
     * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
     * @example DateTime.fromSQL('2017-05-15')
     * @example DateTime.fromSQL('2017-05-15 09:12:34')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
     * @example DateTime.fromSQL('09:12:34.342')
     */
    static fromSQL(text: string, opts: DateTimeOptions = {}): DateTime {
        const [vals, parsedZone] = parseSQL(text);

        return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
    }

    /**
     * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
     * @param {number} seconds - a number of seconds since 1970 UTC
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone="local"] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
     * @return {DateTime}
     */
    static fromSeconds(seconds: number, options: DateTimeOptions = {}): DateTime {
        if (!isNumber(seconds)) {
            throw new InvalidArgumentError("fromSeconds requires a numerical input");
        }

        return new DateTime({
            ts: seconds * 1000,
            zone: normalizeZone(options.zone, Settings.defaultZone),
            loc: Locale.fromObject(options)
        });
    }

    /**
     * @deprecated use fromFormat instead
     */
    static fromString(text: string, fmt: string, opts: DateTimeOptions = {}): DateTime {
        return DateTime.fromFormat(text, fmt, opts);
    }

    /**
     * @deprecated use fromFormatExplain instead
     */
    static fromStringExplain(text: string, fmt: string, options: DateTimeOptions = {}): ExplainedFormat {
        return DateTime.fromFormatExplain(text, fmt, options);
    }

    /**
     * Create an invalid DateTime.
     * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
     * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
     */
    static invalid(reason: Invalid | string, explanation?: string): DateTime {
        if (!reason) {
            throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
        }
        const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
        if (Settings.throwOnInvalid) {
            throw new InvalidDateTimeError(invalid);
        }
        return new DateTime({ invalid });
    }

    /**
     * Check if an object is an instance of DateTime. Works across context boundaries
     * @param {Object} o
     */
    static isDateTime(o: unknown): o is DateTime {
        return !!(o && (o as DateTime)._isLuxonDateTime);
    }

    /**
     * Create a local DateTime
     * @param args - The date values (year, month, etc.) and/or the configuration options for the DateTime
     * @example {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
     * @example {number} [month=1] - The month, 1-indexed
     * @example {number} [day=1] - The day of the month, 1-indexed
     * @example {number} [hour=0] - The hour of the day, in 24-hour time
     * @example {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
     * @example {number} [second=0] - The second of the minute, meaning a number between 0 and 59
     * @example {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
     * @example DateTime.local()                                //~> now
     * @example DateTime.local({ zone: "America/New_York" })    //~> now, in US east coast time
     * @example DateTime.local(2017)                            //~> 2017-01-01T00:00:00
     * @example DateTime.local(2017, 3)                         //~> 2017-03-01T00:00:00
     * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
     * @example DateTime.local(2017, 3, 12, 5)                  //~> 2017-03-12T05:00:00
     * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" }) //~> 2017-03-12T05:00:00, in UTC
     * @example DateTime.local(2017, 3, 12, 5, 45, 10)          //~> 2017-03-12T05:45:10
     * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)     //~> 2017-03-12T05:45:10.765
     * @return {DateTime}
     */
    static local(...args: [DateTimeOptions] | number[] | (number | DateTimeOptions)[]): DateTime {

        const [opts, dateValues] = this._lastOpts(args);
        const [year, month, day, hour, minute, second, millisecond] = dateValues;

        return DateTime._quickDT(
            {
                year,
                month,
                day,
                hour,
                minute,
                second,
                millisecond
            },
            opts
        );
    }

    /**
     * Return the max of several date times
     * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
     * @return {DateTime} the max DateTime, or undefined if called with no arguments
     */
    static max(...dateTimes: []): void;
    static max(...dateTimes: DateTime[]): DateTime;
    static max(...dateTimes: DateTime[]): DateTime | void {
        if (!dateTimes.every(DateTime.isDateTime)) {
            throw new InvalidArgumentError("max requires all arguments be DateTimes");
        }

        return bestBy(dateTimes, i => i.valueOf(), Math.max);
    }

    /**
     * Return the min of several date times
     * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
     * @return {DateTime} the min DateTime, or undefined if called with no arguments
     */
    static min(...dateTimes: []): void;
    static min(...dateTimes: DateTime[]): DateTime;
    static min(...dateTimes: DateTime[]): DateTime | void {
        if (!dateTimes.every(DateTime.isDateTime)) {
            throw new InvalidArgumentError("min requires all arguments be DateTimes");
        }

        return bestBy(dateTimes, (i: DateTime) => i.valueOf(), Math.min);
    }

    /**
     * Create a DateTime for the current instant, in the system's time zone.
     *
     * Use Settings to override these default values if needed.
     * @example DateTime.now().toISO() //~> now in the ISO format
     * @return {DateTime}
     */
    static now(): DateTime {
        return new DateTime({});
    }

    /**
     * Produce the format string for a set of options
     * @param formatOpts
     * @param localeOpts
     * @returns {string}
     */
    static parseFormatForOpts(formatOpts: Intl.DateTimeFormatOptions, localeOpts: LocaleOptions = {}): string {
        const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));

        return !tokenList ? null : tokenList.map((t) => (t ? t.val : null)).join("");
    }

    static resetCache(): void {
        this._zoneOffsetTs = void 0;
        this._zoneOffsetGuessCache = new Map();
    }

    /**
     * Create a DateTime in UTC
     * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
     * @param {number} [month=1] - The month, 1-indexed
     * @param {number} [day=1] - The day of the month
     * @param {number} [hour=0] - The hour of the day, in 24-hour time
     * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
     * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
     * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
     * @param {Object} options - configuration options for the DateTime
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
     * @example DateTime.utc()                                              //~> now
     * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
     * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
     * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
     * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
     * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
     * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
     * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
     * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
     * @return {DateTime}
     */
    static utc(...args: [DateTimeOptions] | number[] | (number | DateTimeOptions)[]): DateTime {
        const [opts, dateValues] = this._lastOpts(args);
        const [year, month, day, hour, minute, second, millisecond] = dateValues;

        opts.zone = FixedOffsetZone.utcInstance;
        return this._quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
    }

    /**
     * @private
     */
    private static _buildObject<T extends TimeObject>(config: InnerBuildObjectConfig,
                                                      units: string[],
                                                      defaultValues: DefaultUnitValues | DefaultOrdinalUnitValues | DefaultWeekUnitValues,
                                                      objNow: T): DateTime {

        // set default values for missing stuff
        let foundFirst = false;
        units.forEach((u: string) => {
            const v = config.normalized[u];
            if (isDefined(v)) {
                foundFirst = true;
            }
            else if (foundFirst) {
                config.normalized[u] = defaultValues[u];
            }
            else {
                config.normalized[u] = (objNow as { [key: string]: any })[u];
            }
        });

        // make sure the values we have are in range
        const higherOrderInvalid = config.useWeekData
            ? hasInvalidWeekData(config.normalized as unknown as WeekDateTime)
            : config.containsOrdinal
                ? hasInvalidOrdinalData(config.normalized as unknown as OrdinalDateTime)
                : hasInvalidGregorianData(config.normalized as unknown as GregorianDateTime);
        const invalid = higherOrderInvalid || hasInvalidTimeData(config.normalized as unknown as TimeObject);

        if (invalid) {
            return DateTime.invalid(invalid);
        }

        // compute the actual time
        const gregorian = config.useWeekData
                ? weekToGregorian(config.normalized as unknown as WeekDateTime)
                : config.containsOrdinal
                    ? ordinalToGregorian(config.normalized as unknown as OrdinalDateTime)
                    : config.normalized,
            [tsFinal, offsetFinal] = objToTS(gregorian as unknown as GregorianDateTime, config.offsetProvis, config.zoneToUse),
            inst = new DateTime({
                ts: tsFinal,
                zone: config.zoneToUse,
                o: offsetFinal,
                loc: config.loc
            });

        // gregorian data + weekday serves only to validate
        if (config.normalized.weekday && config.containsGregor && config.obj.weekday !== inst.weekday) {
            return DateTime.invalid(
                "mismatched weekday",
                `you can't specify both a weekday of ${config.normalized.weekday} and a date of ${inst.toISO()}`
            );
        }

        if (!inst.isValid) {
            return DateTime.invalid(inst._invalid);
        }

        return inst;
    }

    /**
     * @private
     */
    private static _diffRelative(start: DateTime, end: DateTime, opts: DiffRelativeOptions): string {
        const round = isUndefined(opts.round) ? true : opts.round,
            format = (c: number, unit: Intl.RelativeTimeFormatUnit): string => {
                c = roundTo(c, round || opts.calendary ? 0 : 2, true);
                const formatter = end._loc.clone(opts).relFormatter(opts);
                return formatter.format(c, unit);
            },
            differ = (unit: Intl.RelativeTimeFormatUnit): number => {
                if (opts.calendary) {
                    if (!end.hasSame(start, unit)) {
                        return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
                    }
                    return 0;
                }
                return end.diff(start, unit).get(unit);
            };

        if (opts.unit) {
            return format(differ(opts.unit), opts.unit);
        }

        for (const unit of
            opts.units) {
            const count = differ(unit);
            if (Math.abs(count) >= 1) {
                return format(count, unit);
            }
        }

        return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
    }

    /**
     * @private
     * cache offsets for zones based on the current timestamp when this function is
     * first called. When we are handling a datetime from components like (year,
     * month, day, hour) in a time zone, we need a guess about what the timezone
     * offset is so that we can convert into a UTC timestamp. One way is to find the
     * offset of now in the zone. The actual date may have a different offset (for
     * example, if we handle a date in June while we're in December in a zone that
     * observes DST), but we can check and adjust that.
     * When handling many dates, calculating the offset for now every time is
     * expensive. It's just a guess, so we can cache the offset to use even if we
     * are right on a time change boundary (we'll just correct in the other
     * direction). Using a timestamp from first read is a slight optimization for
     * handling dates close to the current date, since those dates will usually be
     * in the same offset (we could set the timestamp statically, instead). We use a
     * single timestamp for all zones to make things a bit more predictable.
     * This is safe for quickDT (used by local() and utc()) because we don't fill in
     * higher-order units from tsNow (as we do in fromObject, this requires that
     * offset is calculated from tsNow).
     */
    private static _guessOffsetForZone(zone: Zone): number {
        if (!this._zoneOffsetGuessCache.has(zone)) {
            if (this._zoneOffsetTs === undefined) {
                this._zoneOffsetTs = Settings.now();
            }

            this._zoneOffsetGuessCache.set(zone, zone.offset(this._zoneOffsetTs));
        }

        return this._zoneOffsetGuessCache.get(zone);
    }

    /**
     * @private
     */
    private static _lastOpts(argList: (number | DateTimeOptions)[]): [DateTimeOptions, number[]] {
        let opts = {},
            args: number[];
        // There's at least 1 argument and the last position holds the DateTimeOptions
        if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
            opts = argList.pop() as DateTimeOptions;
            args = argList as number[];
        }
        // We expect everything to be number
        else {
            args = Array.from(argList) as number[];
        }
        return [opts, args];
    }

    /**
     * @private
     */
    // this is a dumbed down version of fromObject() that runs about 60% faster
    // but doesn't do any validation, makes a bunch of assumptions about what units
    // are present, and so on.
    private static _quickDT(obj: GregorianDateTime, opts: DateTimeOptions): DateTime {
        const zone = normalizeZone(opts.zone, Settings.defaultZone);
        if (!zone.isValid) {
            return DateTime.invalid(this._unsupportedZone(zone));
        }

        const loc = Locale.fromObject(opts);
        const tsNow = Settings.now();

        let ts, o;

        // assume we have the higher-order units
        if (isDefined(obj.year)) {
            for (const u of
                orderedUnits) {
                if (isUndefined(obj[u])) {
                    obj[u] = defaultUnitValues[u];
                }
            }

            const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
            if (invalid) {

                return DateTime.invalid(invalid);
            }

            const offsetProvis = this._guessOffsetForZone(zone);
            [ts, o] = objToTS(obj, offsetProvis, zone);
        }
        else {
            ts = tsNow;
        }

        return new DateTime({ ts, zone, loc, o });
    }

    /**
     * @private
     */
    private static _unsupportedZone(zone: Zone): Invalid {
        return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
    }

    // PUBLIC

    /**
     * Returns a string representation of this DateTime appropriate for the REPL.
     * @return {string}
     */
    [Symbol.for("nodejs.util.inspect.custom")](): string {
        if (this.isValid) {
            return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
        }
        else {
            return `DateTime { Invalid, reason: ${this.invalidReason} }`;
        }
    }

    /**
     * Returns the difference between two DateTimes as a Duration.
     * @param {DateTime} otherDateTime - the DateTime to compare this one to
     * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
     * @param {Object} opts - options that affect the creation of the Duration
     * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
     * @example
     * var i1 = DateTime.fromISO('1982-05-25T09:45'),
     *     i2 = DateTime.fromISO('1983-10-14T10:30');
     * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
     * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
     * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
     * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
     * @return {Duration}
     */
    diff(otherDateTime: DateTime, unit: DurationUnit | DurationUnit[] = "milliseconds", opts: DurationOptions = {}): Duration {
        if (!this.isValid || !otherDateTime.isValid) {
            const reason: string = (this.invalidReason || otherDateTime.invalidReason) as string; // One of the two is certainly a string

            return Duration.invalid(reason, "created by diffing an invalid DateTime");
        }

        const units = maybeArray(unit).map(Duration.normalizeUnit),
            otherIsLater = otherDateTime.valueOf() > this.valueOf(),
            earlier = otherIsLater ? this : otherDateTime,
            later = otherIsLater ? otherDateTime : this,
            diffed = diff(earlier, later, units, {
                locale: this.locale,
                numberingSystem: this.numberingSystem,
                ...opts
            });

        return otherIsLater ? diffed.negate() : diffed;
    }

    /**
     * Returns the difference between this DateTime and right now.
     * See {@link DateTime#diff}
     * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
     * @param {Object} opts - options that affect the creation of the Duration
     * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
     * @return {Duration}
     */
    diffNow(unit: DurationUnit | DurationUnit[] = "milliseconds", opts: DurationOptions = {}): Duration {
        return this.diff(DateTime.now(), unit, opts);
    }

    /**
     * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
     * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
     * @param {Object} opts - options
     * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
     * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
     * @return {DateTime}
     */
    endOf(unit: DurationUnit, { useLocaleWeeks = false }: { useLocaleWeeks?: boolean } = {}): DateTime {
        return this.plus({ [unit]: 1 })
                   .startOf(unit, { useLocaleWeeks })
                   .minus({ milliseconds: 1 });
    }

    /**
     * Equality check
     * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
     * To compare just the millisecond values, use `+dt1 === +dt2`.
     * @param {DateTime} other - the other DateTime
     */
    equals(other: DateTime): boolean {
        return (
            this.valueOf() === other.valueOf() &&
            this.zone.equals(other.zone) &&
            this._loc.equals(other._loc)
        );
    }

    /**
     * Get the value of unit.
     * @param {string} unit - a unit such as 'minute' or 'day'
     * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
     * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
     * @return {number}
     */
    get(unit: string) {
        return this[unit as keyof DateTime];
    }

    /**
     * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
     * in this DateTime's zone. During DST changes local time can be ambiguous, for example
     * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
     * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
     */
    getPossibleOffsets(): DateTime[] {
        if (!this.isValid || this.isOffsetFixed) {
            return [this];
        }
        const dayMs = 86400000;
        const minuteMs = 60000;
        const localTS = objToLocalTS(this._c);
        const oEarlier = this.zone.offset(localTS - dayMs);
        const oLater = this.zone.offset(localTS + dayMs);

        const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
        const o2 = this.zone.offset(localTS - oLater * minuteMs);
        if (o1 === o2) {
            return [this];
        }
        const ts1 = localTS - o1 * minuteMs;
        const ts2 = localTS - o2 * minuteMs;
        const c1 = tsToObj(ts1, o1);
        const c2 = tsToObj(ts2, o2);
        if (
            c1.hour === c2.hour &&
            c1.minute === c2.minute &&
            c1.second === c2.second &&
            c1.millisecond === c2.millisecond
        ) {
            return [this._clone({ ts: ts1 }), this._clone({ ts: ts2 })];
        }
        return [this];
    }

    /**
     * Return whether this DateTime is in the same unit of time as another DateTime.
     * Higher-order units must also be identical for this function to return `true`.
     * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
     * @param {DateTime} otherDateTime - the other DateTime
     * @param {string} unit - the unit of time to check sameness on
     * @param {Object} opts - options
     * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
     * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
     */
    hasSame(otherDateTime: DateTime, unit: DurationUnit, opts?: { useLocaleWeeks?: boolean }): boolean {
        if (!this.isValid) {
            return false;
        }

        const inputMs = otherDateTime.valueOf();
        const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });

        return +adjustedToZone.startOf(unit) <= inputMs && inputMs <= +adjustedToZone.endOf(unit, opts);
    }

    /**
     * Subtract a period of time to this DateTime and return the resulting DateTime
     * See {@link DateTime#plus}
     * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
     @return {DateTime}
     */
    minus(duration: DurationLike | number): DateTime {
        if (!this.isValid) {
            return this;
        }
        const dur = Duration.fromDurationLike(duration).negate();
        return this._clone(this._adjustTime(dur));
    }

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
    plus(duration: DurationLike | number): DateTime {
        if (!this.isValid) {
            return this;
        }
        const dur = Duration.fromDurationLike(duration);

        return this._clone(this._adjustTime(dur));
    }

    /**
     * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
     * @param {Object} [options] - the options to set
     * @param {string} [options.locale] - ;
     * @param {CalendarSystem} [options.outputCalendar] - ;
     * @param {NumberingSystem} [options.numberingSystem] - ;
     * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
     * @return {DateTime}
     */
    reconfigure(options: LocaleOptions): DateTime {
        const loc = this._loc.clone(options);
        return this._clone({ loc });
    }

    /**
     * Returns the resolved Intl options for this DateTime.
     * This is useful in understanding the behavior of formatting methods
     * @param {Object} opts - the same options as toLocaleString
     * @return {Object}
     */
    resolvedLocaleOptions(opts = {}): { locale: string; numberingSystem: string; outputCalendar: string } {
        const { locale, numberingSystem, calendar } = Formatter.create(
            this._loc.clone(opts),
            opts
        ).resolvedOptions(this);

        return { locale, numberingSystem, outputCalendar: calendar };
    }

    /**
     * "Set" the values of specified units. Returns a newly-constructed DateTime.
     * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
     *
     * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
     * They cannot be mixed with ISO-week units like `weekday`.
     * @param {Object} values - a mapping of units to numbers
     * @example dt.set({ year: 2017 })
     * @example dt.set({ hour: 8, minute: 30 })
     * @example dt.set({ weekday: 5 })
     * @example dt.set({ year: 2005, ordinal: 234 })
     */
    set(values: GenericDateTime | GenericDateTimePlurals): DateTime {
        if (!this.isValid) {
            return this;
        }

        const normalized = normalizeObject(values, normalizeUnit);
        const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
        const settingWeekStuff = isDefined(normalized.weekYear) || isDefined(normalized.weekNumber) || isDefined(normalized.weekday);

        const containsOrdinal = isDefined(normalized.ordinal),
            containsGregorYear = isDefined(normalized.year),
            containsGregorMD = isDefined(normalized.month) || isDefined(normalized.day),
            containsGregor = containsGregorYear || containsGregorMD,
            definiteWeekDef = normalized.weekYear || normalized.weekNumber;

        if ((containsGregor || containsOrdinal) && definiteWeekDef) {
            throw new ConflictingSpecificationError(
                "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
            );
        }

        if (containsGregorMD && containsOrdinal) {
            throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
        }

        let mixed;
        if (settingWeekStuff) {
            mixed = weekToGregorian(
                { ...gregorianToWeek(this._c, minDaysInFirstWeek, startOfWeek), ...normalized },
                minDaysInFirstWeek,
                startOfWeek
            );
        }
        else if (!isUndefined(normalized.ordinal)) {
            mixed = ordinalToGregorian({ ...gregorianToOrdinal(this._c), ...normalized });
        }
        else {
            mixed = { ...this.toObject(), ...normalized };

            // if we didn't set the day, but we ended up on an overflow date,
            // use the last day of the right month
            if (isUndefined(normalized.day)) {
                mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
            }
        }

        const [ts, o] = objToTS(mixed, this._o, this.zone);
        return this._clone({ ts, o });
    }

    /**
     * "Set" the locale. Returns a newly-constructed DateTime.
     * Just a convenient alias for reconfigure({ locale })
     * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
     * @return {DateTime}
     */
    setLocale(locale: string): DateTime {
        return this.reconfigure({ locale });
    }

    /**
     * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
     *
     * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
     * @param {string|Zone} [zone="local"] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link Zone} class.
     * @param {Object} opts - options
     * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
     * @return {DateTime}
     */
    setZone(zone: ZoneLike, { keepLocalTime = false, keepCalendarTime = false }: SetZoneOptions = {}): DateTime {
        zone = normalizeZone(zone, Settings.defaultZone);
        if (zone.equals(this.zone)) {
            return this;
        }
        else if (!zone.isValid) {
            return DateTime.invalid(DateTime._unsupportedZone(zone));
        }
        else {
            let newTS = this._ts;
            if (keepLocalTime || keepCalendarTime) {
                const offsetGuess = zone.offset(this._ts);
                const asObj = this.toObject();
                newTS = objToTS(asObj, offsetGuess, zone)[0];
            }
            return this._clone({ ts: newTS, zone });
        }
    }

    /**
     * "Set" this DateTime to the beginning of a unit of time.
     * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
     * @param {Object} opts - options
     * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
     * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
     * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('week').toISOTime(); //=> '2014-03-03', weeks always start on a Monday
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
     */
    startOf(unit: DurationUnit, { useLocaleWeeks = false }: { useLocaleWeeks?: boolean } = {}): DateTime {
        if (!this.isValid) {
            return this;
        }
        const o: GenericDateTime = {},
            normalizedUnit = Duration.normalizeUnit(unit);
        switch (normalizedUnit) {
            case "years":
                o.month = 1;
            // falls through
            case "quarters":
            case "months":
                o.day = 1;
            // falls through
            case "weeks":
            case "days":
                o.hour = 0;
            // falls through
            case "hours":
                o.minute = 0;
            // falls through
            case "minutes":
                o.second = 0;
            // falls through
            case "seconds":
                o.millisecond = 0;
                break;
            case "milliseconds":
                break;
            // no default, invalid units throw in normalizeUnit()
        }

        if (normalizedUnit === "weeks") {
            if (useLocaleWeeks) {
                const startOfWeek = this.loc.getStartOfWeek();
                const { weekday } = this;
                if (weekday < startOfWeek) {
                    o.weekNumber = this.weekNumber - 1;
                }
                o.weekday = startOfWeek;
            }
            else {
                o.weekday = 1;
            }
        }

        if (normalizedUnit === "quarters") {
            const q = Math.ceil(this.month / 3);
            o.month = (q - 1) * 3 + 1;
        }

        return this.set(o);
    }

    /**
     * Returns a BSON serializable equivalent to this DateTime.
     * @return {Date}
     */
    toBSON(): Date {
        return this.toJSDate();
    }

    /**
     * Returns a string representation of this DateTime formatted according to the specified format string.
     * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
     * Defaults to en-US if no locale has been specified, regardless of the system's locale.
     * @param {string} fmt - the format string
     * @param {Object} opts - opts to override the configuration options on this DateTime
     * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
     * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
     * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
     * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
     * @return {string}
     */
    toFormat(fmt: string, opts: DateTimeOptions = {}): string {
        return this.isValid
            ? Formatter.create(this._loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt)
            : INVALID;
    }

    /**
     * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT
     * Specifically, the string conforms to RFC 1123.
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
     * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
     * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
     * @return {string}
     */
    toHTTP(): string {
        return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
    }

    /**
     * Returns an ISO 8601-compliant string representation of this DateTime
     * @param {Object} options - options
     * @param {boolean} [options.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
     * @param {boolean} [options.suppressSeconds=false] - exclude seconds from the format if they're 0
     * @param {boolean} [options.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {boolean} [options.extendedZone=false] - add the time zone format extension
     * @param {string} [options.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
     * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
     * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
     * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
     * @return {string|null}
     */
    toISO({
              format = "extended",
              suppressSeconds = false,
              suppressMilliseconds = false,
              includeOffset = true,
              extendedZone = false
          }: ToISOTimeOptions = {}): string | null {

        if (!this.isValid) {
            return null;
        }
        const ext = format === "extended";

        return [
            this._toISODate(ext),
            "T",
            this._toISOTime(ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone)
        ].join("");
    }

    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's date component
     * @param {Object} options - options
     * @param {string} [options.format="extended"] - choose between the basic and extended (default) format
     * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
     * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
     * @return {string|null}
     */
    toISODate({ format = "extended" }: { format?: ToISOFormat } = { format: "extended" }): string | null {
        if (!this.isValid) {
            return null;
        }

        return this._toISODate(format === "extended");
    }

    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's time component
     * @param {Object} opts - options
     * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
     * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
     * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
     * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
     * @param {string} [opts.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
     * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
     * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
     * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
     * @return {string}
     */
    toISOTime({
                  suppressMilliseconds = false,
                  suppressSeconds = false,
                  includeOffset = true,
                  includePrefix = false,
                  extendedZone = false,
                  format = "extended"
              }: ToISOTimeOptions = {}): string {
        if (!this.isValid) {
            return null;
        }

        return [
            includePrefix ? "T" : "",
            this._toISOTime(format === "extended", suppressSeconds, suppressMilliseconds, includeOffset, extendedZone)
        ].join("");
    }

    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's week date
     * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
     * @return {string}
     */
    toISOWeekDate(): string {
        return toTechFormat(this, "kkkk-'W'WW-c");
    }

    /**
     * Returns a Javascript Date equivalent to this DateTime.
     * @return {Date}
     */
    toJSDate(): Date {
        return new Date(this.isValid ? this._ts : NaN);
    }

    /**
     * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
     * @return {string}
     */
    toJSON(): string {
        return this.toISO();
    }

    /**
     * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
     *
     * Equivalent to `setZone('local')`
     * @return {DateTime}
     */
    toLocal(): DateTime {
        return this.setZone(Settings.defaultZone);
    }

    /**
     * Returns an array of format "parts", meaning individual tokens along with metadata. This allows callers to post-process individual sections of the formatted output.
     * Defaults to the system's locale if no locale has been specified
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
     * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
     * @example DateTime.now().toLocaleParts(); //=> [
     *                                   //=>   { type: "day", value: "25" },
     *                                   //=>   { type: "literal", value: "/" },
     *                                   //=>   { type: 'month', value: '05' },
     *                                   //=>   { type: "literal", value: "/" },
     *                                   //=>   { type: "year", value: "1982" }
     *                                   //=> ]
     */
    toLocaleParts(opts: Intl.DateTimeFormatOptions & LocaleOptions = {}): Intl.DateTimeFormatPart[] {
        return this.isValid
            ? Formatter.create(this._loc.clone(opts), opts).formatDateTimeParts(this)
            : [];
    }

    /**
     * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
     * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
     * of the DateTime in the assigned locale.
     * Defaults to the system's locale if no locale has been specified
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
     * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
     * @param {Object} opts - opts to override the configuration options on this DateTime
     * @example DateTime.now().toLocaleString(); //=> 4/20/2017
     * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
     * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
     * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
     * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
     * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
     * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
     * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
     * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
     * @return {string}
     */
    toLocaleString(formatOpts: Intl.DateTimeFormatOptions & LocaleOptions = Formats.DATE_SHORT, opts: DateTimeOptions = {}): string {
        return this.isValid
            ? Formatter.create(this._loc.clone(opts), formatOpts).formatDateTime(this)
            : INVALID;
    }

    /**
     * Returns the epoch milliseconds of this DateTime.
     * @return {number}
     */
    toMillis(): number {
        return this.isValid ? this.ts : NaN;
    }

    /**
     * Returns a JavaScript object with this DateTime's year, month, day, and so on.
     * @param opts - options for generating the object
     * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
     * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
     * @return {Object}
     */
    toObject(opts: { includeConfig: boolean } = { includeConfig: !1 }): GregorianDateTime & Partial<LocaleOptions> {
        if (!this.isValid) {
            return {} as GregorianDateTime;
        }

        const base = Object.assign({}, this._c) as GregorianDateTime & Partial<LocaleOptions>;

        if (opts.includeConfig) {
            base.outputCalendar = this.outputCalendar;
            base.numberingSystem = this._loc.numberingSystem;
            base.locale = this._loc.locale;
        }

        return base;
    }

    /**
     * Returns an RFC 2822-compatible string representation of this DateTime
     * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
     * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
     * @return {string}
     */
    toRFC2822(): string {
        return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
    }

    /**
     * Returns a string representation of a time relative to now, such as "in two days". Can only internationalize if your
     * platform supports Intl.RelativeTimeFormat. Rounds down by default.
     * @param {Object} options - options that affect the output
     * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
     * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
     * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"     * @param {boolean} [options.round=true] - whether to round the numbers in the output.
     * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
     * @param {string} [options.locale] - override the locale of this DateTime
     * @param {string} [options.numberingSystem] - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
     * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
     * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
     * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
     * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
     * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
     * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
     */
    toRelative(options: ToRelativeOptions = {}): string {
        if (!this.isValid) {
            return null;
        }
        const base = options.base || DateTime.fromObject({}, { zone: this.zone });
        const padding = options.padding ? (this < base ? -options.padding : options.padding) : 0;
        let units = ["years", "months", "days", "hours", "minutes", "seconds"] as Intl.RelativeTimeFormatUnit[];
        let unit = options.unit;
        if (Array.isArray(options.unit)) {
            units = options.unit;
            unit = void 0;
        }
        return DateTime._diffRelative(
            base,
            this.plus(padding),
            {
                ...options,
                numeric: "always",
                units,
                unit
            }
        );
    }

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
    toRelativeCalendar(options: ToRelativeCalendarOptions = {}): string {
        if (!this.isValid) {
            return null;
        }
        return DateTime._diffRelative(
            options.base || DateTime.fromObject({}, { zone: this.zone }),
            this,
            {
                ...options,
                numeric: "auto" as const,
                units: ["years", "months", "days"] as Intl.RelativeTimeFormatUnit[],
                calendary: true
            }
        );
    }

    /**
     * Returns a string representation of this DateTime appropriate for use in SQL DateTime
     * @param {Object} opts - options
     * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
     * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
     * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
     * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
     * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
     * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
     * @return {string}
     */
    toSQL(opts: ToSQLOptions = {}): string {
        if (!this.isValid) {
            return null;
        }

        return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
    }

    /**
     * Returns a string representation of this DateTime appropriate for use in SQL Date
     * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
     * @return {string}
     */
    toSQLDate(): string {
        if (!this.isValid) {
            return null;
        }

        return this._toISODate(!0);
    }

    /**
     * Returns a string representation of this DateTime appropriate for use in SQL Time
     * @param {Object} opts - options
     * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
     * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
     * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
     * @example DateTime.utc().toSQL() //=> '05:15:16.345'
     * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
     * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
     * @example DateTime.now().toSQL({ includeZone: false }) //=> "05:15:16.345 America/New_York"
     * @return {string}
     */
    toSQLTime({ includeOffset = !0, includeZone = !1, includeOffsetSpace = !0 }: ToSQLOptions = {}): string {
        let fmt = "HH:mm:ss.SSS";

        if (includeZone || includeOffset) {
            includeOffsetSpace && (fmt += " ");
            if (includeZone) {
                fmt += "z";
            }
            else if (includeOffset) {
                fmt += "ZZ";
            }
        }

        return toTechFormat(this, fmt, true);
    }

    /**
     * Returns the epoch seconds of this DateTime.
     * @return {number}
     */
    toSeconds(): number {
        return this.isValid ? this._ts / 1000 : NaN;
    }

    /**
     * Returns a string representation of this DateTime appropriate for debugging
     * @return {string}
     */
    toString(): string {
        return this.isValid ? this.toISO() : INVALID;
    }

    /**
     * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
     *
     * Equivalent to {@link setZone}('utc')
     * @param {number} [offset=0] - optionally, an offset from UTC in minutes
     * @param {Object} [opts={}] - options to pass to `setZone()`
     * @return {DateTime}
     */
    toUTC(offset = 0, opts: SetZoneOptions = {}): DateTime {
        return this.setZone(FixedOffsetZone.instance(offset), opts);
    }

    /**
     * Returns the epoch seconds (as a whole number) of this DateTime.
     * @return {number}
     */
    toUnixInteger(): number {
        return this.isValid ? Math.floor(this.ts / 1000) : NaN;
    }

    /**
     * Return an Interval spanning between this DateTime and another DateTime
     * @param {DateTime} otherDateTime - the other end point of the Interval
     * @return {Interval|DateTime}
     */
    until(otherDateTime: DateTime): Interval | DateTime {
        return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
    }

    /**
     * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
     * @return {number}
     */
    valueOf(): number {
        return this.toMillis();
    }

    // PRIVATE

    /**
     * @private
     */
    /**
     * create a new DT instance by adding a duration, adjusting for DSTs
     * Remember that compared to Luxon.js I don't need to pass the instance as argument here,
     * because it's a private member of the instance itself.
     * Honestly don't know why he didn't do this way!
     * @param dur
     * @private
     */
    private _adjustTime(dur: Duration): { ts: number; o: number } {
        const previousOffset = this._o,
            year = this._c.year + Math.trunc(dur.years),
            month = this._c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3,
            c = {
                ...this._c,
                year,
                month,
                day:
                    Math.min(this._c.day, daysInMonth(year, month)) +
                    Math.trunc(dur.days) +
                    Math.trunc(dur.weeks) * 7
            },
            millisToAdd = Duration.fromObject({
                years: dur.years - Math.trunc(dur.years),
                quarters: dur.quarters - Math.trunc(dur.quarters),
                months: dur.months - Math.trunc(dur.months),
                weeks: dur.weeks - Math.trunc(dur.weeks),
                days: dur.days - Math.trunc(dur.days),
                hours: dur.hours,
                minutes: dur.minutes,
                seconds: dur.seconds,
                milliseconds: dur.milliseconds
            }).as("milliseconds"),
            localTS = objToLocalTS(c);

        let [ts, o] = fixOffset(localTS, previousOffset, this.zone);

        if (millisToAdd !== 0) {
            ts += millisToAdd;
            // that could have changed the offset by going over a DST, but we want to keep the ts the same
            o = this.zone.offset(ts);
        }

        return { ts, o };
    }

    /**
     * @private
     */
    // clone really means, "make a new object with these modifications". all "setters" really use this
    // to create a new object while only changing some of the properties
    private _clone(alts: { ts?: number; zone?: Zone; loc?: Locale; o?: number }): DateTime {
        const current = {
            ts: this._ts,
            zone: this.zone,
            c: this._c,
            o: this._o,
            loc: this._loc,
            invalid: this._invalid || void 0
        };

        return new DateTime({ ...current, ...alts, old: current });
    }

    private _possiblyCachedLocalWeekData(dt: DateTime): WeekDateTime {
        if (!dt._localWeekData) {
            dt._localWeekData = gregorianToWeek(
                dt._c,
                dt.loc.getMinDaysInFirstWeek(),
                dt.loc.getStartOfWeek()
            );
        }
        return dt._localWeekData;
    }

    /**
     * @private
     */
    // we cache week data on the DT object and this method intermediates the cache
    private _possiblyCachedWeekData(dt: DateTime): WeekDateTime {
        if (dt._weekData === null) {
            dt._weekData = gregorianToWeek(dt._c);
        }
        return dt._weekData as WeekDateTime;
    }

    private _toISODate(extended: boolean): string {
        const longFormat = this._c.year > 9999 || this._c.year < 0;
        let c = "";
        if (longFormat && this._c.year >= 0) {
            c += "+";
        }
        c += padStart(this._c.year, longFormat ? 6 : 4);

        if (extended) {
            c += "-";
            c += padStart(this._c.month);
            c += "-";
            c += padStart(this._c.day);
        }
        else {
            c += padStart(this._c.month);
            c += padStart(this._c.day);
        }
        return c;
    }

    private _toISOTime(extended: boolean,
                       suppressSeconds: boolean,
                       suppressMilliseconds: boolean,
                       includeOffset: boolean,
                       extendedZone?: boolean): string {
        let c = padStart(this._c.hour);
        if (extended) {
            c += ":";
            c += padStart(this._c.minute);
            if (this._c.millisecond !== 0 || this._c.second !== 0 || !suppressSeconds) {
                c += ":";
            }
        }
        else {
            c += padStart(this._c.minute);
        }

        if (this._c.millisecond !== 0 || this._c.second !== 0 || !suppressSeconds) {
            c += padStart(this._c.second);

            if (this._c.millisecond !== 0 || !suppressMilliseconds) {
                c += ".";
                c += padStart(this._c.millisecond, 3);
            }
        }

        if (includeOffset) {
            if (this.isOffsetFixed && this.offset === 0 && !extendedZone) {
                c += "Z";
            }
            else if (this._o < 0) {
                c += "-";
                c += padStart(Math.trunc(-this._o / 60));
                c += ":";
                c += padStart(Math.trunc(-this._o % 60));
            }
            else {
                c += "+";
                c += padStart(Math.trunc(this._o / 60));
                c += ":";
                c += padStart(Math.trunc(this._o % 60));
            }
        }

        if (extendedZone) {
            c += "[" + this.zone.ianaName + "]";
        }

        return c;
    }

}

export type DateTimeLike = DateTime | Date | GenericDateTime;
