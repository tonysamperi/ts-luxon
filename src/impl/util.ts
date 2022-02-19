/*
 This is just a junk drawer, containing anything used across multiple classes.
 Because Luxon is small(ish), this should stay small and we won't worry about splitting
 it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
 */

import { InvalidArgumentError } from "../errors";
import { TimeObject, GregorianDateTime } from "../types/datetime";
import { ZoneOffsetFormat } from "../types/zone";

import Intl from "../types/intl-next";

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

export function hasRelative() {
    try {
        return typeof Intl !== "undefined" && !!(Intl as any).RelativeTimeFormat;
    } catch (e) {
        return false;
    }
}

// OBJECTS AND ARRAYS

export function maybeArray<T>(thing: T | T[]) {
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

export function pick<T, K extends keyof T>(obj: T, keys: K[]) {
    return keys.reduce<Partial<Pick<T, K>>>((a, k) => {
        a[k] = obj[k];
        return a;
    }, {}) as Pick<T, K>;
}

// NUMBERS AND STRINGS

export function integerBetween(thing: number, bottom: number, top: number) {
    return isInteger(thing) && thing >= bottom && thing <= top;
}

// x % n but takes the sign of n instead of x
export function floorMod(x: number, n: number) {
    return x - n * Math.floor(x / n);
}

export function padStart(input: string | number, n = 2) {
    const minus = input < 0 ? "-" : "";
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

export function parseMillis(fraction: string | null | undefined) {
    // Return undefined (instead of 0) in these cases, where fraction is not set
    if (isUndefined(fraction) || fraction === null || fraction === "") {
        return undefined;
    }
    else {
        const f = parseFloat("0." + fraction) * 1000;
        return Math.floor(f);
    }
}

export function roundTo(value: number, digits: number, towardZero = false) {
    const factor = 10 ** digits,
        rounder = towardZero ? Math.trunc : Math.round;
    return rounder(value * factor) / factor;
}

// DATE BASICS

export function isLeapYear(year: number) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInYear(year: number) {
    return isLeapYear(year) ? 366 : 365;
}

export function daysInMonth(year: number, month: number) {
    const modMonth = floorMod(month - 1, 12) + 1,
        modYear = year + (month - modMonth) / 12;
    return [31, isLeapYear(modYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
}

// convert a calendar object to a local timestamp (epoch, but with the offset baked in)
export function objToLocalTS(obj: GregorianDateTime) {
    const ts = Date.UTC(
        obj.year,
        obj.month - 1,
        obj.day,
        obj.hour,
        obj.minute,
        obj.second,
        obj.millisecond
    );

    // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
    if (integerBetween(obj.year, 0, 99)) {
        const date = new Date(ts);
        date.setUTCFullYear(date.getUTCFullYear() - 1900);
        return date.getTime();
    }

    return ts;
}

export function weeksInWeekYear(weekYear: number) {
    const p1 =
        (weekYear +
            Math.floor(weekYear / 4) -
            Math.floor(weekYear / 100) +
            Math.floor(weekYear / 400)) %
        7,
        last = weekYear - 1,
        p2 = (last + Math.floor(last / 4) - Math.floor(last / 100) + Math.floor(last / 400)) % 7;
    return p1 === 4 || p2 === 3 ? 53 : 52;
}

export function untruncateYear(year: number) {
    if (year > 99) {
        return year;
    }
    else {
        return year > 60 ? 1900 + year : 2000 + year;
    }
}

// PARSING

export function parseZoneInfo(
    ts: number,
    offsetFormat?: string,
    locale?: string,
    timeZone?: string
) {
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
export function signedOffset(offHourStr: string, offMinuteStr: string) {
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

export function asNumber(value: unknown) {
    const numericValue = Number(value);
    if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue)) {
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

export function formatOffset(offset: number, format: ZoneOffsetFormat) {
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

export const IANA_REGEX = /[A-Za-z_+-]{1,256}(:?\/[A-Za-z0-9_+-]{1,256}(\/[A-Za-z0-9_+-]{1,256})?)?/;
