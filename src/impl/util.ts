/*
 This is just a junk drawer, containing anything used across multiple classes.
 Because Luxon is small(ish), this should stay small, and we won't worry about splitting
 it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
 */

import { InvalidArgumentError } from "../errors.js";
import { TimeObject, GregorianDateTime, GenericDateTimeExtended, ToRelativeOptions } from "../types/datetime.js";
import { ZoneOffsetFormat } from "../types/zone.js";
import { NormalizedDurationUnit, NormalizedHumanDurationUnit } from "../types/duration.js";
import { Settings } from "../settings.js";
import { dayOfWeek, isoWeekdayToLocal } from "./conversions.js";
import { WeekSettings } from "../types/locale.js";

/**
 * @private
 */

// TYPES
export function isDefined(o: unknown): boolean {
    return typeof o !== "undefined";
}

export function isUndefined(o: unknown): o is undefined {
    return typeof o === "undefined";
}

export function isNumber(o: unknown): o is number {
    return typeof o === "number";
}

export function isInteger(o: unknown): boolean {
    return isNumber(o) && o % 1 === 0;
}

export function isString(o: unknown): o is string {
    return typeof o === "string";
}

export function isDate(o: unknown): o is Date {
    return Object.prototype.toString.call(o) === "[object Date]";
}

// CAPABILITIES

export function hasRelative(): boolean {
    try {
        return typeof Intl !== "undefined" && !!(Intl as any).RelativeTimeFormat;
    }
    catch (e) {
        return false;
    }
}

export function hasLocaleWeekInfo(): boolean {
    try {
        return (
            typeof Intl !== "undefined" &&
            !!Intl.Locale &&
            ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype)
        );
    }
    catch (e) {
        return false;
    }
}

// OBJECTS AND ARRAYS

export function maybeArray<T>(thing: T | T[]): T[] {
    return Array.isArray(thing) ? thing : [thing];
}

export function bestBy<T, U>(arr: T[], by: (a: T) => U, compare: (a: U, b: U) => U): T | void {
    if (arr.length === 0) {
        return void 0;
    }

    const bestResult: [U, T] = arr.reduce<[U, T]>((best: [U, T], next: T): [U, T] => {
        const pair: [U, T] = [by(next), next];
        if (compare(best[0], pair[0]) === best[0]) {
            return best;
        }

        return pair;
    }, [by(arr[0]), arr[0]]);

    return bestResult[1];
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce<Partial<Pick<T, K>>>((a, k) => {
        a[k] = obj[k];
        return a;
    }, {}) as Pick<T, K>;
}

export function validateWeekSettings(settings?: WeekSettings | void): WeekSettings | void {
    if (!settings) {
        return void 0;
    }
    else if (typeof settings !== "object") {
        throw new InvalidArgumentError("Week settings must be an object");
    }
    else {
        if (
            !integerBetween(settings.firstDay, 1, 7) ||
            !integerBetween(settings.minimalDays, 1, 7) ||
            !Array.isArray(settings.weekend) ||
            settings.weekend.some((v) => !integerBetween(v, 1, 7))
        ) {
            throw new InvalidArgumentError("Invalid week settings");
        }
        return {
            firstDay: settings.firstDay,
            minimalDays: settings.minimalDays,
            weekend: settings.weekend
        };
    }
}


// NUMBERS AND STRINGS

export function integerBetween(thing: number, bottom: number, top: number): boolean {
    return isInteger(thing) && thing >= bottom && thing <= top;
}

// x % n but takes the sign of n instead of x
export function floorMod(x: number, n: number): number {
    return x - n * Math.floor(x / n);
}

export function padStart(input: string | number, n = 2): string {
    const minus = +input < 0 ? "-" : "";
    const target = minus ? +input * -1 : input;
    let result;

    if (target.toString().length < n) {
        result = ("0".repeat(n) + target).slice(-n);
    }
    else {
        result = target.toString();
    }

    return `${minus}${result}`;
}

export function parseInteger(text: string): number | undefined {
    if (!!text) {
        return parseInt(text, 10);
    }

    return void 0;
}

export function parseFloating(text: string): number | undefined {
    if (!!text) {
        return parseFloat(text);
    }

    return void 0;
}

export function parseMillis(fraction: string | null | undefined): number {
    // Return undefined (instead of 0) in these cases, where fraction is not set
    if (isUndefined(fraction) || fraction === null || fraction === "") {
        return undefined;
    }
    else {
        const f = parseFloat("0." + fraction) * 1000;
        return Math.floor(f);
    }
}

export function roundTo(value: number, digits: number, rounding: ToRelativeOptions["rounding"] = "round"): number {
    const factor = 10 ** digits;
    switch (rounding) {
        case "expand":
            return value > 0
                ? Math.ceil(value * factor) / factor
                : Math.floor(value * factor) / factor;
        case "trunc":
            return Math.trunc(value * factor) / factor;
        case "round":
            return Math.round(value * factor) / factor;
        case "floor":
            return Math.floor(value * factor) / factor;
        case "ceil":
            return Math.ceil(value * factor) / factor;
        default:
            throw new RangeError(`Value rounding ${rounding} is out of range`);
    }
}

// DATE BASICS

export function isLeapYear(year: number): boolean {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInYear(year: number): 366 | 365 {
    return isLeapYear(year) ? 366 : 365;
}

export function daysInMonth(year: number, month: number): number {
    const modMonth = floorMod(month - 1, 12) + 1,
        modYear = year + (month - modMonth) / 12;
    return [31, isLeapYear(modYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
}

// convert a calendar object to a local timestamp (epoch, but with the offset baked in)
export function objToLocalTS(obj: GregorianDateTime): number {
    let d: Date | number = Date.UTC(
        obj.year,
        obj.month - 1,
        obj.day,
        obj.hour,
        obj.minute,
        obj.second,
        obj.millisecond
    );

    // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
    if (obj.year < 100 && obj.year >= 0) {
        d = new Date(d);
        // set the month and day again, this is necessary because year 2000 is a leap year, but year 100 is not
        // so if obj.year is in 99, but obj.day makes it roll over into year 100,
        // the calculations done by Date.UTC are using year 2000 - which is incorrect
        d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
    }
    return +d;
}

// adapted from moment.js: https://github.com/moment/moment/blob/000ac1800e620f770f4eb31b5ae908f6167b0ab2/src/lib/units/week-calendar-utils.js
function firstWeekOffset(year: number, minDaysInFirstWeek: number, startOfWeek: number): number {
    const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
    return -fwdlw + minDaysInFirstWeek - 1;
}

export function weeksInWeekYear(weekYear: number, minDaysInFirstWeek = 4, startOfWeek = 1): number {
    const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
    const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
    return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}

export function untruncateYear(year: number): number {
    if (year > 99) {
        return year;
    }
    else {
        return year > Settings.twoDigitCutoffYear ? 1900 + year : 2000 + year;
    }
}

// PARSING

export function parseZoneInfo(
    ts: number,
    offsetFormat?: Intl.DateTimeFormatOptions["timeZoneName"],
    locale?: string,
    timeZone?: string
): string {
    const date = new Date(ts);
    const intlOpts = {
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone
    } as Intl.DateTimeFormatOptions;

    const modified: Intl.DateTimeFormatOptions = { timeZoneName: offsetFormat, ...intlOpts };
    const parsed = new Intl.DateTimeFormat(locale, modified)
        .formatToParts(date)
        .find((m: Intl.DateTimeFormatPart) => m.type.toLowerCase() === "timezonename");

    return parsed ? parsed.value : null;
}

// signedOffset('-5', '30') -> -330
export function signedOffset(offHourStr: string, offMinuteStr: string): number {
    let offHour = parseInt(offHourStr, 10);

    // don't || this because we want to preserve -0
    if (Number.isNaN(offHour)) {
        offHour = 0;
    }

    const offMin = parseInt(offMinuteStr, 10) || 0,
        offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
    return offHour * 60 + offMinSigned;
}

// COERCION

export function asNumber(value: unknown): number {
    const numericValue = Number(value);
    if (typeof value === "boolean" || value === "" || !Number.isFinite(numericValue)) {
        throw new InvalidArgumentError(`Invalid unit value ${value}`);
    }
    return numericValue;
}

export function normalizeObject(obj: Record<string, unknown>,
                                normalizer: (key: string) => string | number): { [key: string]: number } {
    return Object.keys(obj).reduce((acc, u: string) => {
        obj[u] !== void 0 && obj[u] !== null && (acc[normalizer(u)] = asNumber(obj[u]));

        return acc;
    }, {} as { [key: string]: number });
}

/**
 * Returns the offset's value as a string
 * @param {number} offset - Epoch milliseconds for which to get the offset
 * @param {string} format - What style of offset to return.
 *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
 * @return {string}
 */
export function formatOffset(offset: number, format: ZoneOffsetFormat): string {
    const hours = Math.trunc(Math.abs(offset / 60)),
        minutes = Math.trunc(Math.abs(offset % 60)),
        sign = offset >= 0 ? "+" : "-";

    switch (format) {
        case "short":
            return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
        case "narrow":
            return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
        case "techie":
            return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
        default:
            throw new RangeError(`Value format ${format} is out of range for property format`);
    }
}

export function timeObject(obj: TimeObject): TimeObject {
    return pick(obj, ["hour", "minute", "second", "millisecond"]);
}

// units ordered by size
export const ORDERED_UNITS: NormalizedDurationUnit[] = [
    "years",
    "quarters",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds"
];

export const REVERSE_ORDERED_UNITS: NormalizedDurationUnit[] = ORDERED_UNITS.slice(0).reverse();

export const HUMAN_ORDERED_UNITS: NormalizedHumanDurationUnit[] = [
    "years",
    "months",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds"
];

// All keys here are lowercase because it's searched that way in normalizeUnit
export const PLURAL_MAPPING: Record<string, keyof GenericDateTimeExtended> = {
    year: "year",
    years: "year",
    quarter: "quarter",
    quarters: "quarter",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    localweeknumber: "localWeekNumber",
    localweeknumbers: "localWeekNumber",
    localweekday: "localWeekday",
    localweekdays: "localWeekday",
    localweekyear: "localWeekYear",
    localweekyears: "localWeekYear",
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

export const FALLBACK_WEEK_SETTINGS: WeekSettings = {
    firstDay: 1,
    minimalDays: 4,
    weekend: [6, 7]
};
