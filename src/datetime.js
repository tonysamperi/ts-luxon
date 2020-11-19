import Duration, { friendlyDuration } from "./duration";
import Interval from "./interval";
import Settings from "./settings";
import Info from "./info";
import Formatter from "./impl/formatter";
import FixedOffsetZone from "./zones/fixedOffsetZone";
import Locale from "./impl/locale";
import { isUndefined, maybeArray, isDate, isNumber, bestBy, daysInMonth, daysInYear, isLeapYear, weeksInWeekYear, normalizeObject, roundTo, objToLocalTS } from "./impl/util";
import { normalizeZone } from "./impl/zoneUtil";
import diff from "./impl/diff";
import { parseRFC2822Date, parseISODate, parseHTTPDate, parseSQL } from "./impl/regexParser";
import { parseFromTokens, explainFromTokens } from "./impl/tokenParser";
import { gregorianToWeek, weekToGregorian, gregorianToOrdinal, ordinalToGregorian, hasInvalidGregorianData, hasInvalidWeekData, hasInvalidOrdinalData, hasInvalidTimeData } from "./impl/conversions";
import * as Formats from "./impl/formats";
import { InvalidArgumentError, ConflictingSpecificationError, InvalidUnitError, UnitOutOfRangeError, MismatchedWeekdayError, UnparsableStringError, InvalidZoneError } from "./errors";
import SystemZone from "./zones/systemZone";
var MAX_DATE = 8.64e15;
// find the right offset at a given local time. The o input is our guess, which determines which
// offset we'll pick in ambiguous cases (e.g. there are two 3 AMs b/c Fallback DST)
function fixOffset(localTS, o, tz) {
    // Our UTC time is just a guess because our offset is just a guess
    var utcGuess = localTS - o * 60 * 1000;
    // Test whether the zone matches the offset for this ts
    var o2 = tz.offset(utcGuess);
    // If so, offset didn't change and we're done
    if (o === o2) {
        return [utcGuess, o];
    }
    // If not, change the ts by the difference in the offset
    utcGuess -= (o2 - o) * 60 * 1000;
    // If that gives us the local time we want, we're done
    var o3 = tz.offset(utcGuess);
    if (o2 === o3) {
        return [utcGuess, o2];
    }
    // If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
    return [localTS - Math.min(o2, o3) * 60 * 1000, Math.max(o2, o3)];
}
// convert an epoch timestamp into a calendar object with the given offset
function tsToObj(ts, offset) {
    ts += offset * 60 * 1000;
    var d = new Date(ts);
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
function objToTS(obj, offset, zone) {
    return fixOffset(objToLocalTS(obj), offset, zone);
}
// helper useful in turning the results of parsing into real dates
// by handling the zone options
function parseDataToDateTime(parsed, parsedZone, options, format, text) {
    var setZone = options.setZone, zone = options.zone;
    if (parsed && Object.keys(parsed).length !== 0) {
        var interpretationZone = parsedZone || zone, opts = Object.assign({}, options, {
            zone: interpretationZone,
            setZone: undefined
        }), inst = DateTime.fromObject(parsed, opts);
        if (inst !== null)
            return setZone ? inst : inst.setZone(zone);
    }
    if (options.nullOnInvalid)
        return null;
    throw new UnparsableStringError(format, text);
}
// if you want to output a technical format (e.g. RFC 2822), this helper
// helps handle the details
function toTechFormat(dt, format, allowZ) {
    if (allowZ === void 0) { allowZ = true; }
    return Formatter.create(Locale.create("en-US"), {
        allowZ: allowZ,
        forceSimple: true
    }).formatDateTimeFromString(dt, format);
}
// technical time formats (e.g. the time part of ISO 8601), take some options
// and this commonizes their handling
function toTechTimeFormat(dt, _a) {
    var includeOffset = _a.includeOffset, _b = _a.suppressSeconds, suppressSeconds = _b === void 0 ? false : _b, _c = _a.suppressMilliseconds, suppressMilliseconds = _c === void 0 ? false : _c, _d = _a.includeZone, includeZone = _d === void 0 ? false : _d, _e = _a.spaceZone, spaceZone = _e === void 0 ? false : _e, _f = _a.format, format = _f === void 0 ? "extended" : _f;
    var fmt = format === "basic" ? "HHmm" : "HH:mm";
    if (!suppressSeconds || dt.second !== 0 || dt.millisecond !== 0) {
        fmt += format === "basic" ? "ss" : ":ss";
        if (!suppressMilliseconds || dt.millisecond !== 0) {
            fmt += ".SSS";
        }
    }
    if ((includeZone || includeOffset) && spaceZone) {
        fmt += " ";
    }
    if (includeZone) {
        fmt += "z";
    }
    else if (includeOffset) {
        fmt += format === "basic" ? "ZZZ" : "ZZ";
    }
    return toTechFormat(dt, fmt);
}
// defaults for unspecified units in the supported calendars
var defaultUnitValues = {
    year: 0,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
}, defaultWeekUnitValues = {
    weekNumber: 1,
    weekday: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
}, defaultOrdinalUnitValues = {
    ordinal: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
};
// Units in the supported calendars, sorted by bigness
var orderedUnits = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "millisecond"
], orderedWeekUnits = [
    "weekYear",
    "weekNumber",
    "weekday",
    "hour",
    "minute",
    "second",
    "millisecond"
], orderedOrdinalUnits = [
    "year",
    "ordinal",
    "hour",
    "minute",
    "second",
    "millisecond"
];
// standardize case and plurality in units
function normalizeUnit(unit) {
    var pluralMapping = {
        year: "year",
        years: "year",
        month: "month",
        months: "month",
        day: "day",
        days: "day",
        hour: "hour",
        hours: "hour",
        minute: "minute",
        minutes: "minute",
        second: "second",
        seconds: "second",
        millisecond: "millisecond",
        milliseconds: "millisecond",
        weekday: "weekday",
        weekdays: "weekday",
        weeknumber: "weekNumber",
        weeksnumber: "weekNumber",
        weeknumbers: "weekNumber",
        weekyear: "weekYear",
        weekyears: "weekYear",
        ordinal: "ordinal"
    };
    var normalized = pluralMapping[unit.toLowerCase()];
    if (!normalized)
        throw new InvalidUnitError(unit);
    return normalized;
}
function lastOpts(argList) {
    if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
        var options = argList[argList.length - 1];
        var args = Array.from(argList).slice(0, argList.length - 1);
        return [options, args];
    }
    else {
        return [{}, Array.from(argList)];
    }
}
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
var DateTime = /** @class */ (function () {
    /**
     * @access private
     */
    function DateTime(config) {
        // can happen when using plus or minus with 1E8 days resulting in overflows
        if (Number.isNaN(config.ts)) {
            throw new InvalidArgumentError("invalid timestamp");
        }
        var zone = config.zone || Settings.defaultZone;
        if (!zone.isValid) {
            throw new InvalidZoneError(zone.name);
        }
        /**
         * @access private
         */
        this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
        var o, c;
        if (config.old !== undefined && config.old.ts === this.ts && config.old.zone.equals(zone)) {
            o = config.old.o;
            c = config.old.c;
        }
        else {
            o = zone.offset(this.ts);
            c = tsToObj(this.ts, o);
        }
        if (Number.isNaN(c.year))
            throw new InvalidArgumentError("invalid timestamp");
        /**
         * @access private
         */
        this.c = c;
        /**
         * @access private
         */
        this.o = o;
        /**
         * @access private
         */
        this._zone = zone;
        /**
         * @access private
         */
        this.loc = config.loc || Locale.create();
        /**
         * @access private
         */
        this.weekData = undefined;
        /**
         * @access private
         */
        this.isLuxonDateTime = true;
    }
    // CONSTRUCT
    /**
     * Create a DateTime for the current instant, in the system's time zone.
     *
     * Use Settings to override these default values if needed.
     * @example DateTime.now().toISO() //~> now in the ISO format
     * @return {DateTime}
     */
    DateTime.now = function () {
        return DateTime.local();
    };
    /**
     * Create a local DateTime
     * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
     * @param {number} [month=1] - The month, 1-indexed
     * @param {number} [day=1] - The day of the month, 1-indexed
     * @param {number} [hour=0] - The hour of the day, in 24-hour time
     * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
     * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
     * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @example DateTime.local()                                  //~> now
     * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
     * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
     * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
     * @example DateTime.local(2017, 3, 12, { locale: "fr")       //~> 2017-03-12T00:00:00, with a French locale
     * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
     * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
     * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
     * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
     * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
     * @return {DateTime}
     */
    DateTime.local = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a = lastOpts(args), options = _a[0], values = _a[1], year = values[0], month = values[1], day = values[2], hour = values[3], minute = values[4], second = values[5], millisecond = values[6];
        return DateTime.quickDT({ year: year, month: month, day: day, hour: hour, minute: minute, second: second, millisecond: millisecond }, options);
    };
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
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @example DateTime.utc()                                            //~> now
     * @example DateTime.utc(2017)                                        //~> 2017-01-01T00:00:00Z
     * @example DateTime.utc(2017, 3)                                     //~> 2017-03-01T00:00:00Z
     * @example DateTime.utc(2017, 3, 12)                                 //~> 2017-03-12T00:00:00Z
     * @example DateTime.utc(2017, 3, 12, 5)                              //~> 2017-03-12T05:00:00Z
     * @example DateTime.utc(2017, 3, 12, 5, 45)                          //~> 2017-03-12T05:45:00Z
     * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" } )       //~> 2017-03-12T05:45:00Z with a French locale
     * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                      //~> 2017-03-12T05:45:10Z
     * @return {DateTime}
     */
    DateTime.utc = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a = lastOpts(args), options = _a[0], values = _a[1], year = values[0], month = values[1], day = values[2], hour = values[3], minute = values[4], second = values[5], millisecond = values[6];
        options.zone = FixedOffsetZone.utcInstance;
        return DateTime.quickDT({ year: year, month: month, day: day, hour: hour, minute: minute, second: second, millisecond: millisecond }, options);
    };
    /**
     * Create a DateTime from a Javascript Date object. Uses the default zone.
     * @param {Date} date - a Javascript Date object
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone='default'] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - return null on invalid values instead of throwing an error
     * @return {DateTime}
     */
    DateTime.fromJSDate = function (date, options) {
        if (options === void 0) { options = {}; }
        if (!isDate(date) || Number.isNaN(date.valueOf())) {
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("date argument must be a valid Date");
        }
        return new DateTime({
            ts: date.valueOf(),
            zone: normalizeZone(options.zone, Settings.defaultZone),
            loc: Locale.fromObject(options)
        });
    };
    /**
     * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
     * @param {number} milliseconds - a number of milliseconds since 1970 UTC
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone='default'] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - return null on invalid values instead of throwing an error
     * @return {DateTime}
     */
    DateTime.fromMillis = function (milliseconds, options) {
        if (options === void 0) { options = {}; }
        if (!isNumber(milliseconds)) {
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("fromMillis requires a numerical input, but received a " + typeof milliseconds + " with value " + milliseconds);
        }
        if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
            // this isn't perfect because because we can still end up out of range because of additional shifting, but it's a start
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("Timestamp out of range");
        }
        return new DateTime({
            ts: milliseconds,
            zone: normalizeZone(options.zone, Settings.defaultZone),
            loc: Locale.fromObject(options)
        });
    };
    /**
     * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
     * @param {number} seconds - a number of seconds since 1970 UTC
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone='default'] - the zone to place the DateTime into
     * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - return null on invalid values instead of throwing an error
     * @return {DateTime}
     */
    DateTime.fromSeconds = function (seconds, options) {
        if (options === void 0) { options = {}; }
        if (!isNumber(seconds)) {
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("fromSeconds requires a numerical input");
        }
        return new DateTime({
            ts: seconds * 1000,
            zone: normalizeZone(options.zone, Settings.defaultZone),
            loc: Locale.fromObject(options)
        });
    };
    /**
     * Create a DateTime from a Javascript object with keys like 'year' and 'hour' with reasonable defaults.
     * @param {Object} object - the object to create the DateTime from
     * @param {number} obj.year - a year, such as 1987
     * @param {number} obj.month - a month, 1-12
     * @param {number} obj.day - a day of the month, 1-31, depending on the month
     * @param {number} obj.ordinal - day of the year, 1-365 or 366
     * @param {number} obj.weekYear - an ISO week year
     * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
     * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
     * @param {number} obj.hour - hour of the day, 0-23
     * @param {number} obj.minute - minute of the hour, 0-59
     * @param {number} obj.second - second of the minute, 0-59
     * @param {number} obj.millisecond - millisecond of the second, 0-999
     * @param {Object} options - configuration options for the DateTime
     * @param {string|Zone} [options.zone='default'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
     * @param {string} [options.locale='system's locale'] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - return null on invalid values instead of throwing an error
     * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
     * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6, }, {zone: 'utc' }),
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'default' })
     * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
     * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
     * @return {DateTime}
     */
    DateTime.fromObject = function (object, options) {
        if (options === void 0) { options = {}; }
        object = object || {};
        var zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
        var tsNow = Settings.now();
        var normalized, offsetProvis;
        try {
            normalized = normalizeObject(object, normalizeUnit);
            offsetProvis = zoneToUse.offset(tsNow);
        }
        catch (error) {
            if (options.nullOnInvalid)
                return null;
            throw error;
        }
        var containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber, loc = Locale.fromObject(options);
        // cases:
        // just a weekday -> this week's instance of that weekday, no worries
        // (gregorian data or ordinal) + (weekYear or weekNumber) -> error
        // (gregorian month or day) + ordinal -> error
        // otherwise just use weeks or ordinals or gregorian, depending on what's specified
        if ((containsGregor || containsOrdinal) && definiteWeekDef) {
            if (options.nullOnInvalid)
                return null;
            throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
        }
        if (containsGregorMD && containsOrdinal) {
            if (options.nullOnInvalid)
                return null;
            throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
        }
        var useWeekData = definiteWeekDef || (normalized.weekday && !containsGregor);
        // configure ourselves to deal with gregorian dates or week stuff
        var gregorianNow = tsToObj(tsNow, offsetProvis);
        if (useWeekData) {
            var objNow = gregorianToWeek(gregorianNow);
            DateTime.normalizeWithDefaults(objNow, normalized, orderedWeekUnits, defaultWeekUnitValues);
        }
        else if (containsOrdinal) {
            var objNow = gregorianToOrdinal(gregorianNow);
            DateTime.normalizeWithDefaults(objNow, normalized, orderedOrdinalUnits, defaultOrdinalUnitValues);
        }
        else {
            DateTime.normalizeWithDefaults(gregorianNow, normalized, orderedUnits, defaultUnitValues);
        }
        // make sure the values we have are in range
        var error;
        if (useWeekData) {
            error = hasInvalidWeekData(normalized);
        }
        else if (containsOrdinal) {
            error = hasInvalidOrdinalData(normalized);
        }
        else {
            error = hasInvalidGregorianData(normalized);
        }
        error = error || hasInvalidTimeData(normalized);
        if (error) {
            if (options.nullOnInvalid)
                return null;
            throw new UnitOutOfRangeError(error[0], error[1]);
        }
        // compute the actual time
        var gregorian = useWeekData
            ? weekToGregorian(normalized)
            : containsOrdinal
                ? ordinalToGregorian(normalized)
                : normalized, ts = objToTS(gregorian, offsetProvis, zoneToUse)[0], inst = new DateTime({
            ts: ts,
            zone: zoneToUse,
            loc: loc
        });
        // gregorian data + weekday serves only to validate
        if (normalized.weekday && containsGregor && object.weekday !== inst.weekday) {
            if (options.nullOnInvalid)
                return null;
            throw new MismatchedWeekdayError(normalized.weekday, inst.toISO());
        }
        return inst;
    };
    /**
     * Create a DateTime from an ISO 8601 string
     * @param {string} text - the ISO string
     * @param {Object} options - options to affect the creation
     * @param {string|Zone} [options.zone='default'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
     * @param {boolean} [options.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
     * @param {string} [options.locale='system's locale'] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - return null on invalid strings instead of throwing an error
     * @example DateTime.fromISO('2016-05-25T09:08:34.123')
     * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
     * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
     * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
     * @example DateTime.fromISO('2016-W05-4')
     * @return {DateTime}
     */
    DateTime.fromISO = function (text, options) {
        if (options === void 0) { options = {}; }
        var _a = parseISODate(text), vals = _a[0], parsedZone = _a[1];
        return parseDataToDateTime(vals, parsedZone, options, "ISO 8601", text);
    };
    /**
     * Create a DateTime from an RFC 2822 string
     * @param {string} text - the RFC 2822 string
     * @param {Object} options - options to affect the creation
     * @param {string|Zone} [options.zone='default'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
     * @param {boolean} [options.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
     * @param {string} [options.locale='system's locale'] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
     * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
     * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
     * @return {DateTime}
     */
    DateTime.fromRFC2822 = function (text, options) {
        if (options === void 0) { options = {}; }
        var _a = parseRFC2822Date(text), vals = _a[0], parsedZone = _a[1];
        return parseDataToDateTime(vals, parsedZone, options, "RFC 2822", text);
    };
    /**
     * Create a DateTime from an HTTP header date
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
     * @param {string} text - the HTTP header date
     * @param {Object} options - options to affect the creation
     * @param {string|Zone} [options.zone='default'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
     * @param {boolean} [options.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
     * @param {string} [options.locale='system's locale'] - a locale to set on the resulting DateTime instance
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
     * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
     * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
     * @return {DateTime}
     */
    DateTime.fromHTTP = function (text, options) {
        if (options === void 0) { options = {}; }
        var _a = parseHTTPDate(text), vals = _a[0], parsedZone = _a[1];
        return parseDataToDateTime(vals, parsedZone, options, "HTTP", text);
    };
    /**
     * Create a DateTime from an input string and format string.
     * Defaults to en-US if no locale has been specified, regardless of the system's locale.
     * @see https://moment.github.io/luxon/docs/manual/parsing.html#table-of-tokens
     * @param {string} text - the string to parse
     * @param {string} format - the format the string is expected to be in (see the link below for the formats)
     * @param {Object} options - options to affect the creation
     * @param {string|Zone} [options.zone='default'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
     * @param {boolean} [options.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
     * @param {string} [options.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @return {DateTime}
     */
    DateTime.fromFormat = function (text, format, options) {
        if (options === void 0) { options = {}; }
        if (isUndefined(text) || isUndefined(format)) {
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("fromFormat requires an input string and a format");
        }
        var localeToUse = Locale.create(options.locale, options.numberingSystem, options.outputCalendar, true /* defaultToEN */), _a = parseFromTokens(localeToUse, text, format), vals = _a[0], parsedZone = _a[1], invalid = _a[2];
        if (invalid) {
            if (options.nullOnInvalid)
                return null;
            throw new UnparsableStringError(format, text);
        }
        else {
            // Not invalid, vals and parsedZone are not undefined
            return parseDataToDateTime(vals, parsedZone, options, "format " + format, text);
        }
    };
    /**
     * Create a DateTime from a SQL date, time, or datetime
     * Defaults to en-US if no locale has been specified, regardless of the system's locale
     * @param {string} text - the string to parse
     * @param {Object} options - options to affect the creation
     * @param {string|Zone} [options.zone='default'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
     * @param {boolean} [options.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
     * @param {string} [options.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
     * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
     * @param {string} [options.numberingSystem] - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
     * @example DateTime.fromSQL('2017-05-15')
     * @example DateTime.fromSQL('2017-05-15 09:12:34')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
     * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
     * @example DateTime.fromSQL('09:12:34.342')
     * @return {DateTime}
     */
    DateTime.fromSQL = function (text, options) {
        if (options === void 0) { options = {}; }
        var _a = parseSQL(text), vals = _a[0], parsedZone = _a[1];
        return parseDataToDateTime(vals, parsedZone, options, "SQL", text);
    };
    /**
     * Check if an object is a DateTime. Works across context boundaries
     * @param {Object} o
     * @return {boolean}
     */
    DateTime.isDateTime = function (o) {
        return (o && o.isLuxonDateTime) || false;
    };
    // INFO
    /**
     * Get the value of unit.
     * @param {string} unit - a unit such as 'minute' or 'day'
     * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
     * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
     * @return {number}
     */
    DateTime.prototype.get = function (unit) {
        return this[unit];
    };
    Object.defineProperty(DateTime.prototype, "locale", {
        /**
         * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
         *
         * @type {string}
         */
        get: function () {
            return this.loc.locale;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "numberingSystem", {
        /**
         * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
         *
         * @type {string}
         */
        get: function () {
            return this.loc.numberingSystem;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "outputCalendar", {
        /**
         * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
         *
         * @type {string}
         */
        get: function () {
            return this.loc.outputCalendar;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "zone", {
        /**
         * Get the time zone associated with this DateTime.
         * @type {Zone}
         */
        get: function () {
            return this._zone;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "zoneName", {
        /**
         * Get the name of the time zone.
         * @type {string}
         */
        get: function () {
            return this.zone.name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "year", {
        /**
         * Get the year
         * @example DateTime.local(2017, 5, 25).year //=> 2017
         * @type {number}
         */
        get: function () {
            return this.c.year;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "quarter", {
        /**
         * Get the quarter
         * @example DateTime.local(2017, 5, 25).quarter //=> 2
         * @type {number}
         */
        get: function () {
            return Math.ceil(this.c.month / 3);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "month", {
        /**
         * Get the month (1-12).
         * @example DateTime.local(2017, 5, 25).month //=> 5
         * @type {number}
         */
        get: function () {
            return this.c.month;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "day", {
        /**
         * Get the day of the month (1-30ish).
         * @example DateTime.local(2017, 5, 25).day //=> 25
         * @type {number}
         */
        get: function () {
            return this.c.day;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "hour", {
        /**
         * Get the hour of the day (0-23).
         * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
         * @type {number}
         */
        get: function () {
            return this.c.hour;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "minute", {
        /**
         * Get the minute of the hour (0-59).
         * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
         * @type {number}
         */
        get: function () {
            return this.c.minute;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "second", {
        /**
         * Get the second of the minute (0-59).
         * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
         * @type {number}
         */
        get: function () {
            return this.c.second;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "millisecond", {
        /**
         * Get the millisecond of the second (0-999).
         * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
         * @type {number}
         */
        get: function () {
            return this.c.millisecond;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weekYear", {
        /**
         * Get the week year
         * @see https://en.wikipedia.org/wiki/ISO_week_date
         * @example DateTime.local(2014, 11, 31).weekYear //=> 2015
         * @type {number}
         */
        get: function () {
            return this.possiblyCachedWeekData().weekYear;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weekNumber", {
        /**
         * Get the week number of the week year (1-52ish).
         * @see https://en.wikipedia.org/wiki/ISO_week_date
         * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
         * @type {number}
         */
        get: function () {
            return this.possiblyCachedWeekData().weekNumber;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weekday", {
        /**
         * Get the day of the week.
         * 1 is Monday and 7 is Sunday
         * @see https://en.wikipedia.org/wiki/ISO_week_date
         * @example DateTime.local(2014, 11, 31).weekday //=> 4
         * @type {number}
         */
        get: function () {
            return this.possiblyCachedWeekData().weekday;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "ordinal", {
        /**
         * Get the ordinal (meaning the day of the year)
         * @example DateTime.local(2017, 5, 25).ordinal //=> 145
         * @type {number}
         */
        get: function () {
            return gregorianToOrdinal(this.c).ordinal;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "monthShort", {
        /**
         * Get the human readable short month name, such as 'Oct'.
         * Defaults to the system's locale if no locale has been specified
         * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
         * @type {string}
         */
        get: function () {
            return Info.months("short", { locale: this.locale })[this.month - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "monthLong", {
        /**
         * Get the human readable long month name, such as 'October'.
         * Defaults to the system's locale if no locale has been specified
         * @example DateTime.local(2017, 10, 30).monthLong //=> October
         * @type {string}
         */
        get: function () {
            return Info.months("long", { locale: this.locale })[this.month - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weekdayShort", {
        /**
         * Get the human readable short weekday, such as 'Mon'.
         * Defaults to the system's locale if no locale has been specified
         * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
         * @type {string}
         */
        get: function () {
            return Info.weekdays("short", { locale: this.locale })[this.weekday - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weekdayLong", {
        /**
         * Get the human readable long weekday, such as 'Monday'.
         * Defaults to the system's locale if no locale has been specified
         * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
         * @type {string}
         */
        get: function () {
            return Info.weekdays("long", { locale: this.locale })[this.weekday - 1];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "offset", {
        /**
         * Get the UTC offset of this DateTime in minutes
         * @example DateTime.now().offset //=> -240
         * @example DateTime.utc().offset //=> 0
         * @type {number}
         */
        get: function () {
            return this.zone.offset(this.ts);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "offsetNameShort", {
        /**
         * Get the short human name for the zone's current offset, for example "EST" or "EDT".
         * Defaults to the system's locale if no locale has been specified
         * @type {string}
         */
        get: function () {
            return this.zone.offsetName(this.ts, {
                format: "short",
                locale: this.locale
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "offsetNameLong", {
        /**
         * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
         * Defaults to the system's locale if no locale has been specified
         * @type {string}
         */
        get: function () {
            return this.zone.offsetName(this.ts, {
                format: "long",
                locale: this.locale
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "isOffsetFixed", {
        /**
         * Get whether this zone's offset ever changes, as in a DST.
         * @type {boolean}
         */
        get: function () {
            return this.zone.isUniversal;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "isInDST", {
        /**
         * Get whether the DateTime is in a DST.
         * @type {boolean}
         */
        get: function () {
            return (this.offset > this.set({ month: 12 }).offset || this.offset > this.set({ month: 6 }).offset);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "isInLeapYear", {
        /**
         * Returns true if this DateTime is in a leap year, false otherwise
         * @example DateTime.local(2016).isInLeapYear //=> true
         * @example DateTime.local(2013).isInLeapYear //=> false
         * @type {boolean}
         */
        get: function () {
            return isLeapYear(this.year);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "daysInMonth", {
        /**
         * Returns the number of days in this DateTime's month
         * @example DateTime.local(2016, 2).daysInMonth //=> 29
         * @example DateTime.local(2016, 3).daysInMonth //=> 31
         * @type {number}
         */
        get: function () {
            return daysInMonth(this.year, this.month);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "daysInYear", {
        /**
         * Returns the number of days in this DateTime's year
         * @example DateTime.local(2016).daysInYear //=> 366
         * @example DateTime.local(2013).daysInYear //=> 365
         * @type {number}
         */
        get: function () {
            return daysInYear(this.year);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime.prototype, "weeksInWeekYear", {
        /**
         * Returns the number of weeks in this DateTime's year
         * @see https://en.wikipedia.org/wiki/ISO_week_date
         * @example DateTime.local(2004).weeksInWeekYear //=> 53
         * @example DateTime.local(2013).weeksInWeekYear //=> 52
         * @type {number}
         */
        get: function () {
            return weeksInWeekYear(this.weekYear);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the resolved Intl options for this DateTime.
     * This is useful in understanding the behavior of formatting methods
     * @return {Object}
     */
    DateTime.prototype.resolvedLocaleOptions = function () {
        var _a = Formatter.create(this.loc).resolvedOptions(this), locale = _a.locale, ns = _a.numberingSystem, calendar = _a.calendar;
        var numberingSystem = ns;
        var outputCalendar = calendar;
        return { locale: locale, numberingSystem: numberingSystem, outputCalendar: outputCalendar };
    };
    // TRANSFORM
    /**
     * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
     *
     * Equivalent to {@link DateTime#setZone}('utc')
     * @param {number} [offset=0] - optionally, an offset from UTC in minutes
     * @param {Object} [options={}] - options to pass to `setZone()`
     * @return {DateTime}
     */
    DateTime.prototype.toUTC = function (offset, options) {
        if (offset === void 0) { offset = 0; }
        if (options === void 0) { options = {}; }
        return this.setZone(FixedOffsetZone.instance(offset), options);
    };
    /**
     * "Set" the DateTime's zone to the system's time zone. Returns a newly-constructed DateTime.
     * The system time zone is the one set on the machine where this code gets executed.
     *
     * Equivalent to `setZone("system")`
     * @return {DateTime}
     */
    DateTime.prototype.toSystemZone = function () {
        return this.setZone(SystemZone.instance);
    };
    /**
     * "Set" the DateTime's zone to the default zone. Returns a newly-constructed DateTime.
     * The default time zone is used when creating new DateTimes, unless otherwise specified.
     * It defaults to the system's time zone, but can be overriden in `Settings`.
     *
     * Equivalent to `setZone("default")`
     * @return {DateTime}
     */
    DateTime.prototype.toDefaultZone = function () {
        return this.setZone(Settings.defaultZone);
    };
    /**
     * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
     *
     * By default, the setter keeps the underlying instant the same (as in, the same timestamp), but the new instance will report different local time and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toSystemZone} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
     * @param {string|Zone} [zone='default'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'default', 'system' or 'utc'. You may also supply an instance of a {@link Zone} class.
     * @param {Object} options - options
     * @param {boolean} [options.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
     * @return {DateTime}
     */
    DateTime.prototype.setZone = function (zone, _a) {
        var _b = (_a === void 0 ? {} : _a).keepLocalTime, keepLocalTime = _b === void 0 ? false : _b;
        zone = normalizeZone(zone, Settings.defaultZone);
        if (zone.equals(this.zone)) {
            return this;
        }
        else if (!zone.isValid) {
            throw new InvalidZoneError(zone.name);
        }
        else {
            var newTS = this.ts;
            if (keepLocalTime) {
                var offsetGuess = zone.offset(this.ts);
                var asObj = this.toObject();
                newTS = objToTS(asObj, offsetGuess, zone)[0];
            }
            return this.clone({ ts: newTS, zone: zone });
        }
    };
    /**
     * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
     * @param {Object} [options] - the options to set
     * @param {string} [options.locale] - ;
     * @param {CalendarSystem} [options.outputCalendar] - ;
     * @param {NumberingSystem} [options.numberingSystem] - ;
     * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
     * @return {DateTime}
     */
    DateTime.prototype.reconfigure = function (options) {
        var loc = this.loc.clone(options);
        return this.clone({ loc: loc });
    };
    /**
     * "Set" the locale. Returns a newly-constructed DateTime.
     * Just a convenient alias for reconfigure({ locale })
     * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
     * @return {DateTime}
     */
    DateTime.prototype.setLocale = function (locale) {
        return this.reconfigure({ locale: locale });
    };
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
    DateTime.prototype.set = function (values) {
        var normalized = normalizeObject(values, normalizeUnit), settingWeekStuff = !isUndefined(normalized.weekYear) ||
            !isUndefined(normalized.weekNumber) ||
            !isUndefined(normalized.weekday);
        var mixed;
        if (settingWeekStuff) {
            mixed = weekToGregorian(Object.assign(gregorianToWeek(this.c), normalized));
        }
        else if (!isUndefined(normalized.ordinal)) {
            mixed = ordinalToGregorian(Object.assign(gregorianToOrdinal(this.c), normalized));
        }
        else {
            mixed = Object.assign(this.toObject(), normalized);
            // if we didn't set the day but we ended up on an overflow date,
            // use the last day of the right month
            if (isUndefined(normalized.day)) {
                mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
            }
        }
        var _a = objToTS(mixed, this.o, this.zone), ts = _a[0], o = _a[1];
        return this.clone({ ts: ts, o: o });
    };
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
    DateTime.prototype.plus = function (duration) {
        var dur = friendlyDuration(duration);
        return this.clone(this.adjustTime(dur));
    };
    /**
     * Subtract a period of time to this DateTime and return the resulting DateTime
     * See {@link DateTime#plus}
     * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
     @return {DateTime}
    */
    DateTime.prototype.minus = function (duration) {
        var dur = friendlyDuration(duration).negate();
        return this.clone(this.adjustTime(dur));
    };
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
    DateTime.prototype.startOf = function (unit) {
        var o = {}, normalizedUnit = Duration.normalizeUnit(unit);
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
            o.weekday = 1;
        }
        if (normalizedUnit === "quarters") {
            var q = Math.ceil(this.month / 3);
            o.month = (q - 1) * 3 + 1;
        }
        return this.set(o);
    };
    /**
     * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
     * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
     * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
     * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
     * @return {DateTime}
     */
    DateTime.prototype.endOf = function (unit) {
        var _a;
        return this.plus((_a = {}, _a[unit] = 1, _a))
            .startOf(unit)
            .minus({ milliseconds: 1 });
    };
    // OUTPUT
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
    DateTime.prototype.toFormat = function (format, options) {
        if (options === void 0) { options = {}; }
        return Formatter.create(this.loc.redefaultToEN(options)).formatDateTimeFromString(this, format);
    };
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
    DateTime.prototype.toLocaleString = function (options) {
        if (options === void 0) { options = Formats.DATE_SHORT; }
        return Formatter.create(this.loc, options).formatDateTime(this);
    };
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
    DateTime.prototype.toLocaleParts = function (options) {
        if (options === void 0) { options = {}; }
        return Formatter.create(this.loc, options).formatDateTimeParts(this);
    };
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
    DateTime.prototype.toISO = function (options) {
        if (options === void 0) { options = {}; }
        return this.toISODate({ format: options.format }) + "T" + this.toISOTime(options);
    };
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's date component
     * @param {Object} options - options
     * @param {string} [options.format='extended'] - choose between the basic and extended format
     * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
     * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
     * @return {string}
     */
    DateTime.prototype.toISODate = function (options) {
        if (options === void 0) { options = { format: "extended" }; }
        var fmt = options.format === "basic" ? "yyyyMMdd" : "yyyy-MM-dd";
        if (this.year > 9999) {
            fmt = "+" + fmt;
        }
        return toTechFormat(this, fmt);
    };
    /**
     * Returns an ISO 8601-compliant string representation of this DateTime's week date
     * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
     * @return {string}
     */
    DateTime.prototype.toISOWeekDate = function () {
        return toTechFormat(this, "kkkk-[W]WW-c");
    };
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
    DateTime.prototype.toISOTime = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.suppressMilliseconds, suppressMilliseconds = _c === void 0 ? false : _c, _d = _b.suppressSeconds, suppressSeconds = _d === void 0 ? false : _d, _e = _b.includeOffset, includeOffset = _e === void 0 ? true : _e, _f = _b.format, format = _f === void 0 ? "extended" : _f;
        return toTechTimeFormat(this, {
            suppressSeconds: suppressSeconds,
            suppressMilliseconds: suppressMilliseconds,
            includeOffset: includeOffset,
            format: format
        });
    };
    /**
     * Returns an RFC 2822-compatible string representation of this DateTime, always in UTC
     * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
     * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
     * @return {string}
     */
    DateTime.prototype.toRFC2822 = function () {
        return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
    };
    /**
     * Returns a string representation of this DateTime appropriate for use in HTTP headers.
     * Specifically, the string conforms to RFC 1123.
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
     * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
     * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
     * @return {string}
     */
    DateTime.prototype.toHTTP = function () {
        return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss [GMT]");
    };
    /**
     * Returns a string representation of this DateTime appropriate for use in SQL Date
     * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
     * @return {string}
     */
    DateTime.prototype.toSQLDate = function () {
        return toTechFormat(this, "yyyy-MM-dd");
    };
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
    DateTime.prototype.toSQLTime = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.includeOffset, includeOffset = _c === void 0 ? true : _c, _d = _b.includeZone, includeZone = _d === void 0 ? false : _d;
        return toTechTimeFormat(this, {
            includeOffset: includeOffset,
            includeZone: includeZone,
            spaceZone: true
        });
    };
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
    DateTime.prototype.toSQL = function (options) {
        if (options === void 0) { options = {}; }
        return this.toSQLDate() + " " + this.toSQLTime(options);
    };
    /**
     * Returns a string representation of this DateTime appropriate for debugging
     * @return {string}
     */
    DateTime.prototype.toString = function () {
        return this.toISO();
    };
    /**
     * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
     * @return {number}
     */
    DateTime.prototype.valueOf = function () {
        return this.toMillis();
    };
    /**
     * Returns the epoch milliseconds of this DateTime.
     * @return {number}
     */
    DateTime.prototype.toMillis = function () {
        return this.ts;
    };
    /**
     * Returns the epoch seconds of this DateTime.
     * @return {number}
     */
    DateTime.prototype.toSeconds = function () {
        return this.ts / 1000;
    };
    /**
     * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
     * @return {string}
     */
    DateTime.prototype.toJSON = function () {
        return this.toISO();
    };
    /**
     * Returns a BSON serializable equivalent to this DateTime.
     * @return {Date}
     */
    DateTime.prototype.toBSON = function () {
        return this.toJSDate();
    };
    /**
     * Returns a Javascript object with this DateTime's year, month, day, and so on.
     * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
     * @return {Object}
     */
    DateTime.prototype.toObject = function () {
        return Object.assign({}, this.c);
    };
    /**
     * Returns a Javascript Date equivalent to this DateTime.
     * @return {Date}
     */
    DateTime.prototype.toJSDate = function () {
        return new Date(this.ts);
    };
    /**
     * Return the difference between two DateTimes as a Duration.
     * @param {DateTime} other - the DateTime to compare this one to
     * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
     * @param {Object} options - options that affect the creation of the Duration
     * @param {string} [options.locale=locale()] - the locale to use
     * @param {string} [options.numberingSystem=numberingSystem()] - the numbering system to use
     * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on error instead of throwing
     * @example
     * var i1 = DateTime.fromISO('1982-05-25T09:45'),
     *     i2 = DateTime.fromISO('1983-10-14T10:30');
     * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
     * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
     * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
     * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
     * @return {Duration}
     */
    DateTime.prototype.diff = function (other, unit, options) {
        if (unit === void 0) { unit = "milliseconds"; }
        if (options === void 0) { options = {}; }
        var durOpts = Object.assign({ locale: this.locale, numberingSystem: this.numberingSystem }, options, { nullOnInvalid: false });
        var units;
        try {
            units = maybeArray(unit).map(Duration.normalizeUnit);
            if (units.length === 0)
                throw new InvalidArgumentError("At least one unit must be specified");
        }
        catch (error) {
            if (options.nullOnInvalid)
                return null;
            throw error;
        }
        var otherIsLater = other.valueOf() > this.valueOf(), earlier = otherIsLater ? this : other, later = otherIsLater ? other : this, diffed = diff(earlier, later, units, durOpts);
        return otherIsLater ? diffed.negate() : diffed;
    };
    /**
     * Return the difference between this DateTime and right now.
     * See {@link DateTime#diff}
     * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
     * @param {Object} options - options that affect the creation of the Duration
     * @param {string} [options.locale=locale()] - the locale to use
     * @param {string} [options.numberingSystem=numberingSystem()] - the numbering system to use
     * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
     * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on error instead of throwing
     * @return {Duration}
     */
    DateTime.prototype.diffNow = function (unit, options) {
        if (unit === void 0) { unit = "milliseconds"; }
        if (options === void 0) { options = {}; }
        return this.diff(DateTime.now(), unit, options);
    };
    /**
     * Return an Interval spanning between this DateTime and another DateTime
     * @param {DateTime} other - the other end point of the Interval
     * @return {Interval}
     */
    DateTime.prototype.until = function (other) {
        return Interval.fromDateTimes(this, other);
    };
    /**
     * Return whether this DateTime is in the same unit of time as another DateTime
     * @param {DateTime} other - the other DateTime
     * @param {string} unit - the unit of time to check sameness on
     * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if both have the same calendar day
     * @return {boolean}
     */
    DateTime.prototype.hasSame = function (other, unit) {
        if (Duration.normalizeUnit(unit) === "milliseconds") {
            return this.valueOf() === other.valueOf();
        }
        else {
            var inputMs = other.valueOf();
            return this.startOf(unit).valueOf() <= inputMs && inputMs <= this.endOf(unit).valueOf();
        }
    };
    /**
     * Equality check
     * Two DateTimes are equal iff they represent the same millisecond and have the same zone and location.
     * To compare just the millisecond values, use `+dt1 === +dt2`.
     * @param {DateTime} other - the other DateTime
     * @return {boolean}
     */
    DateTime.prototype.equals = function (other) {
        return (this.valueOf() === other.valueOf() &&
            this.zone.equals(other.zone) &&
            this.loc.equals(other.loc));
    };
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
    DateTime.prototype.toRelative = function (options) {
        if (options === void 0) { options = {}; }
        var base = options.base || DateTime.fromObject({}, { zone: this.zone });
        var padding = options.padding ? (this < base ? -options.padding : options.padding) : 0;
        return DateTime.diffRelative(base, this.plus({ milliseconds: padding }), Object.assign(options, {
            numeric: "always",
            units: [
                "years",
                "months",
                "days",
                "hours",
                "minutes",
                "seconds"
            ],
            calendary: false
        }));
    };
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
    DateTime.prototype.toRelativeCalendar = function (options) {
        if (options === void 0) { options = {}; }
        return DateTime.diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, Object.assign(options, {
            numeric: "auto",
            units: ["years", "months", "days"],
            calendary: true
        }));
    };
    /**
     * Return the min of several date times
     * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
     * @return {DateTime} the min DateTime, or undefined if called with no arguments
     */
    DateTime.min = function () {
        var dateTimes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dateTimes[_i] = arguments[_i];
        }
        if (!dateTimes.every(DateTime.isDateTime)) {
            throw new InvalidArgumentError("min requires all arguments be DateTimes");
        }
        if (dateTimes.length === 0)
            return undefined;
        return bestBy(dateTimes, function (i) { return i.valueOf(); }, Math.min);
    };
    /**
     * Return the max of several date times
     * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
     * @return {DateTime} the max DateTime, or undefined if called with no arguments
     */
    DateTime.max = function () {
        var dateTimes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dateTimes[_i] = arguments[_i];
        }
        if (!dateTimes.every(DateTime.isDateTime)) {
            throw new InvalidArgumentError("max requires all arguments be DateTimes");
        }
        if (dateTimes.length === 0)
            return undefined;
        return bestBy(dateTimes, function (i) { return i.valueOf(); }, Math.max);
    };
    // MISC
    /**
     * Explain how a string would be parsed by fromFormat()
     * @param {string} text - the string to parse
     * @param {string} format - the format the string is expected to be in (see description)
     * @param {Object} options - options taken by fromFormat()
     * @return {Object}
     */
    DateTime.fromFormatExplain = function (text, format, options) {
        if (options === void 0) { options = {}; }
        var localeToUse = Locale.create(options.locale, options.numberingSystem, options.outputCalendar, true /* defaultToEN */);
        return explainFromTokens(localeToUse, text, format);
    };
    Object.defineProperty(DateTime, "DATE_SHORT", {
        // FORMAT PRESETS
        /**
         * {@link DateTime#toLocaleString} format like 10/14/1983
         * @type {Object}
         */
        get: function () {
            return Formats.DATE_SHORT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATE_MED", {
        /**
         * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
         * @type {Object}
         */
        get: function () {
            return Formats.DATE_MED;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATE_MED_WITH_WEEKDAY", {
        /**
         * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
         * @type {Object}
         */
        get: function () {
            return Formats.DATE_MED_WITH_WEEKDAY;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATE_FULL", {
        /**
         * {@link DateTime#toLocaleString} format like 'October 14, 1983'
         * @type {Object}
         */
        get: function () {
            return Formats.DATE_FULL;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATE_HUGE", {
        /**
         * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
         * @type {Object}
         */
        get: function () {
            return Formats.DATE_HUGE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_SIMPLE", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_SIMPLE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_WITH_SHORT_OFFSET", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_WITH_SHORT_OFFSET;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_WITH_LONG_OFFSET", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_WITH_LONG_OFFSET;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_24_SIMPLE", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_24_SIMPLE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_24_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_24_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_24_WITH_SHORT_OFFSET", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_24_WITH_SHORT_OFFSET;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "TIME_24_WITH_LONG_OFFSET", {
        /**
         * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
         * @type {Object}
         */
        get: function () {
            return Formats.TIME_24_WITH_LONG_OFFSET;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_SHORT", {
        /**
         * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_SHORT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_SHORT_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_SHORT_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_MED", {
        /**
         * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_MED;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_MED_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_MED_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_MED_WITH_WEEKDAY", {
        /**
         * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_MED_WITH_WEEKDAY;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_FULL", {
        /**
         * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_FULL;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_FULL_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_FULL_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_HUGE", {
        /**
         * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_HUGE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateTime, "DATETIME_HUGE_WITH_SECONDS", {
        /**
         * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
         * @type {Object}
         */
        get: function () {
            return Formats.DATETIME_HUGE_WITH_SECONDS;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @private
     */
    //* *************************** *//
    // Static private helper methods //
    //* *************************** *//
    // we cache week data on the DT object and this intermediates the cache
    DateTime.prototype.possiblyCachedWeekData = function () {
        if (this.weekData === undefined) {
            this.weekData = gregorianToWeek(this.c);
        }
        return this.weekData;
    };
    /**
     * @private
     */
    // clone really means, "make a new object with these modifications". all "setters" really use this
    // to create a new object while only changing some of the properties
    DateTime.prototype.clone = function (alts) {
        var current = {
            ts: this.ts,
            zone: this.zone,
            c: this.c,
            o: this.o,
            loc: this.loc
        };
        return new DateTime(Object.assign({}, current, alts, { old: current }));
    };
    /**
     * @private
     */
    // this is a dumbed down version of fromObject() that runs about 60% faster
    // but doesn't do any validation, makes a bunch of assumptions about what units
    // are present, and so on.
    DateTime.quickDT = function (obj, options) {
        var zone = normalizeZone(options.zone, Settings.defaultZone), loc = Locale.fromObject(options), tsNow = Settings.now();
        var ts;
        // assume we have the higher-order units
        if (!isUndefined(obj.year)) {
            for (var _i = 0, orderedUnits_1 = orderedUnits; _i < orderedUnits_1.length; _i++) {
                var u = orderedUnits_1[_i];
                if (isUndefined(obj[u])) {
                    obj[u] = defaultUnitValues[u];
                }
            }
            var invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
            if (invalid) {
                if (options.nullOnInvalid)
                    return null;
                throw new UnitOutOfRangeError(invalid[0], invalid[1]);
            }
            var offsetProvis = zone.offset(tsNow);
            ts = objToTS(obj, offsetProvis, zone)[0];
        }
        else {
            ts = tsNow;
        }
        return new DateTime({ ts: ts, zone: zone, loc: loc });
    };
    /**
     * @private
     */
    // create a new DT instance by adding a duration, adjusting for DSTs
    DateTime.prototype.adjustTime = function (dur) {
        var previousOffset = this.o, year = this.c.year + Math.trunc(dur.years), month = this.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = Object.assign({}, this.c, {
            year: year,
            month: month,
            day: Math.min(this.c.day, daysInMonth(year, month)) +
                Math.trunc(dur.days) +
                Math.trunc(dur.weeks) * 7
        }), millisToAdd = Duration.fromObject({
            years: dur.years - Math.trunc(dur.years),
            quarters: dur.quarters - Math.trunc(dur.quarters),
            months: dur.months - Math.trunc(dur.months),
            weeks: dur.weeks - Math.trunc(dur.weeks),
            days: dur.days - Math.trunc(dur.days),
            hours: dur.hours,
            minutes: dur.minutes,
            seconds: dur.seconds,
            milliseconds: dur.milliseconds
        }).as("milliseconds"), localTS = objToLocalTS(c);
        var _a = fixOffset(localTS, previousOffset, this.zone), ts = _a[0], o = _a[1];
        if (millisToAdd !== 0) {
            ts += millisToAdd;
            // that could have changed the offset by going over a DST, but we want to keep the ts the same
            o = this.zone.offset(ts);
        }
        return { ts: ts, o: o };
    };
    /**
     * @private
     */
    DateTime.normalizeWithDefaults = function (objNow, normalized, units, defaultValues) {
        // set default values for missing stuff in object
        var foundFirst = false;
        for (var _i = 0, units_1 = units; _i < units_1.length; _i++) {
            var u = units_1[_i];
            var v = normalized[u];
            if (!isUndefined(v)) {
                foundFirst = true;
            }
            else if (foundFirst) {
                normalized[u] = defaultValues[u];
            }
            else {
                normalized[u] = objNow[u];
            }
        }
    };
    /**
     * @private
     */
    DateTime.diffRelative = function (start, end, options) {
        var round = isUndefined(options.round) ? true : options.round, format = function (c, unit) {
            c = roundTo(c, round || options.calendary ? 0 : 2, true);
            var rtfOptions = { numeric: options.numeric };
            if (options.style)
                rtfOptions.style = options.style;
            var formatter = end.loc.clone(options).relFormatter(rtfOptions);
            return formatter.format(c, unit);
        }, differ = function (unit) {
            if (options.calendary) {
                if (!end.hasSame(start, unit)) {
                    return end
                        .startOf(unit)
                        .diff(start.startOf(unit), unit)
                        .get(unit);
                }
                else
                    return 0;
            }
            else {
                return end.diff(start, unit).get(unit);
            }
        };
        if (options.unit) {
            return format(differ(options.unit), options.unit);
        }
        for (var _i = 0, _a = options.units; _i < _a.length; _i++) {
            var unit = _a[_i];
            var count = differ(unit);
            if (Math.abs(count) >= 1) {
                return format(count, unit);
            }
        }
        return format(0, options.units[options.units.length - 1]);
    };
    return DateTime;
}());
export default DateTime;
//# sourceMappingURL=datetime.js.map