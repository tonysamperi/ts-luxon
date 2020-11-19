/*
  This is just a junk drawer, containing anything used across multiple classes.
  Because Luxon is small(ish), this should stay small and we won't worry about splitting
  it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
*/
import { InvalidArgumentError } from "../errors";
/**
 * @private
 */
// TYPES
export function isUndefined(o) {
    return typeof o === "undefined";
}
export function isNumber(o) {
    return typeof o === "number";
}
export function isInteger(o) {
    return typeof o === "number" && o % 1 === 0;
}
export function isString(o) {
    return typeof o === "string";
}
export function isDate(o) {
    return Object.prototype.toString.call(o) === "[object Date]";
}
// CAPABILITIES
export function hasIntl() {
    try {
        return typeof Intl !== "undefined" && !!Intl.DateTimeFormat;
    }
    catch (e) {
        return false;
    }
}
export function hasFormatToParts() {
    return !isUndefined(Intl.DateTimeFormat.prototype.formatToParts);
}
export function hasRelative() {
    try {
        return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
    }
    catch (e) {
        return false;
    }
}
// OBJECTS AND ARRAYS
export function maybeArray(thing) {
    return Array.isArray(thing) ? thing : [thing];
}
export function bestBy(arr, by, compare) {
    var best = arr.reduce(function (best, next) {
        var pair = [by(next), next];
        if (best === undefined) {
            return pair;
        }
        else if (compare(best[0], pair[0]) === best[0]) {
            return best;
        }
        else {
            return pair;
        }
    }, undefined);
    if (best === undefined)
        throw new InvalidArgumentError("bestBy expects a non empty array");
    return best[1];
}
export function pick(obj, keys) {
    return keys.reduce(function (a, k) {
        a[k] = obj[k];
        return a;
    }, {});
}
// NUMBERS AND STRINGS
export function integerBetween(thing, bottom, top) {
    return isInteger(thing) && thing >= bottom && thing <= top;
}
// x % n but takes the sign of n instead of x
export function floorMod(x, n) {
    return x - n * Math.floor(x / n);
}
export function padStart(input, n) {
    if (n === void 0) { n = 2; }
    if (input.toString().length < n) {
        return ("0".repeat(n) + input).slice(-n);
    }
    else {
        return input.toString();
    }
}
export function parseInteger(text) {
    if (isUndefined(text) || text === null || text === "") {
        return undefined;
    }
    else {
        return parseInt(text, 10);
    }
}
export function parseMillis(fraction) {
    // Return undefined (instead of 0) in these cases, where fraction is not set
    if (isUndefined(fraction) || fraction === null || fraction === "") {
        return undefined;
    }
    else {
        var f = parseFloat("0." + fraction) * 1000;
        return Math.floor(f);
    }
}
export function roundTo(value, digits, towardZero) {
    if (towardZero === void 0) { towardZero = false; }
    var factor = Math.pow(10, digits), rounder = towardZero ? Math.trunc : Math.round;
    return rounder(value * factor) / factor;
}
// DATE BASICS
export function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
export function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}
export function daysInMonth(year, month) {
    var modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
    return [31, isLeapYear(modYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
}
// convert a calendar object to a local timestamp (epoch, but with the offset baked in)
export function objToLocalTS(obj) {
    var ts = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
    // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
    if (integerBetween(obj.year, 0, 99)) {
        var date = new Date(ts);
        date.setUTCFullYear(date.getUTCFullYear() - 1900);
        return date.getTime();
    }
    return ts;
}
export function weeksInWeekYear(weekYear) {
    var p1 = (weekYear +
        Math.floor(weekYear / 4) -
        Math.floor(weekYear / 100) +
        Math.floor(weekYear / 400)) %
        7, last = weekYear - 1, p2 = (last + Math.floor(last / 4) - Math.floor(last / 100) + Math.floor(last / 400)) % 7;
    return p1 === 4 || p2 === 3 ? 53 : 52;
}
export function untruncateYear(year) {
    if (year > 99) {
        return year;
    }
    else
        return year > 60 ? 1900 + year : 2000 + year;
}
// PARSING
export function parseZoneInfo(ts, offsetFormat, locale, timeZone) {
    var date = new Date(ts), intlOptions = {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone
    };
    var modified = Object.assign({ timeZoneName: offsetFormat }, intlOptions), intl = hasIntl();
    if (intl && hasFormatToParts()) {
        var parsed = new Intl.DateTimeFormat(locale, modified)
            .formatToParts(date)
            .find(function (m) { return m.type.toLowerCase() === "timezonename"; });
        return parsed ? parsed.value : null;
    }
    else if (intl) {
        // this probably doesn't work for all locales
        var without = new Intl.DateTimeFormat(locale, intlOptions).format(date), included = new Intl.DateTimeFormat(locale, modified).format(date), diffed = included.substring(without.length), trimmed = diffed.replace(/^[, \u200e]+/, "");
        return trimmed;
    }
    else {
        return null;
    }
}
// signedOffset('-5', '30') -> -330
export function signedOffset(offHourStr, offMinuteStr) {
    var offHour = parseInt(offHourStr, 10);
    // don't || this because we want to preserve -0
    if (Number.isNaN(offHour)) {
        offHour = 0;
    }
    var offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
    return offHour * 60 + offMinSigned;
}
// COERCION
export function asNumber(value) {
    var numericValue = Number(value);
    if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue))
        throw new InvalidArgumentError("Invalid unit value " + value);
    return numericValue;
}
export function normalizeObject(obj, normalizer) {
    return Object.keys(obj).reduce(function (normalized, key) {
        var value = obj[key];
        if (value !== undefined && value !== null)
            normalized[normalizer(key)] = asNumber(value);
        return normalized;
    }, {});
}
export function formatOffset(offset, format) {
    var hours = Math.trunc(Math.abs(offset / 60)), minutes = Math.trunc(Math.abs(offset % 60)), sign = offset >= 0 ? "+" : "-";
    switch (format) {
        case "short":
            return "" + sign + padStart(hours, 2) + ":" + padStart(minutes, 2);
        case "narrow":
            return "" + sign + hours + (minutes > 0 ? ":" + minutes : "");
        case "techie":
            return "" + sign + padStart(hours, 2) + padStart(minutes, 2);
        default:
            throw new RangeError("Value format " + format + " is out of range for property format");
    }
}
export function timeObject(obj) {
    return pick(obj, ["hour", "minute", "second", "millisecond"]);
}
export var ianaRegex = /[A-Za-z_+-]{1,256}(:?\/[A-Za-z_+-]{1,256}(\/[A-Za-z_+-]{1,256})?)?/;
//# sourceMappingURL=util.js.map