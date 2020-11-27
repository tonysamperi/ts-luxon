(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.tsLuxon = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    // these aren't really private, but nor are they really useful to document
    /**
     * @private
     */
    var LuxonError = /** @class */ (function (_super) {
        __extends(LuxonError, _super);
        function LuxonError() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return LuxonError;
    }(Error));
    /**
     * @private
     */
    var UnitOutOfRangeError = /** @class */ (function (_super) {
        __extends(UnitOutOfRangeError, _super);
        function UnitOutOfRangeError(unit, value) {
            var _this = _super.call(this, "you specified " + value + " (of type " + typeof value + ") as a " + unit + ", which is invalid") || this;
            // See https://github.com/facebook/jest/issues/8279#issuecomment-539775425
            Object.setPrototypeOf(_this, UnitOutOfRangeError.prototype);
            return _this;
        }
        return UnitOutOfRangeError;
    }(LuxonError));
    /**
     * @private
     */
    var InvalidUnitError = /** @class */ (function (_super) {
        __extends(InvalidUnitError, _super);
        function InvalidUnitError(unit) {
            var _this = _super.call(this, "Invalid unit " + unit) || this;
            Object.setPrototypeOf(_this, InvalidUnitError.prototype);
            return _this;
        }
        return InvalidUnitError;
    }(LuxonError));
    /**
     * @private
     */
    var InvalidZoneError = /** @class */ (function (_super) {
        __extends(InvalidZoneError, _super);
        function InvalidZoneError(zoneName) {
            var _this = _super.call(this, zoneName + " is an invalid or unknown zone specifier") || this;
            Object.setPrototypeOf(_this, InvalidZoneError.prototype);
            return _this;
        }
        return InvalidZoneError;
    }(LuxonError));
    /**
     * @private
     */
    var MissingPlatformFeatureError = /** @class */ (function (_super) {
        __extends(MissingPlatformFeatureError, _super);
        function MissingPlatformFeatureError(feature) {
            var _this = _super.call(this, "missing " + feature + " support") || this;
            Object.setPrototypeOf(_this, MissingPlatformFeatureError.prototype);
            return _this;
        }
        return MissingPlatformFeatureError;
    }(LuxonError));
    /**
     * @private
     */
    var MismatchedWeekdayError = /** @class */ (function (_super) {
        __extends(MismatchedWeekdayError, _super);
        function MismatchedWeekdayError(weekday, date) {
            var _this = _super.call(this, "you can't specify both a weekday of " + weekday + " and a date of " + date) || this;
            Object.setPrototypeOf(_this, MismatchedWeekdayError.prototype);
            return _this;
        }
        return MismatchedWeekdayError;
    }(LuxonError));
    /**
     * @private
     */
    var UnparsableStringError = /** @class */ (function (_super) {
        __extends(UnparsableStringError, _super);
        function UnparsableStringError(format, text) {
            var _this = _super.call(this, "can't parse " + text + " into format " + format) || this;
            Object.setPrototypeOf(_this, UnparsableStringError.prototype);
            return _this;
        }
        return UnparsableStringError;
    }(LuxonError));
    /**
     * @private
     */
    var ConflictingSpecificationError = /** @class */ (function (_super) {
        __extends(ConflictingSpecificationError, _super);
        function ConflictingSpecificationError(message) {
            var _this = _super.call(this, message) || this;
            Object.setPrototypeOf(_this, ConflictingSpecificationError.prototype);
            return _this;
        }
        return ConflictingSpecificationError;
    }(LuxonError));
    /**
     * @private
     */
    var InvalidArgumentError = /** @class */ (function (_super) {
        __extends(InvalidArgumentError, _super);
        function InvalidArgumentError(message) {
            var _this = _super.call(this, message) || this;
            Object.setPrototypeOf(_this, InvalidArgumentError.prototype);
            return _this;
        }
        return InvalidArgumentError;
    }(LuxonError));
    /**
     * @private
     */
    var ZoneIsAbstractError = /** @class */ (function (_super) {
        __extends(ZoneIsAbstractError, _super);
        function ZoneIsAbstractError() {
            var _this = _super.call(this, "Zone is an abstract class") || this;
            Object.setPrototypeOf(_this, ZoneIsAbstractError.prototype);
            return _this;
        }
        return ZoneIsAbstractError;
    }(LuxonError));

    /*
      This is just a junk drawer, containing anything used across multiple classes.
      Because Luxon is small(ish), this should stay small and we won't worry about splitting
      it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
    */
    /**
     * @private
     */
    // TYPES
    function isUndefined(o) {
        return typeof o === "undefined";
    }
    function isNumber(o) {
        return typeof o === "number";
    }
    function isInteger(o) {
        return typeof o === "number" && o % 1 === 0;
    }
    function isString(o) {
        return typeof o === "string";
    }
    function isDate(o) {
        return Object.prototype.toString.call(o) === "[object Date]";
    }
    // CAPABILITIES
    function hasIntl() {
        try {
            return typeof Intl !== "undefined" && !!Intl.DateTimeFormat;
        }
        catch (e) {
            return false;
        }
    }
    function hasFormatToParts() {
        return !isUndefined(Intl.DateTimeFormat.prototype.formatToParts);
    }
    function hasRelative() {
        try {
            return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
        }
        catch (e) {
            return false;
        }
    }
    // OBJECTS AND ARRAYS
    function maybeArray(thing) {
        return Array.isArray(thing) ? thing : [thing];
    }
    function bestBy(arr, by, compare) {
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
    function pick(obj, keys) {
        return keys.reduce(function (a, k) {
            a[k] = obj[k];
            return a;
        }, {});
    }
    // NUMBERS AND STRINGS
    function integerBetween(thing, bottom, top) {
        return isInteger(thing) && thing >= bottom && thing <= top;
    }
    // x % n but takes the sign of n instead of x
    function floorMod(x, n) {
        return x - n * Math.floor(x / n);
    }
    function padStart(input, n) {
        if (n === void 0) { n = 2; }
        if (input.toString().length < n) {
            return ("0".repeat(n) + input).slice(-n);
        }
        else {
            return input.toString();
        }
    }
    function parseInteger(text) {
        if (isUndefined(text) || text === null || text === "") {
            return undefined;
        }
        else {
            return parseInt(text, 10);
        }
    }
    function parseMillis(fraction) {
        // Return undefined (instead of 0) in these cases, where fraction is not set
        if (isUndefined(fraction) || fraction === null || fraction === "") {
            return undefined;
        }
        else {
            var f = parseFloat("0." + fraction) * 1000;
            return Math.floor(f);
        }
    }
    function roundTo(value, digits, towardZero) {
        if (towardZero === void 0) { towardZero = false; }
        var factor = Math.pow(10, digits), rounder = towardZero ? Math.trunc : Math.round;
        return rounder(value * factor) / factor;
    }
    // DATE BASICS
    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }
    function daysInMonth(year, month) {
        var modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
        return [31, isLeapYear(modYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
    }
    // convert a calendar object to a local timestamp (epoch, but with the offset baked in)
    function objToLocalTS(obj) {
        var ts = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
        // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
        if (integerBetween(obj.year, 0, 99)) {
            var date = new Date(ts);
            date.setUTCFullYear(date.getUTCFullYear() - 1900);
            return date.getTime();
        }
        return ts;
    }
    function weeksInWeekYear(weekYear) {
        var p1 = (weekYear +
            Math.floor(weekYear / 4) -
            Math.floor(weekYear / 100) +
            Math.floor(weekYear / 400)) %
            7, last = weekYear - 1, p2 = (last + Math.floor(last / 4) - Math.floor(last / 100) + Math.floor(last / 400)) % 7;
        return p1 === 4 || p2 === 3 ? 53 : 52;
    }
    function untruncateYear(year) {
        if (year > 99) {
            return year;
        }
        else
            return year > 60 ? 1900 + year : 2000 + year;
    }
    // PARSING
    function parseZoneInfo(ts, offsetFormat, locale, timeZone) {
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
    function signedOffset(offHourStr, offMinuteStr) {
        var offHour = parseInt(offHourStr, 10);
        // don't || this because we want to preserve -0
        if (Number.isNaN(offHour)) {
            offHour = 0;
        }
        var offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
        return offHour * 60 + offMinSigned;
    }
    // COERCION
    function asNumber(value) {
        var numericValue = Number(value);
        if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue))
            throw new InvalidArgumentError("Invalid unit value " + value);
        return numericValue;
    }
    function normalizeObject(obj, normalizer) {
        return Object.keys(obj).reduce(function (normalized, key) {
            var value = obj[key];
            if (value !== undefined && value !== null)
                normalized[normalizer(key)] = asNumber(value);
            return normalized;
        }, {});
    }
    function formatOffset(offset, format) {
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
    function timeObject(obj) {
        return pick(obj, ["hour", "minute", "second", "millisecond"]);
    }
    var ianaRegex = /[A-Za-z_+-]{1,256}(:?\/[A-Za-z_+-]{1,256}(\/[A-Za-z_+-]{1,256})?)?/;

    /**
     * @private
     */
    var n = "numeric", s = "short", l = "long";
    var DATE_SHORT = {
        year: n,
        month: n,
        day: n
    };
    var DATE_MED = {
        year: n,
        month: s,
        day: n
    };
    var DATE_MED_WITH_WEEKDAY = {
        year: n,
        month: s,
        day: n,
        weekday: s
    };
    var DATE_FULL = {
        year: n,
        month: l,
        day: n
    };
    var DATE_HUGE = {
        year: n,
        month: l,
        day: n,
        weekday: l
    };
    var TIME_SIMPLE = {
        hour: n,
        minute: n
    };
    var TIME_WITH_SECONDS = {
        hour: n,
        minute: n,
        second: n
    };
    var TIME_WITH_SHORT_OFFSET = {
        hour: n,
        minute: n,
        second: n,
        timeZoneName: s
    };
    var TIME_WITH_LONG_OFFSET = {
        hour: n,
        minute: n,
        second: n,
        timeZoneName: l
    };
    var TIME_24_SIMPLE = {
        hour: n,
        minute: n,
        hour12: false
    };
    var TIME_24_WITH_SECONDS = {
        hour: n,
        minute: n,
        second: n,
        hour12: false
    };
    var TIME_24_WITH_SHORT_OFFSET = {
        hour: n,
        minute: n,
        second: n,
        hour12: false,
        timeZoneName: s
    };
    var TIME_24_WITH_LONG_OFFSET = {
        hour: n,
        minute: n,
        second: n,
        hour12: false,
        timeZoneName: l
    };
    var DATETIME_SHORT = {
        year: n,
        month: n,
        day: n,
        hour: n,
        minute: n
    };
    var DATETIME_SHORT_WITH_SECONDS = {
        year: n,
        month: n,
        day: n,
        hour: n,
        minute: n,
        second: n
    };
    var DATETIME_MED = {
        year: n,
        month: s,
        day: n,
        hour: n,
        minute: n
    };
    var DATETIME_MED_WITH_SECONDS = {
        year: n,
        month: s,
        day: n,
        hour: n,
        minute: n,
        second: n
    };
    var DATETIME_MED_WITH_WEEKDAY = {
        year: n,
        month: s,
        day: n,
        weekday: s,
        hour: n,
        minute: n
    };
    var DATETIME_FULL = {
        year: n,
        month: l,
        day: n,
        hour: n,
        minute: n,
        timeZoneName: s
    };
    var DATETIME_FULL_WITH_SECONDS = {
        year: n,
        month: l,
        day: n,
        hour: n,
        minute: n,
        second: n,
        timeZoneName: s
    };
    var DATETIME_HUGE = {
        year: n,
        month: l,
        day: n,
        weekday: l,
        hour: n,
        minute: n,
        timeZoneName: l
    };
    var DATETIME_HUGE_WITH_SECONDS = {
        year: n,
        month: l,
        day: n,
        weekday: l,
        hour: n,
        minute: n,
        second: n,
        timeZoneName: l
    };

    function stringify(obj) {
        return JSON.stringify(obj, Object.keys(obj).sort());
    }
    /**
     * @private
     */
    var monthsLong = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    var monthsShort = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];
    var monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    function months(length) {
        switch (length) {
            case "narrow":
                return monthsNarrow;
            case "short":
                return monthsShort;
            case "long":
                return monthsLong;
            case "numeric":
                return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
            case "2-digit":
                return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        }
    }
    var weekdaysLong = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];
    var weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];
    function weekdays(length) {
        switch (length) {
            case "narrow":
                return weekdaysNarrow;
            case "short":
                return weekdaysShort;
            case "long":
                return weekdaysLong;
        }
    }
    var meridiems = ["AM", "PM"];
    var erasLong = ["Before Christ", "Anno Domini"];
    var erasShort = ["BC", "AD"];
    var erasNarrow = ["B", "A"];
    function eras(length) {
        switch (length) {
            case "narrow":
                return erasNarrow;
            case "short":
                return erasShort;
            case "long":
                return erasLong;
        }
    }
    function meridiemForDateTime(dt) {
        return meridiems[dt.hour < 12 ? 0 : 1];
    }
    function weekdayForDateTime(dt, length) {
        return weekdays(length)[dt.weekday - 1];
    }
    function monthForDateTime(dt, length) {
        return months(length)[dt.month - 1];
    }
    function eraForDateTime(dt, length) {
        return eras(length)[dt.year < 0 ? 0 : 1];
    }
    function formatRelativeTime(unit, count, numeric, narrow) {
        if (numeric === void 0) { numeric = "always"; }
        if (narrow === void 0) { narrow = false; }
        var units = {
            years: ["year", "yr."],
            quarters: ["quarter", "qtr."],
            months: ["month", "mo."],
            weeks: ["week", "wk."],
            days: ["day", "day", "days"],
            hours: ["hour", "hr."],
            minutes: ["minute", "min."],
            seconds: ["second", "sec."],
            milliseconds: [] // never used
        };
        var normalizedUnit = Duration.normalizeUnit(unit), unitTexts = units[normalizedUnit], lastable = ["hours", "minutes", "seconds"].indexOf(normalizedUnit) === -1;
        if (numeric === "auto" && lastable) {
            var isDay = normalizedUnit === "days";
            switch (count) {
                case 1:
                    return isDay ? "tomorrow" : "next " + unitTexts[0];
                case -1:
                    return isDay ? "yesterday" : "last " + unitTexts[0];
                case 0:
                    return isDay ? "today" : "this " + unitTexts[0];
            }
        }
        var isInPast = Object.is(count, -0) || count < 0, formatValue = Math.abs(count), singular = formatValue === 1, formatUnit = narrow
            ? singular
                ? unitTexts[1]
                : unitTexts[2] || unitTexts[1]
            : singular
                ? unitTexts[0]
                : normalizedUnit;
        return isInPast ? formatValue + " " + formatUnit + " ago" : "in " + formatValue + " " + formatUnit;
    }
    function formatString(knownFormat) {
        // these all have the offsets removed because we don't have access to them
        // without all the intl stuff this is backfilling
        var filtered = pick(knownFormat, [
            "weekday",
            "era",
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "timeZoneName",
            "hour12"
        ]), key = stringify(filtered), dateTimeHuge = "EEEE, LLLL d, yyyy, h:mm a";
        switch (key) {
            case stringify(DATE_SHORT):
                return "M/d/yyyy";
            case stringify(DATE_MED):
                return "LLL d, yyyy";
            case stringify(DATE_MED_WITH_WEEKDAY):
                return "EEE, LLL d, yyyy";
            case stringify(DATE_FULL):
                return "LLLL d, yyyy";
            case stringify(DATE_HUGE):
                return "EEEE, LLLL d, yyyy";
            case stringify(TIME_SIMPLE):
                return "h:mm a";
            case stringify(TIME_WITH_SECONDS):
                return "h:mm:ss a";
            case stringify(TIME_WITH_SHORT_OFFSET):
                return "h:mm a";
            case stringify(TIME_WITH_LONG_OFFSET):
                return "h:mm a";
            case stringify(TIME_24_SIMPLE):
                return "HH:mm";
            case stringify(TIME_24_WITH_SECONDS):
                return "HH:mm:ss";
            case stringify(TIME_24_WITH_SHORT_OFFSET):
                return "HH:mm";
            case stringify(TIME_24_WITH_LONG_OFFSET):
                return "HH:mm";
            case stringify(DATETIME_SHORT):
                return "M/d/yyyy, h:mm a";
            case stringify(DATETIME_MED):
                return "LLL d, yyyy, h:mm a";
            case stringify(DATETIME_FULL):
                return "LLLL d, yyyy, h:mm a";
            case stringify(DATETIME_HUGE):
                return dateTimeHuge;
            case stringify(DATETIME_SHORT_WITH_SECONDS):
                return "M/d/yyyy, h:mm:ss a";
            case stringify(DATETIME_MED_WITH_SECONDS):
                return "LLL d, yyyy, h:mm:ss a";
            case stringify(DATETIME_MED_WITH_WEEKDAY):
                return "EEE, d LLL yyyy, h:mm a";
            case stringify(DATETIME_FULL_WITH_SECONDS):
                return "LLLL d, yyyy, h:mm:ss a";
            case stringify(DATETIME_HUGE_WITH_SECONDS):
                return "EEEE, LLLL d, yyyy, h:mm:ss a";
            default:
                return dateTimeHuge;
        }
    }

    // Prefixing the parameter names with a _ confuses ESDoc
    function silenceUnusedWarning() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
    }
    /**
     * An abstract Zone class
     * @interface
     */
    var Zone = /** @class */ (function () {
        function Zone() {
        }
        Object.defineProperty(Zone.prototype, "type", {
            /**
             * The type of zone
             * @abstract
             * @type {string}
             */
            get: function () {
                throw new ZoneIsAbstractError();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Zone.prototype, "name", {
            /**
             * The name of this zone.
             * @abstract
             * @type {string}
             */
            get: function () {
                throw new ZoneIsAbstractError();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Zone.prototype, "isUniversal", {
            /**
             * Returns whether the offset is known to be fixed for the whole year.
             * @abstract
             * @type {boolean}
             */
            get: function () {
                throw new ZoneIsAbstractError();
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Returns the offset's common name (such as EST) at the specified timestamp
         * @abstract
         * @param {number} [ts] - Epoch milliseconds for which to get the name
         * @param {Object} [options] - Options to affect the format
         * @param {string} [options.format] - What style of offset to return. Accepts 'long' or 'short'.
         * @param {string} [options.locale] - What locale to return the offset name in.
         * @return {string | null}
         */
        Zone.prototype.offsetName = function (ts, options) {
            silenceUnusedWarning(ts, options);
            throw new ZoneIsAbstractError();
        };
        /**
         * Returns the offset's value as a string
         * @abstract
         * @param {number} ts - Epoch milliseconds for which to get the offset
         * @param {string} format - What style of offset to return.
         *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
         * @return {string}
         */
        Zone.prototype.formatOffset = function (ts, format) {
            silenceUnusedWarning(ts, format);
            throw new ZoneIsAbstractError();
        };
        /**
         * Return the offset in minutes for this zone at the specified timestamp.
         * @abstract
         * @param {number} ts - Epoch milliseconds for which to compute the offset
         * @return {number}
         */
        Zone.prototype.offset = function (ts) {
            silenceUnusedWarning(ts);
            throw new ZoneIsAbstractError();
        };
        /**
         * Return whether this Zone is equal to another zone
         * @abstract
         * @param {Zone} other - the zone to compare
         * @return {boolean}
         */
        Zone.prototype.equals = function (other) {
            silenceUnusedWarning(other);
            throw new ZoneIsAbstractError();
        };
        Object.defineProperty(Zone.prototype, "isValid", {
            /**
             * Return whether this Zone is valid.
             * @abstract
             * @type {boolean}
             */
            get: function () {
                throw new ZoneIsAbstractError();
            },
            enumerable: false,
            configurable: true
        });
        return Zone;
    }());

    var singleton = null;
    /**
     * Represents the system's local zone for this Javascript environment.
     * @implements {Zone}
     */
    var SystemZone = /** @class */ (function (_super) {
        __extends(SystemZone, _super);
        function SystemZone() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(SystemZone, "instance", {
            /**
             * Get a singleton instance of the system's local zone
             * @return {SystemZone}
             */
            get: function () {
                if (singleton === null) {
                    singleton = new SystemZone();
                }
                return singleton;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SystemZone.prototype, "type", {
            /** @override **/
            get: function () {
                return "system";
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SystemZone.prototype, "name", {
            /** @override **/
            get: function () {
                if (hasIntl()) {
                    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
                }
                else
                    return "system";
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SystemZone.prototype, "isUniversal", {
            /** @override **/
            get: function () {
                return false;
            },
            enumerable: false,
            configurable: true
        });
        /** @override **/
        SystemZone.prototype.offsetName = function (ts, _a) {
            var _b = _a === void 0 ? {} : _a, format = _b.format, locale = _b.locale;
            return parseZoneInfo(ts, format, locale);
        };
        /** @override **/
        SystemZone.prototype.formatOffset = function (ts, format) {
            return formatOffset(this.offset(ts), format);
        };
        /** @override **/
        SystemZone.prototype.offset = function (ts) {
            return -new Date(ts).getTimezoneOffset();
        };
        /** @override **/
        SystemZone.prototype.equals = function (other) {
            return other.type === "system";
        };
        Object.defineProperty(SystemZone.prototype, "isValid", {
            /** @override **/
            get: function () {
                return true;
            },
            enumerable: false,
            configurable: true
        });
        return SystemZone;
    }(Zone));

    var matchingRegex = RegExp("^" + ianaRegex.source + "$");
    var dtfCache = {};
    function makeDTF(zone) {
        if (!dtfCache[zone]) {
            try {
                dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
                    hour12: false,
                    timeZone: zone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
            }
            catch (_a) {
                throw new InvalidZoneError(zone);
            }
        }
        return dtfCache[zone];
    }
    var typeToPos = {
        year: 0,
        month: 1,
        day: 2,
        hour: 3,
        minute: 4,
        second: 5
    };
    function hackyOffset(dtf, date) {
        var formatted = dtf.format(date).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(formatted);
        if (parsed !== null) {
            var month = parsed[1], day = parsed[2], year = parsed[3], hour = parsed[4], minute = parsed[5], second = parsed[6];
            return [
                parseInt(year, 10),
                parseInt(month, 10),
                parseInt(day, 10),
                parseInt(hour, 10),
                parseInt(minute, 10),
                parseInt(second, 10)
            ];
        }
        return [0, 0, 0, 0, 0, 0];
    }
    function partsOffset(dtf, date) {
        var formatted = dtf.formatToParts(date), filled = [];
        for (var i = 0; i < formatted.length; i++) {
            var _a = formatted[i], type = _a.type, value = _a.value, pos = typeToPos[type];
            if (!isUndefined(pos)) {
                filled[pos] = parseInt(value, 10);
            }
        }
        return filled;
    }
    var ianaZoneCache = {};
    /**
     * A zone identified by an IANA identifier, like America/New_York
     * @implements {Zone}
     */
    var IANAZone = /** @class */ (function (_super) {
        __extends(IANAZone, _super);
        function IANAZone(name) {
            var _this = _super.call(this) || this;
            /** @private **/
            _this.zoneName = name;
            /** @private **/
            _this.valid = IANAZone.isValidZone(name);
            return _this;
        }
        /**
         * @param {string} name - Zone name
         * @return {IANAZone}
         */
        IANAZone.create = function (name) {
            if (!ianaZoneCache[name]) {
                ianaZoneCache[name] = new IANAZone(name);
            }
            return ianaZoneCache[name];
        };
        /**
         * Reset local caches. Should only be necessary in testing scenarios.
         * @return {void}
         */
        IANAZone.resetCache = function () {
            ianaZoneCache = {};
            dtfCache = {};
        };
        /**
         * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
         * @param {string} s - The string to check validity on
         * @example IANAZone.isValidSpecifier("America/New_York") //=> true
         * @example IANAZone.isValidSpecifier("Fantasia/Castle") //=> true
         * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
         * @return {boolean}
         */
        IANAZone.isValidSpecifier = function (s) {
            return !!(s && matchingRegex.exec(s) !== null);
        };
        /**
         * Returns whether the provided string identifies a real zone
         * @param {string} zone - The string to check
         * @example IANAZone.isValidZone("America/New_York") //=> true
         * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
         * @example IANAZone.isValidZone("Sport~~blorp") //=> false
         * @return {boolean}
         */
        IANAZone.isValidZone = function (zone) {
            try {
                new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
                return true;
            }
            catch (e) {
                return false;
            }
        };
        // Etc/GMT+8 -> -480
        /** @ignore */
        IANAZone.parseGMTOffset = function (specifier) {
            if (specifier) {
                var regexp = /^Etc\/GMT([+-]\d{1,2})$/i;
                var match = regexp.exec(specifier);
                if (match !== null) {
                    return -60 * parseInt(match[1]);
                }
            }
            return null;
        };
        Object.defineProperty(IANAZone.prototype, "type", {
            /** @override **/
            get: function () {
                return "iana";
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(IANAZone.prototype, "name", {
            /** @override **/
            get: function () {
                return this.zoneName;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(IANAZone.prototype, "isUniversal", {
            /** @override **/
            get: function () {
                return false;
            },
            enumerable: false,
            configurable: true
        });
        /** @override **/
        IANAZone.prototype.offsetName = function (ts, _a) {
            var _b = _a === void 0 ? {} : _a, format = _b.format, locale = _b.locale;
            return parseZoneInfo(ts, format, locale, this.name);
        };
        /** @override **/
        IANAZone.prototype.formatOffset = function (ts, format) {
            return formatOffset(this.offset(ts), format);
        };
        /** @override **/
        IANAZone.prototype.offset = function (ts) {
            var date = new Date(ts), dtf = makeDTF(this.name), _a = dtf.formatToParts === undefined ? hackyOffset(dtf, date) : partsOffset(dtf, date), year = _a[0], month = _a[1], day = _a[2], hour = _a[3], minute = _a[4], second = _a[5], 
            // work around https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
            adjustedHour = hour === 24 ? 0 : hour;
            var asUTC = objToLocalTS({
                year: year,
                month: month,
                day: day,
                hour: adjustedHour,
                minute: minute,
                second: second,
                millisecond: 0
            });
            var asTS = date.valueOf();
            var over = asTS % 1000;
            asTS -= over >= 0 ? over : 1000 + over;
            return (asUTC - asTS) / (60 * 1000);
        };
        /** @override **/
        IANAZone.prototype.equals = function (other) {
            return other.type === "iana" && other.name === this.name;
        };
        Object.defineProperty(IANAZone.prototype, "isValid", {
            /** @override **/
            get: function () {
                return this.valid;
            },
            enumerable: false,
            configurable: true
        });
        return IANAZone;
    }(Zone));

    var singleton$1;
    /**
     * A zone with a fixed offset (meaning no DST)
     * @implements {Zone}
     */
    var FixedOffsetZone = /** @class */ (function (_super) {
        __extends(FixedOffsetZone, _super);
        function FixedOffsetZone(offset) {
            var _this = _super.call(this) || this;
            /** @private **/
            _this.fixed = offset;
            return _this;
        }
        Object.defineProperty(FixedOffsetZone, "utcInstance", {
            /**
             * Get a singleton instance of UTC
             * @return {FixedOffsetZone}
             */
            get: function () {
                if (singleton$1 === undefined) {
                    singleton$1 = new FixedOffsetZone(0);
                }
                return singleton$1;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Get an instance with a specified offset
         * @param {number} offset - The offset in minutes
         * @return {FixedOffsetZone}
         */
        FixedOffsetZone.instance = function (offset) {
            return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
        };
        /**
         * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
         * @param {string} s - The offset string to parse
         * @example FixedOffsetZone.parseSpecifier("UTC+6")
         * @example FixedOffsetZone.parseSpecifier("UTC+06")
         * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
         * @return {FixedOffsetZone | null}
         */
        FixedOffsetZone.parseSpecifier = function (s) {
            if (s) {
                var regexp = /^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i;
                var r = regexp.exec(s);
                if (r !== null) {
                    return new FixedOffsetZone(signedOffset(r[1], r[2]));
                }
            }
            return null;
        };
        Object.defineProperty(FixedOffsetZone.prototype, "type", {
            /** @override **/
            get: function () {
                return "fixed";
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(FixedOffsetZone.prototype, "name", {
            /** @override **/
            get: function () {
                return this.fixed === 0 ? "UTC" : "UTC" + formatOffset(this.fixed, "narrow");
            },
            enumerable: false,
            configurable: true
        });
        /** @override **/
        FixedOffsetZone.prototype.offsetName = function (_ts, _options) {
            return this.name;
        };
        /** @override **/
        FixedOffsetZone.prototype.formatOffset = function (_ts, format) {
            return formatOffset(this.fixed, format);
        };
        Object.defineProperty(FixedOffsetZone.prototype, "isUniversal", {
            /** @override **/
            get: function () {
                return true;
            },
            enumerable: false,
            configurable: true
        });
        /** @override **/
        FixedOffsetZone.prototype.offset = function (_ts) {
            return this.fixed;
        };
        /** @override **/
        FixedOffsetZone.prototype.equals = function (other) {
            return other.type === "fixed" && other.fixed === this.fixed;
        };
        Object.defineProperty(FixedOffsetZone.prototype, "isValid", {
            /** @override **/
            get: function () {
                return true;
            },
            enumerable: false,
            configurable: true
        });
        return FixedOffsetZone;
    }(Zone));

    /**
     * @private
     */
    var normalizeZone = function (input, defaultZone) {
        if (isUndefined(input) || input === null) {
            return defaultZone;
        }
        if (input instanceof Zone) {
            return input;
        }
        if (isString(input)) {
            var lowered = input.toLowerCase();
            if (lowered === "default") {
                return defaultZone;
            }
            if (lowered === "system") {
                return SystemZone.instance;
            }
            if (lowered === "utc") {
                return FixedOffsetZone.utcInstance;
            }
            var offset = IANAZone.parseGMTOffset(input);
            if (offset != null) {
                // handle Etc/GMT-4, which V8 chokes on
                return FixedOffsetZone.instance(offset);
            }
            if (IANAZone.isValidSpecifier(lowered)) {
                return IANAZone.create(input);
            }
            var fixed = FixedOffsetZone.parseSpecifier(lowered);
            if (fixed !== null) {
                return fixed;
            }
            throw new InvalidZoneError(input);
        }
        if (isNumber(input)) {
            return FixedOffsetZone.instance(input);
        }
        throw new InvalidZoneError(input);
    };

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

    function stringifyTokens(splits, tokenToString) {
        var s = "";
        for (var _i = 0, splits_1 = splits; _i < splits_1.length; _i++) {
            var token = splits_1[_i];
            if (token.literal) {
                s += token.val;
            }
            else {
                s += tokenToString(token.val);
            }
        }
        return s;
    }
    var TokenToFormatOpts = {
        D: DATE_SHORT,
        DD: DATE_MED,
        DDD: DATE_FULL,
        DDDD: DATE_HUGE,
        t: TIME_SIMPLE,
        tt: TIME_WITH_SECONDS,
        ttt: TIME_WITH_SHORT_OFFSET,
        tttt: TIME_WITH_LONG_OFFSET,
        T: TIME_24_SIMPLE,
        TT: TIME_24_WITH_SECONDS,
        TTT: TIME_24_WITH_SHORT_OFFSET,
        TTTT: TIME_24_WITH_LONG_OFFSET,
        f: DATETIME_SHORT,
        ff: DATETIME_MED,
        fff: DATETIME_FULL,
        ffff: DATETIME_HUGE,
        F: DATETIME_SHORT_WITH_SECONDS,
        FF: DATETIME_MED_WITH_SECONDS,
        FFF: DATETIME_FULL_WITH_SECONDS,
        FFFF: DATETIME_HUGE_WITH_SECONDS
    };
    /**
     * @private
     */
    var Formatter = /** @class */ (function () {
        function Formatter(locale, formatOptions) {
            this.options = formatOptions;
            this.loc = locale;
            this.systemLoc = undefined;
        }
        Formatter.create = function (locale, options) {
            if (options === void 0) { options = {}; }
            return new Formatter(locale, options);
        };
        Formatter.parseFormat = function (format) {
            var current = undefined, currentFull = "", bracketedLevel = 0;
            var splits = [];
            for (var i = 0; i < format.length; i++) {
                var c = format.charAt(i);
                if (c === "[") {
                    if (bracketedLevel === 0) {
                        if (currentFull.length > 0) {
                            splits.push({ literal: false, val: currentFull });
                        }
                        current = undefined;
                        currentFull = "";
                    }
                    else
                        currentFull += c;
                    bracketedLevel = bracketedLevel + 1;
                }
                else if (c === "]") {
                    bracketedLevel = bracketedLevel - 1;
                    if (bracketedLevel === 0) {
                        if (currentFull.length > 0) {
                            splits.push({ literal: true, val: currentFull });
                        }
                        current = undefined;
                        currentFull = "";
                    }
                    else
                        currentFull += c;
                }
                else if (bracketedLevel > 0) {
                    currentFull += c;
                }
                else if (c === current) {
                    currentFull += c;
                }
                else {
                    if (currentFull.length > 0) {
                        splits.push({ literal: false, val: currentFull });
                    }
                    currentFull = c;
                    current = c;
                }
            }
            if (currentFull.length > 0) {
                splits.push({ literal: bracketedLevel > 0, val: currentFull });
            }
            return splits;
        };
        Formatter.macroTokenToFormatOpts = function (token) {
            return TokenToFormatOpts[token];
        };
        Formatter.prototype.formatWithSystemDefault = function (dt, options) {
            if (this.systemLoc === undefined) {
                this.systemLoc = this.loc.redefaultToSystem();
            }
            var df = this.systemLoc.dtFormatter(dt, Object.assign({}, this.options, options));
            return df.format();
        };
        Formatter.prototype.formatDateTime = function (dt) {
            var df = this.loc.dtFormatter(dt, this.options);
            return df.format();
        };
        Formatter.prototype.formatDateTimeParts = function (dt) {
            var df = this.loc.dtFormatter(dt, this.options);
            return df.formatToParts();
        };
        Formatter.prototype.resolvedOptions = function (dt) {
            var df = this.loc.dtFormatter(dt, this.options);
            return df.resolvedOptions();
        };
        Formatter.prototype.num = function (n, p) {
            if (p === void 0) { p = 0; }
            // we get some perf out of doing this here, annoyingly
            if (this.options.forceSimple) {
                return padStart(n, p);
            }
            var options = {
                padTo: p,
                floor: this.options.floor
            };
            return this.loc.numberFormatter(options).format(n);
        };
        Formatter.prototype.formatDateTimeFromString = function (dt, format) {
            var _this = this;
            var knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory" && hasFormatToParts(), string = function (options, extract) {
                return _this.loc.extract(dt, options, extract);
            }, formatOffset = function (options) {
                return dt.isOffsetFixed && dt.offset === 0 && options.allowZ
                    ? "Z"
                    : dt.zone.formatOffset(dt.toMillis(), options.format);
            }, meridiem = function () {
                return knownEnglish
                    ? meridiemForDateTime(dt)
                    : string({ hour: "numeric", hour12: true }, "dayPeriod");
            }, month = function (length, standalone) {
                return knownEnglish
                    ? monthForDateTime(dt, length)
                    : string(standalone ? { month: length } : { month: length, day: "numeric" }, "month");
            }, weekday = function (length, standalone) {
                return knownEnglish
                    ? weekdayForDateTime(dt, length)
                    : string(standalone ? { weekday: length } : { weekday: length, month: "long", day: "numeric" }, "weekday");
            }, maybeMacro = function (token) {
                var formatOpts = Formatter.macroTokenToFormatOpts(token);
                if (formatOpts) {
                    return _this.formatWithSystemDefault(dt, formatOpts);
                }
                else {
                    return token;
                }
            }, era = function (length) {
                return knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, "era");
            }, tokenToString = function (token) {
                // Where possible: http://cldr.unicode.org/translation/date-time#TOC-Stand-Alone-vs.-Format-Styles
                switch (token) {
                    // ms
                    case "S":
                        return _this.num(dt.millisecond);
                    case "u":
                    // falls through
                    case "SSS":
                        return _this.num(dt.millisecond, 3);
                    // seconds
                    case "s":
                        return _this.num(dt.second);
                    case "ss":
                        return _this.num(dt.second, 2);
                    // minutes
                    case "m":
                        return _this.num(dt.minute);
                    case "mm":
                        return _this.num(dt.minute, 2);
                    // hours
                    case "h":
                        return _this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
                    case "hh":
                        return _this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
                    case "H":
                        return _this.num(dt.hour);
                    case "HH":
                        return _this.num(dt.hour, 2);
                    // offset
                    case "Z":
                        // like +6
                        return formatOffset({ format: "narrow", allowZ: _this.options.allowZ });
                    case "ZZ":
                        // like +06:00
                        return formatOffset({ format: "short", allowZ: _this.options.allowZ });
                    case "ZZZ":
                        // like +0600
                        return formatOffset({ format: "techie", allowZ: _this.options.allowZ });
                    case "ZZZZ":
                        // like EST
                        return (dt.zone.offsetName(dt.toMillis(), { format: "short", locale: _this.loc.locale }) || "");
                    case "ZZZZZ":
                        // like Eastern Standard Time
                        return (dt.zone.offsetName(dt.toMillis(), { format: "long", locale: _this.loc.locale }) || "");
                    // zone
                    case "z":
                        // like America/New_York
                        return dt.zoneName;
                    // meridiems
                    case "a":
                        return meridiem();
                    // dates
                    case "d":
                        return useDateTimeFormatter ? string({ day: "numeric" }, "day") : _this.num(dt.day);
                    case "dd":
                        return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : _this.num(dt.day, 2);
                    // weekdays - standalone
                    case "c":
                        // like 1
                        return _this.num(dt.weekday);
                    case "ccc":
                        // like 'Tues'
                        return weekday("short", true);
                    case "cccc":
                        // like 'Tuesday'
                        return weekday("long", true);
                    case "ccccc":
                        // like 'T'
                        return weekday("narrow", true);
                    // weekdays - format
                    case "E":
                        // like 1
                        return _this.num(dt.weekday);
                    case "EEE":
                        // like 'Tues'
                        return weekday("short", false);
                    case "EEEE":
                        // like 'Tuesday'
                        return weekday("long", false);
                    case "EEEEE":
                        // like 'T'
                        return weekday("narrow", false);
                    // months - standalone
                    case "L":
                        // like 1
                        return useDateTimeFormatter
                            ? string({ month: "numeric", day: "numeric" }, "month")
                            : _this.num(dt.month);
                    case "LL":
                        // like 01, doesn't seem to work
                        return useDateTimeFormatter
                            ? string({ month: "2-digit", day: "numeric" }, "month")
                            : _this.num(dt.month, 2);
                    case "LLL":
                        // like Jan
                        return month("short", true);
                    case "LLLL":
                        // like January
                        return month("long", true);
                    case "LLLLL":
                        // like J
                        return month("narrow", true);
                    // months - format
                    case "M":
                        // like 1
                        return useDateTimeFormatter
                            ? string({ month: "numeric" }, "month")
                            : _this.num(dt.month);
                    case "MM":
                        // like 01
                        return useDateTimeFormatter
                            ? string({ month: "2-digit" }, "month")
                            : _this.num(dt.month, 2);
                    case "MMM":
                        // like Jan
                        return month("short", false);
                    case "MMMM":
                        // like January
                        return month("long", false);
                    case "MMMMM":
                        // like J
                        return month("narrow", false);
                    // years
                    case "y":
                        // like 2014
                        return useDateTimeFormatter ? string({ year: "numeric" }, "year") : _this.num(dt.year);
                    case "yy":
                        // like 14
                        return useDateTimeFormatter
                            ? string({ year: "2-digit" }, "year")
                            : _this.num(parseInt(dt.year.toString(10).slice(-2), 10), 2);
                    case "yyyy":
                        // like 0012
                        return useDateTimeFormatter
                            ? string({ year: "numeric" }, "year")
                            : _this.num(dt.year, 4);
                    case "yyyyyy":
                        // like 000012
                        return useDateTimeFormatter
                            ? string({ year: "numeric" }, "year")
                            : _this.num(dt.year, 6);
                    // eras
                    case "G":
                        // like AD
                        return era("short");
                    case "GG":
                        // like Anno Domini
                        return era("long");
                    case "GGGGG":
                        return era("narrow");
                    case "kk":
                        return _this.num(parseInt(dt.weekYear.toString(10).slice(-2), 10), 2);
                    case "kkkk":
                        return _this.num(dt.weekYear, 4);
                    case "W":
                        return _this.num(dt.weekNumber);
                    case "WW":
                        return _this.num(dt.weekNumber, 2);
                    case "o":
                        return _this.num(dt.ordinal);
                    case "ooo":
                        return _this.num(dt.ordinal, 3);
                    case "q":
                        // like 1
                        return _this.num(dt.quarter);
                    case "qq":
                        // like 01
                        return _this.num(dt.quarter, 2);
                    case "X":
                        return _this.num(Math.floor(dt.toMillis() / 1000));
                    case "x":
                        return _this.num(dt.toMillis());
                    default:
                        return maybeMacro(token);
                }
            };
            return stringifyTokens(Formatter.parseFormat(format), tokenToString);
        };
        Formatter.prototype.formatDurationFromString = function (dur, format) {
            var _this = this;
            var tokenToField = function (token) {
                switch (token[0]) {
                    case "S":
                        return "milliseconds";
                    case "s":
                        return "seconds";
                    case "m":
                        return "minutes";
                    case "h":
                        return "hours";
                    case "d":
                        return "days";
                    case "M":
                        return "months";
                    case "y":
                        return "years";
                    default:
                        return undefined;
                }
            }, tokenToString = function (lildur) { return function (token) {
                var mapped = tokenToField(token);
                if (mapped) {
                    return _this.num(lildur.get(mapped), token.length);
                }
                else {
                    return token;
                }
            }; }, tokens = Formatter.parseFormat(format), realTokens = tokens.reduce(function (found, _a) {
                var literal = _a.literal, val = _a.val;
                return (literal ? found : found.concat(val));
            }, []), collapsed = dur.shiftTo.apply(dur, realTokens.map(tokenToField).filter(Boolean));
            return stringifyTokens(tokens, tokenToString(collapsed));
        };
        return Formatter;
    }());

    var intlDTCache = {};
    function getCachedDTF(locString, options) {
        if (options === void 0) { options = {}; }
        var key = JSON.stringify([locString, options]);
        var dtf = intlDTCache[key];
        if (!dtf) {
            dtf = new Intl.DateTimeFormat(locString, options);
            intlDTCache[key] = dtf;
        }
        return dtf;
    }
    var intlNumCache = {};
    function getCachedINF(locString, options) {
        var key = JSON.stringify([locString, options]);
        var inf = intlNumCache[key];
        if (!inf) {
            inf = new Intl.NumberFormat(locString, options);
            intlNumCache[key] = inf;
        }
        return inf;
    }
    var intlRelCache = {};
    function getCachedRTF(locale, options) {
        if (options === void 0) { options = {}; }
        var key = JSON.stringify([locale, options]);
        var inf = intlRelCache[key];
        if (!inf) {
            inf = new Intl.RelativeTimeFormat(locale, options);
            intlRelCache[key] = inf;
        }
        return inf;
    }
    var sysLocaleCache;
    function systemLocale() {
        if (sysLocaleCache) {
            return sysLocaleCache;
        }
        else if (hasIntl()) {
            var computedSys = new Intl.DateTimeFormat().resolvedOptions().locale;
            // node sometimes defaults to "und". Override that because that is dumb
            sysLocaleCache = !computedSys || computedSys === "und" ? "en-US" : computedSys;
            return sysLocaleCache;
        }
        else {
            sysLocaleCache = "en-US";
            return sysLocaleCache;
        }
    }
    function parseLocaleString(localeStr) {
        // I really want to avoid writing a BCP 47 parser
        // see, e.g. https://github.com/wooorm/bcp-47
        // Instead, we'll do this:
        // a) if the string has no -u extensions, just leave it alone
        // b) if it does, use Intl to resolve everything
        // c) if Intl fails, try again without the -u
        var uIndex = localeStr.indexOf("-u-");
        if (uIndex === -1) {
            return [localeStr];
        }
        else {
            var options = void 0;
            var smaller = localeStr.substring(0, uIndex);
            try {
                options = getCachedDTF(localeStr).resolvedOptions();
            }
            catch (e) {
                options = getCachedDTF(smaller).resolvedOptions();
            }
            var numberingSystem = options.numberingSystem, calendar = options.calendar;
            // return the smaller one so that we can append the calendar and numbering overrides to it
            return [smaller, numberingSystem, calendar];
        }
    }
    function intlConfigString(localeStr, numberingSystem, outputCalendar) {
        if (hasIntl()) {
            if (outputCalendar || numberingSystem) {
                localeStr += "-u";
                if (outputCalendar) {
                    localeStr += "-ca-" + outputCalendar;
                }
                if (numberingSystem) {
                    localeStr += "-nu-" + numberingSystem;
                }
                return localeStr;
            }
            else {
                return localeStr;
            }
        }
        else {
            // arbitrary value, should never be used, all subsequent uses of this.intl are protected by an hasIntl check
            return "";
        }
    }
    function mapMonths(f) {
        var ms = [];
        for (var i = 1; i <= 12; i++) {
            var dt = DateTime.utc(2016, i, 1);
            ms.push(f(dt));
        }
        return ms;
    }
    function mapWeekdays(f) {
        var ms = [];
        for (var i = 1; i <= 7; i++) {
            var dt = DateTime.utc(2016, 11, 13 + i);
            ms.push(f(dt));
        }
        return ms;
    }
    function listStuff(loc, length, defaultOK, englishFn, intlFn) {
        var mode = loc.listingMode(defaultOK);
        if (mode === "error") {
            return [];
        }
        else if (mode === "en") {
            return englishFn(length);
        }
        else {
            return intlFn(length);
        }
    }
    var PolyNumberFormatter = /** @class */ (function () {
        function PolyNumberFormatter(intl, forceSimple, options) {
            this.padTo = options.padTo || 0;
            this.floor = options.floor || false;
            if (!forceSimple && hasIntl()) {
                var intlOpts = { useGrouping: false };
                if (this.padTo > 0) {
                    intlOpts.minimumIntegerDigits = this.padTo;
                }
                this.inf = getCachedINF(intl, intlOpts);
            }
        }
        PolyNumberFormatter.prototype.format = function (i) {
            if (this.inf) {
                var fixed = this.floor ? Math.floor(i) : i;
                return this.inf.format(fixed);
            }
            else {
                // to match the browser's numberformatter defaults
                var fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
                return padStart(fixed, this.padTo);
            }
        };
        return PolyNumberFormatter;
    }());
    /**
     * @private
     */
    var PolyDateFormatter = /** @class */ (function () {
        function PolyDateFormatter(dt, intl, options) {
            this.options = options;
            var hasIntlDTF = hasIntl();
            var z;
            if (dt.zone.isUniversal && hasIntlDTF) {
                // Chromium doesn't support fixed-offset zones like Etc/GMT+8 in its formatter,
                // See https://bugs.chromium.org/p/chromium/issues/detail?id=364374.
                // So we have to make do. Two cases:
                // 1. The format options tell us to show the zone. We can't do that, so the best
                // we can do is format the date in UTC.
                // 2. The format options don't tell us to show the zone. Then we can adjust
                // the time and tell the formatter to show it to us in UTC, so that the time is right
                // and the bad zone doesn't show up.
                // We can clean all this up when Chrome fixes this.
                z = "UTC";
                if (options.timeZoneName) {
                    this.dt = dt;
                }
                else {
                    this.dt = dt.offset === 0 ? dt : DateTime.fromMillis(dt.toMillis() + dt.offset * 60 * 1000);
                }
            }
            else if (dt.zone.type === "system") {
                this.dt = dt;
            }
            else {
                this.dt = dt;
                z = dt.zone.name;
            }
            if (hasIntlDTF) {
                var intlOpts = Object.assign({}, this.options);
                if (z) {
                    intlOpts.timeZone = z;
                }
                this.dtf = getCachedDTF(intl, intlOpts);
            }
        }
        PolyDateFormatter.prototype.format = function () {
            if (this.dtf) {
                return this.dtf.format(this.dt.toJSDate());
            }
            else {
                var tokenFormat = formatString(this.options), loc = Locale.create("en-US");
                return Formatter.create(loc).formatDateTimeFromString(this.dt, tokenFormat);
            }
        };
        PolyDateFormatter.prototype.formatToParts = function () {
            if (this.dtf && hasFormatToParts()) {
                return this.dtf.formatToParts(this.dt.toJSDate());
            }
            else {
                // This is kind of a cop out. We actually could do this for English. However, we couldn't do it for intl strings
                // and IMO it's too weird to have an uncanny valley like that
                return [];
            }
        };
        PolyDateFormatter.prototype.resolvedOptions = function () {
            if (this.dtf) {
                return this.dtf.resolvedOptions();
            }
            else {
                return {
                    locale: "en-US",
                    numberingSystem: "latn",
                    calendar: "gregory",
                    timeZone: "UTC"
                };
            }
        };
        return PolyDateFormatter;
    }());
    /**
     * @private
     */
    var PolyRelFormatter = /** @class */ (function () {
        function PolyRelFormatter(locale, isEnglish, options) {
            this.options = Object.assign({ style: "long" }, options);
            if (!isEnglish && hasRelative()) {
                this.rtf = getCachedRTF(locale, options);
            }
        }
        PolyRelFormatter.prototype.format = function (count, unit) {
            if (this.rtf) {
                return this.rtf.format(count, unit);
            }
            else {
                return formatRelativeTime(unit, count, this.options.numeric, this.options.style !== "long");
            }
        };
        PolyRelFormatter.prototype.formatToParts = function (count, unit) {
            if (this.rtf) {
                return this.rtf.formatToParts(count, unit);
            }
            else {
                return [];
            }
        };
        return PolyRelFormatter;
    }());
    /**
     * @private
     */
    var Locale = /** @class */ (function () {
        function Locale(locale, numberingSystem, outputCalendar, specifiedLocale) {
            var _a = parseLocaleString(locale), parsedLocale = _a[0], parsedNumberingSystem = _a[1], parsedOutputCalendar = _a[2];
            this.locale = parsedLocale;
            this.numberingSystem = numberingSystem || parsedNumberingSystem;
            this.outputCalendar = outputCalendar || parsedOutputCalendar;
            this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
            this.weekdaysCache = { format: {}, standalone: {} };
            this.monthsCache = { format: {}, standalone: {} };
            this.meridiemCache = undefined;
            this.eraCache = {};
            this.specifiedLocale = specifiedLocale;
            this.fastNumbersCached = undefined;
        }
        Locale.create = function (locale, numberingSystem, outputCalendar, defaultToEN) {
            if (defaultToEN === void 0) { defaultToEN = false; }
            var specifiedLocale = locale || Settings.defaultLocale, 
            // the system locale is useful for human readable strings but annoying for parsing/formatting known formats
            localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale()), numberingSystemR = numberingSystem || Settings.defaultNumberingSystem, outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
            return new Locale(localeR, numberingSystemR, outputCalendarR, specifiedLocale);
        };
        Locale.resetCache = function () {
            sysLocaleCache = undefined;
            intlDTCache = {};
            intlNumCache = {};
            intlRelCache = {};
        };
        Locale.fromObject = function (_a) {
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem, outputCalendar = _b.outputCalendar;
            return Locale.create(locale, numberingSystem, outputCalendar);
        };
        Locale.prototype.supportsFastNumbers = function () {
            if (this.numberingSystem && this.numberingSystem !== "latn") {
                return false;
            }
            else {
                return (this.numberingSystem === "latn" ||
                    !this.locale ||
                    this.locale.startsWith("en") ||
                    (hasIntl() && Intl.DateTimeFormat(this.intl).resolvedOptions().numberingSystem === "latn"));
            }
        };
        Object.defineProperty(Locale.prototype, "fastNumbers", {
            get: function () {
                if (this.fastNumbersCached === undefined) {
                    this.fastNumbersCached = this.supportsFastNumbers();
                }
                return this.fastNumbersCached;
            },
            enumerable: false,
            configurable: true
        });
        Locale.prototype.listingMode = function (defaultOK) {
            if (defaultOK === void 0) { defaultOK = true; }
            var intl = hasIntl(), hasFTP = intl && hasFormatToParts(), isActuallyEn = this.isEnglish(), hasNoWeirdness = (this.numberingSystem === undefined || this.numberingSystem === "latn") &&
                (this.outputCalendar === undefined || this.outputCalendar === "gregory");
            if (!hasFTP && !(isActuallyEn && hasNoWeirdness) && !defaultOK) {
                return "error";
            }
            else if (!hasFTP || (isActuallyEn && hasNoWeirdness)) {
                return "en";
            }
            else {
                return "intl";
            }
        };
        Locale.prototype.clone = function (alts, defaultToEN) {
            if (defaultToEN === void 0) { defaultToEN = false; }
            if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
                return this;
            }
            else {
                return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, defaultToEN);
            }
        };
        Locale.prototype.redefaultToEN = function (alts) {
            if (alts === void 0) { alts = {}; }
            return this.clone(alts, true /* defaultToEN */);
        };
        Locale.prototype.redefaultToSystem = function (alts) {
            if (alts === void 0) { alts = {}; }
            return this.clone(alts);
        };
        Locale.prototype.months = function (length, format, defaultOK) {
            var _this = this;
            if (format === void 0) { format = false; }
            if (defaultOK === void 0) { defaultOK = true; }
            return listStuff(this, length, defaultOK, months, function (len) {
                var intl = format ? { month: len, day: "numeric" } : { month: len }, formatStr = format ? "format" : "standalone";
                if (!_this.monthsCache[formatStr][len]) {
                    _this.monthsCache[formatStr][len] = mapMonths(function (dt) { return _this.extract(dt, intl, "month"); });
                }
                return _this.monthsCache[formatStr][len];
            });
        };
        Locale.prototype.weekdays = function (length, format, defaultOK) {
            var _this = this;
            if (format === void 0) { format = false; }
            if (defaultOK === void 0) { defaultOK = true; }
            return listStuff(this, length, defaultOK, weekdays, function (len) {
                var intl = format
                    ? { weekday: len, year: "numeric", month: "long", day: "numeric" }
                    : { weekday: len }, formatStr = format ? "format" : "standalone";
                if (!_this.weekdaysCache[formatStr][len]) {
                    _this.weekdaysCache[formatStr][len] = mapWeekdays(function (dt) { return _this.extract(dt, intl, "weekday"); });
                }
                return _this.weekdaysCache[formatStr][len];
            });
        };
        Locale.prototype.meridiems = function (defaultOK) {
            var _this = this;
            if (defaultOK === void 0) { defaultOK = true; }
            return listStuff(this, "long", // arbitrary unused value
            defaultOK, function () { return meridiems; }, function () {
                // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
                // for AM and PM. This is probably wrong, but it makes parsing way easier.
                if (_this.meridiemCache === undefined) {
                    var intl_1 = { hour: "numeric", hour12: true };
                    _this.meridiemCache = [
                        DateTime.utc(2016, 11, 13, 9),
                        DateTime.utc(2016, 11, 13, 19)
                    ].map(function (dt) { return _this.extract(dt, intl_1, "dayPeriod"); });
                }
                return _this.meridiemCache;
            });
        };
        Locale.prototype.eras = function (length, defaultOK) {
            var _this = this;
            if (defaultOK === void 0) { defaultOK = true; }
            return listStuff(this, length, defaultOK, eras, function (len) {
                var intl = { era: len };
                // This is utter bullshit. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
                // to definitely enumerate them.
                if (!_this.eraCache[len]) {
                    _this.eraCache[len] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(function (dt) {
                        return _this.extract(dt, intl, "era");
                    });
                }
                return _this.eraCache[len];
            });
        };
        Locale.prototype.extract = function (dt, intlOptions, field) {
            var df = this.dtFormatter(dt, intlOptions), results = df.formatToParts(), 
            // Lower case comparison, type is 'dayperiod' instead of 'dayPeriod' in documentation
            matching = results.find(function (m) { return m.type.toLowerCase() === field.toLowerCase(); });
            if (!matching) {
                throw new Error("Invalid extract field " + field);
            }
            return matching.value;
        };
        Locale.prototype.numberFormatter = function (options) {
            if (options === void 0) { options = {}; }
            return new PolyNumberFormatter(this.intl, this.fastNumbers, options);
        };
        Locale.prototype.dtFormatter = function (dt, intlOptions) {
            if (intlOptions === void 0) { intlOptions = {}; }
            return new PolyDateFormatter(dt, this.intl, intlOptions);
        };
        Locale.prototype.relFormatter = function (options) {
            if (options === void 0) { options = {}; }
            return new PolyRelFormatter(this.intl, this.isEnglish(), options);
        };
        Locale.prototype.isEnglish = function () {
            return (this.locale === "en" ||
                this.locale.toLowerCase() === "en-us" ||
                (hasIntl() && new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us")));
        };
        Locale.prototype.equals = function (other) {
            return (this.locale === other.locale &&
                this.numberingSystem === other.numberingSystem &&
                this.outputCalendar === other.outputCalendar);
        };
        return Locale;
    }());

    function combineRegexes() {
        var regexes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            regexes[_i] = arguments[_i];
        }
        var full = regexes.reduce(function (f, r) { return f + r.source; }, "");
        return RegExp("^" + full + "$");
    }
    function combineExtractors() {
        var extractors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            extractors[_i] = arguments[_i];
        }
        var combinedExtractor = function (match) {
            return extractors
                .reduce(function (_a, ex) {
                var mergedVals = _a[0], mergedZone = _a[1], cursor = _a[2];
                var _b = ex(match, cursor), val = _b[0], zone = _b[1], next = _b[2];
                return [Object.assign(mergedVals, val), mergedZone || zone, next];
            }, [{}, null, 1])
                .slice(0, 2);
        };
        return combinedExtractor;
    }
    function parse(s) {
        var patterns = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            patterns[_i - 1] = arguments[_i];
        }
        if (s === undefined || s === null) {
            return [null, null];
        }
        for (var _a = 0, patterns_1 = patterns; _a < patterns_1.length; _a++) {
            var _b = patterns_1[_a], regex = _b[0], extractor = _b[1];
            var m = regex.exec(s);
            if (m !== null) {
                return extractor(m);
            }
        }
        return [null, null];
    }
    function simpleParse() {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        return function (match, cursor) {
            var ret = {};
            var i;
            for (i = 0; i < keys.length; i++) {
                ret[keys[i]] = parseInteger(match[cursor + i]);
            }
            return [ret, null, cursor + i];
        };
    }
    // ISO and SQL parsing
    var offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/, isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/, isoTimeRegex = RegExp("" + isoTimeBaseRegex.source + offsetRegex.source + "?"), isoTimeExtensionRegex = RegExp("(?:T" + isoTimeRegex.source + ")?"), isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/, isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/, isoOrdinalRegex = /(\d{4})-?(\d{3})/, extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekday"), extractISOOrdinalData = simpleParse("year", "ordinal"), sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/, // dumbed-down version of the ISO one
    sqlTimeRegex = RegExp(isoTimeBaseRegex.source + " ?(?:" + offsetRegex.source + "|(" + ianaRegex.source + "))?"), sqlTimeExtensionRegex = RegExp("(?: " + sqlTimeRegex.source + ")?");
    function int(match, pos, fallback) {
        var m = match[pos];
        return isUndefined(m) ? fallback : parseInteger(m);
    }
    function extractISOYmd(match, cursor) {
        var item = {
            year: int(match, cursor, 0),
            month: int(match, cursor + 1, 1),
            day: int(match, cursor + 2, 1)
        };
        return [item, null, cursor + 3];
    }
    function extractISOTime(match, cursor) {
        var item = {
            hour: int(match, cursor, 0),
            minute: int(match, cursor + 1, 0),
            second: int(match, cursor + 2, 0),
            millisecond: parseMillis(match[cursor + 3])
        };
        return [item, null, cursor + 4];
    }
    function extractISOOffset(match, cursor) {
        var local = !match[cursor] && !match[cursor + 1], fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]), zone = local ? null : FixedOffsetZone.instance(fullOffset);
        return [{}, zone, cursor + 3];
    }
    function extractIANAZone(match, cursor) {
        var zone = match[cursor] ? IANAZone.create(match[cursor]) : null;
        return [{}, zone, cursor + 1];
    }
    // ISO duration parsing
    var isoDuration = /^-?P(?:(?:(-?\d{1,9})Y)?(?:(-?\d{1,9})M)?(?:(-?\d{1,9})W)?(?:(-?\d{1,9})D)?(?:T(?:(-?\d{1,9})H)?(?:(-?\d{1,9})M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,9}))?S)?)?)$/;
    function extractISODuration(match) {
        var s = match[0], yearStr = match[1], monthStr = match[2], weekStr = match[3], dayStr = match[4], hourStr = match[5], minuteStr = match[6], secondStr = match[7], millisecondsStr = match[8];
        var hasNegativePrefix = s.startsWith("-");
        var maybeNegate = function (num) {
            return num !== undefined && hasNegativePrefix ? -num : num;
        };
        return {
            years: maybeNegate(parseInteger(yearStr)),
            months: maybeNegate(parseInteger(monthStr)),
            weeks: maybeNegate(parseInteger(weekStr)),
            days: maybeNegate(parseInteger(dayStr)),
            hours: maybeNegate(parseInteger(hourStr)),
            minutes: maybeNegate(parseInteger(minuteStr)),
            seconds: maybeNegate(parseInteger(secondStr)),
            milliseconds: maybeNegate(parseMillis(millisecondsStr))
        };
    }
    // These are a little braindead. EDT *should* tell us that we're in, say, America/New_York
    // and not just that we're in -240 *right now*. But since I don't think these are used that often
    // I'm just going to ignore that
    var obsOffsets = {
        GMT: 0,
        EDT: -4 * 60,
        EST: -5 * 60,
        CDT: -5 * 60,
        CST: -6 * 60,
        MDT: -6 * 60,
        MST: -7 * 60,
        PDT: -7 * 60,
        PST: -8 * 60
    };
    function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
        var weekday;
        if (weekdayStr) {
            weekday =
                weekdayStr.length > 3
                    ? weekdaysLong.indexOf(weekdayStr) + 1
                    : weekdaysShort.indexOf(weekdayStr) + 1;
        }
        var year = yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr);
        return {
            year: year,
            month: monthsShort.indexOf(monthStr) + 1,
            day: parseInteger(dayStr),
            hour: parseInteger(hourStr),
            minute: parseInteger(minuteStr),
            second: parseInteger(secondStr),
            weekday: weekday
        };
    }
    // RFC 2822/5322
    var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
    function extractRFC2822(match) {
        var weekdayStr = match[1], dayStr = match[2], monthStr = match[3], yearStr = match[4], hourStr = match[5], minuteStr = match[6], secondStr = match[7], obsOffset = match[8], milOffset = match[9], offHourStr = match[10], offMinuteStr = match[11], result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
        var offset;
        if (obsOffset) {
            offset = obsOffsets[obsOffset];
        }
        else if (milOffset) {
            offset = 0;
        }
        else {
            offset = signedOffset(offHourStr, offMinuteStr);
        }
        return [result, new FixedOffsetZone(offset)];
    }
    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s
            .replace(/\([^)]*\)|[\n\t]/g, " ")
            .replace(/(\s\s+)/g, " ")
            .trim();
    }
    // http date
    var rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wedsday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
    function extractRFC1123Or850(match) {
        var weekdayStr = match[1], dayStr = match[2], monthStr = match[3], yearStr = match[4], hourStr = match[5], minuteStr = match[6], secondStr = match[7], result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
        return [result, FixedOffsetZone.utcInstance];
    }
    function extractASCII(match) {
        var weekdayStr = match[1], monthStr = match[2], dayStr = match[3], hourStr = match[4], minuteStr = match[5], secondStr = match[6], yearStr = match[7], result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
        return [result, FixedOffsetZone.utcInstance];
    }
    var isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
    var isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
    var isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
    var isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
    var extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset);
    var extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset);
    var extractISOOrdinalDataAndTime = combineExtractors(extractISOOrdinalData, extractISOTime);
    var extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset);
    /**
     * @private
     */
    function parseISODate(s) {
        return parse(s, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDataAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
    }
    function parseRFC2822Date(s) {
        return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
    }
    function parseHTTPDate(s) {
        return parse(s, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
    }
    function parseISODuration(s) {
        var m = isoDuration.exec(s);
        if (m !== null) {
            return extractISODuration(m);
        }
        return undefined;
    }
    var sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
    var sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
    var extractISOYmdTimeOffsetAndIANAZone = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
    var extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
    function parseSQL(s) {
        return parse(s, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeOffsetAndIANAZone], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
    }

    // unit conversion constants
    var lowOrderMatrix = {
        weeks: {
            days: 7,
            hours: 7 * 24,
            minutes: 7 * 24 * 60,
            seconds: 7 * 24 * 60 * 60,
            milliseconds: 7 * 24 * 60 * 60 * 1000
        },
        days: {
            hours: 24,
            minutes: 24 * 60,
            seconds: 24 * 60 * 60,
            milliseconds: 24 * 60 * 60 * 1000
        },
        hours: { minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1000 },
        minutes: { seconds: 60, milliseconds: 60 * 1000 },
        seconds: { milliseconds: 1000 }
    }, casualMatrix = Object.assign({
        years: {
            quarters: 4,
            months: 12,
            weeks: 52,
            days: 365,
            hours: 365 * 24,
            minutes: 365 * 24 * 60,
            seconds: 365 * 24 * 60 * 60,
            milliseconds: 365 * 24 * 60 * 60 * 1000
        },
        quarters: {
            months: 3,
            weeks: 13,
            days: 91,
            hours: 91 * 24,
            minutes: 91 * 24 * 60,
            seconds: 91 * 24 * 60 * 60,
            milliseconds: 91 * 24 * 60 * 60 * 1000
        },
        months: {
            weeks: 4,
            days: 30,
            hours: 30 * 24,
            minutes: 30 * 24 * 60,
            seconds: 30 * 24 * 60 * 60,
            milliseconds: 30 * 24 * 60 * 60 * 1000
        }
    }, lowOrderMatrix), daysInYearAccurate = 146097.0 / 400, daysInMonthAccurate = 146097.0 / 4800, accurateMatrix = Object.assign({
        years: {
            quarters: 4,
            months: 12,
            weeks: daysInYearAccurate / 7,
            days: daysInYearAccurate,
            hours: daysInYearAccurate * 24,
            minutes: daysInYearAccurate * 24 * 60,
            seconds: daysInYearAccurate * 24 * 60 * 60,
            milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1000
        },
        quarters: {
            months: 3,
            weeks: daysInYearAccurate / 28,
            days: daysInYearAccurate / 4,
            hours: (daysInYearAccurate * 24) / 4,
            minutes: (daysInYearAccurate * 24 * 60) / 4,
            seconds: (daysInYearAccurate * 24 * 60 * 60) / 4,
            milliseconds: (daysInYearAccurate * 24 * 60 * 60 * 1000) / 4
        },
        months: {
            weeks: daysInMonthAccurate / 7,
            days: daysInMonthAccurate,
            hours: daysInMonthAccurate * 24,
            minutes: daysInMonthAccurate * 24 * 60,
            seconds: daysInMonthAccurate * 24 * 60 * 60,
            milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1000
        }
    }, lowOrderMatrix);
    // units ordered by size
    var orderedUnits = [
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
    var reverseUnits = orderedUnits.slice(0).reverse();
    function antiTrunc(n) {
        return n < 0 ? Math.floor(n) : Math.ceil(n);
    }
    // NB: mutates parameters
    function convert(matrix, fromMap, fromUnit, toMap, toUnit) {
        var conv = matrix[toUnit][fromUnit], raw = fromMap[fromUnit] / conv, sameSign = Math.sign(raw) === Math.sign(toMap[toUnit]), 
        // ok, so this is wild, but see the matrix in the tests
        added = !sameSign && toMap[toUnit] !== 0 && Math.abs(raw) <= 1 ? antiTrunc(raw) : Math.trunc(raw);
        toMap[toUnit] = toMap[toUnit] + added;
        fromMap[fromUnit] = fromMap[fromUnit] - added * conv;
    }
    // NB: mutates vals parameters
    function normalizeValues(matrix, vals) {
        var previousUnit;
        reverseUnits.forEach(function (unit) {
            if (!isUndefined(vals[unit])) {
                if (previousUnit) {
                    convert(matrix, vals, previousUnit, vals, unit);
                }
                previousUnit = unit;
            }
        });
    }
    /**
     * A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime.plus} to add a Duration object to a DateTime, producing another DateTime.
     *
     * Here is a brief overview of commonly used methods and getters in Duration:
     *
     * * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
     * * **Unit values** See the {@link Duration#years}, {@link Duration.months}, {@link Duration#weeks}, {@link Duration#days}, {@link Duration#hours}, {@link Duration#minutes}, {@link Duration#seconds}, {@link Duration#milliseconds} accessors.
     * * **Configuration** See  {@link Duration#locale} and {@link Duration#numberingSystem} accessors.
     * * **Transformation** To create new Durations out of old ones use {@link Duration#plus}, {@link Duration#minus}, {@link Duration#normalize}, {@link Duration#set}, {@link Duration#reconfigure}, {@link Duration#shiftTo}, and {@link Duration#negate}.
     * * **Output** To convert the Duration into other representations, see {@link Duration#as}, {@link Duration#toISO}, {@link Duration#toFormat}, and {@link Duration#toJSON}
     *
     * There are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
     */
    var Duration = /** @class */ (function () {
        /**
         * @private
         */
        function Duration(config) {
            var accurate = config.conversionAccuracy === "longterm" || false;
            /**
             * @access private
             */
            this.values = config.values;
            /**
             * @access private
             */
            this.loc = config.loc || Locale.create();
            /**
             * @access private
             */
            this.matrix = accurate ? accurateMatrix : casualMatrix;
            /**
             * @access private
             */
            this.isLuxonDuration = true;
        }
        /**
         * Create Duration from a number of milliseconds.
         * @param {number} count of milliseconds
         * @param {Object} options - options for parsing
         * @param {string} [options.locale='en-US'] - the locale to use
         * @param {string} [options.numberingSystem] - the numbering system to use
         * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
         * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on error instead of throwing
         * @return {Duration}
         */
        Duration.fromMillis = function (count, options) {
            if (options === void 0) { options = {}; }
            return Duration.fromObject({ milliseconds: count }, options);
        };
        /**
         * Create a Duration from a Javascript object with keys like 'years' and 'hours.
         * If this object is empty then a zero milliseconds duration is returned.
         * @param {Object} obj - the object to create the Duration from
         * @param {number} obj.years
         * @param {number} obj.quarters
         * @param {number} obj.months
         * @param {number} obj.weeks
         * @param {number} obj.days
         * @param {number} obj.hours
         * @param {number} obj.minutes
         * @param {number} obj.seconds
         * @param {number} obj.milliseconds
         * @param {Object} options - options for parsing
         * @param {string} [options.locale='en-US'] - the locale to use
         * @param {string} [options.numberingSystem] - the numbering system to use
         * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
         * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on error instead of throwing
         * @return {Duration}
         */
        Duration.fromObject = function (obj, options) {
            if (options === void 0) { options = {}; }
            if (obj === undefined || obj === null || typeof obj !== "object") {
                if (options.nullOnInvalid) {
                    return null;
                }
                throw new InvalidArgumentError("Duration.fromObject: argument expected to be an object, got " + (obj === null ? "null" : typeof obj));
            }
            var values;
            try {
                values = normalizeObject(obj, Duration.normalizeUnit);
            }
            catch (error) {
                if (options.nullOnInvalid) {
                    return null;
                }
                throw error;
            }
            return new Duration({
                values: values,
                loc: Locale.fromObject(options),
                conversionAccuracy: options.conversionAccuracy
            });
        };
        /**
         * Create a Duration from an ISO 8601 duration string.
         * @param {string} text - text to parse
         * @param {Object} options - options for parsing
         * @param {string} [options.locale='en-US'] - the locale to use
         * @param {string} [options.numberingSystem] - the numbering system to use
         * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
         * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on failed parsing instead of throwing
         * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
         * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
         * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
         * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
         * @return {Duration}
         */
        Duration.fromISO = function (text, options) {
            if (options === void 0) { options = {}; }
            var parsed = parseISODuration(text);
            if (parsed) {
                return Duration.fromObject(parsed, options);
            }
            else {
                if (options.nullOnInvalid) {
                    return null;
                }
                throw new UnparsableStringError("ISO 8601", text);
            }
        };
        /**
         * @private
         */
        Duration.normalizeUnit = function (unit) {
            // TODO should be private
            var pluralMapping = {
                year: "years",
                years: "years",
                quarter: "quarters",
                quarters: "quarters",
                month: "months",
                months: "months",
                week: "weeks",
                weeks: "weeks",
                day: "days",
                days: "days",
                hour: "hours",
                hours: "hours",
                minute: "minutes",
                minutes: "minutes",
                second: "seconds",
                seconds: "seconds",
                millisecond: "milliseconds",
                milliseconds: "milliseconds"
            };
            var normalized = pluralMapping[(unit ? unit.toLowerCase() : unit)];
            if (!normalized) {
                throw new InvalidUnitError(unit);
            }
            return normalized;
        };
        /**
         * Check if an object is a Duration. Works across context boundaries
         * @param {Object} o
         * @return {boolean}
         */
        Duration.isDuration = function (o) {
            return (o && o.isLuxonDuration) || false;
        };
        Object.defineProperty(Duration.prototype, "locale", {
            /**
             * Get  the locale of a Duration, such 'en-GB'
             * @type {string}
             */
            get: function () {
                return this.loc.locale;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "numberingSystem", {
            /**
             * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
             *
             * @type {NumberingSystem}
             */
            get: function () {
                return this.loc.numberingSystem;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
         * * `S` for milliseconds
         * * `s` for seconds
         * * `m` for minutes
         * * `h` for hours
         * * `d` for days
         * * `M` for months
         * * `y` for years
         * Notes:
         * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
         * * The duration will be converted to the set of units in the format string using {@link Duration.shiftTo} and the Durations's conversion accuracy setting.
         * @param {string} format - the format string
         * @param {Object} options - options
         * @param {boolean} [options.floor=true] - whether to floor numerical values or not
         * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
         * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
         * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
         * @return {string}
         */
        Duration.prototype.toFormat = function (format, options) {
            if (options === void 0) { options = { floor: true }; }
            return Formatter.create(this.loc, options).formatDurationFromString(this, format);
        };
        /**
         * Returns a Javascript object with this Duration's values.
         * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
         * @return {Object}
         */
        Duration.prototype.toObject = function () {
            return Object.assign({}, this.values);
        };
        /**
         * Returns an ISO 8601-compliant string representation of this Duration.
         * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
         * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
         * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
         * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
         * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
         * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
         * @return {string}
         */
        Duration.prototype.toISO = function () {
            // we could use the formatter, but this is an easier way to get the minimum string
            var s = "P";
            if (this.years !== 0) {
                s += this.years + "Y";
            }
            if (this.months !== 0 || this.quarters !== 0) {
                s += this.months + this.quarters * 3 + "M";
            }
            if (this.weeks !== 0) {
                s += this.weeks + "W";
            }
            if (this.days !== 0) {
                s += this.days + "D";
            }
            if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) {
                s += "T";
            }
            if (this.hours !== 0) {
                s += this.hours + "H";
            }
            if (this.minutes !== 0) {
                s += this.minutes + "M";
            }
            if (this.seconds !== 0 || this.milliseconds !== 0) 
            // this will handle "floating point madness" by removing extra decimal places
            // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
            {
                s += roundTo(this.seconds + this.milliseconds / 1000, 3) + "S";
            }
            if (s === "P") {
                s += "T0S";
            }
            return s;
        };
        /**
         * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
         * @return {string}
         */
        Duration.prototype.toJSON = function () {
            return this.toISO();
        };
        /**
         * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
         * @return {string}
         */
        Duration.prototype.toString = function () {
            return this.toISO();
        };
        /**
         * Returns an milliseconds value of this Duration.
         * @return {number}
         */
        Duration.prototype.valueOf = function () {
            return this.as("milliseconds");
        };
        /**
         * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
         * @param {Duration|Object} duration - The amount to add. Either a Luxon Duration or the object argument to Duration.fromObject()
         * @return {Duration}
         */
        Duration.prototype.plus = function (duration) {
            var _this = this;
            var dur = friendlyDuration(duration), result = {};
            orderedUnits.forEach(function (unit) {
                if (dur.values[unit] !== undefined || _this.values[unit] !== undefined) {
                    result[unit] = dur.get(unit) + _this.get(unit);
                }
            });
            return this.clone(result);
        };
        /**
         * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
         * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
         * @return {Duration}
         */
        Duration.prototype.minus = function (duration) {
            var dur = friendlyDuration(duration);
            return this.plus(dur.negate());
        };
        /**
         * Scale this Duration by the specified amount. Return a newly-constructed Duration.
         * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
         * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit(x => x * 2) //=> { hours: 2, minutes: 60 }
         * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit((x, u) => u === "hour" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
         * @return {Duration}
         */
        Duration.prototype.mapUnits = function (fn) {
            var result = {};
            for (var k in this.values) {
                var unit = k;
                result[unit] = asNumber(fn(this.values[unit], unit));
            }
            return this.clone(result);
        };
        /**
         * Get the value of unit.
         * @param {string} unit - a unit such as 'minute' or 'day'
         * @example Duration.fromObject({years: 2, days: 3}).years //=> 2
         * @example Duration.fromObject({years: 2, days: 3}).months //=> 0
         * @example Duration.fromObject({years: 2, days: 3}).days //=> 3
         * @return {number}
         */
        Duration.prototype.get = function (unit) {
            return this[Duration.normalizeUnit(unit)];
        };
        /**
         * "Set" the values of specified units. Non-specified units stay unchanged. Return a newly-constructed Duration.
         * @param {Object} values - a mapping of units to numbers
         * @example dur.set({ years: 2017 })
         * @example dur.set({ hours: 8, minutes: 30 })
         * @return {Duration}
         */
        Duration.prototype.set = function (values) {
            var mixed = Object.assign(this.values, normalizeObject(values, Duration.normalizeUnit));
            return this.clone(mixed, false /* do not clean, merge with existing */);
        };
        /**
         * "Set" the locale and/or numberingSystem and/or conversionAccuracy. Returns a newly-constructed Duration.
         * @example dur.reconfigure({ locale: 'en-GB' })
         * @return {Duration}
         */
        Duration.prototype.reconfigure = function (_a) {
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem, conversionAccuracy = _b.conversionAccuracy;
            var conf = {
                values: this.values,
                loc: this.loc.clone({ locale: locale, numberingSystem: numberingSystem }),
                conversionAccuracy: conversionAccuracy || this.conversionAccuracy()
            };
            return new Duration(conf);
        };
        /**
         * Return the length of the duration in the specified unit.
         * @param {string} unit - a unit such as 'minutes' or 'days'
         * @example Duration.fromObject({years: 1}).as('days') //=> 365
         * @example Duration.fromObject({years: 1}).as('months') //=> 12
         * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
         * @return {number}
         */
        Duration.prototype.as = function (unit) {
            return this.shiftTo(unit).get(unit);
        };
        /**
         * Reduce this Duration to its canonical representation in its current units.
         * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
         * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
         * @return {Duration}
         */
        Duration.prototype.normalize = function () {
            // todo - this should keep the options...
            var vals = this.toObject();
            normalizeValues(this.matrix, vals);
            return this.clone(vals);
        };
        /**
         * Convert this Duration into its representation in a different set of units.
         * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
         * @return {Duration}
         */
        Duration.prototype.shiftTo = function () {
            var units = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                units[_i] = arguments[_i];
            }
            var normalizedUnits = units.map(function (u) { return Duration.normalizeUnit(u); });
            if (normalizedUnits.length === 0) {
                return this;
            }
            var built = {}, accumulated = {}, vals = this.toObject();
            var lastUnit = undefined;
            for (var _a = 0, orderedUnits_1 = orderedUnits; _a < orderedUnits_1.length; _a++) {
                var k = orderedUnits_1[_a];
                if (normalizedUnits.indexOf(k) >= 0) {
                    lastUnit = k;
                    var own = 0;
                    // anything we haven't boiled down yet should get boiled to this unit
                    for (var acc in accumulated) {
                        var unit = acc;
                        own += this.matrix[unit][k] * accumulated[unit];
                        delete accumulated[unit];
                    }
                    // plus anything that's already in this unit
                    var unitValue = vals[k];
                    if (isNumber(unitValue)) {
                        own += unitValue;
                    }
                    var i = Math.trunc(own);
                    built[k] = i;
                    accumulated[k] = own - i; // we'd like to absorb these fractions in another unit
                    // plus anything further down the chain that should be rolled up in to this
                    for (var down in vals) {
                        if (orderedUnits.indexOf(down) > orderedUnits.indexOf(k)) {
                            convert(this.matrix, vals, down, built, k // never happens when k is milliseconds
                            );
                        }
                    }
                    // otherwise, keep it in the wings to boil it later
                }
                else if (isNumber(vals[k])) {
                    accumulated[k] = vals[k];
                }
            }
            // anything leftover becomes the decimal for the last unit
            // lastUnit is defined here since units is not empty
            for (var key in accumulated) {
                var unit = key;
                var acc = accumulated[unit];
                if (acc !== undefined) {
                    built[lastUnit] =
                        built[lastUnit] +
                            (key === lastUnit
                                ? accumulated[key]
                                : // lastUnit could be 'milliseconds' but so would then be the unique key in accumulated
                                    // Cast to ConversionMatrixUnit is hence safe here
                                    acc / this.matrix[lastUnit][unit]);
                }
            }
            return this.clone(built).normalize();
        };
        /**
         * Return the negative of this Duration.
         * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
         * @return {Duration}
         */
        Duration.prototype.negate = function () {
            var negated = {};
            for (var k in this.values) {
                var unit = k;
                negated[unit] = -this.values[unit];
            }
            return this.clone(negated);
        };
        Object.defineProperty(Duration.prototype, "years", {
            /**
             * Get the years.
             * @type {number}
             */
            get: function () {
                return this.values.years || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "quarters", {
            /**
             * Get the quarters.
             * @type {number}
             */
            get: function () {
                return this.values.quarters || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "months", {
            /**
             * Get the months.
             * @type {number}
             */
            get: function () {
                return this.values.months || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "weeks", {
            /**
             * Get the weeks
             * @type {number}
             */
            get: function () {
                return this.values.weeks || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "days", {
            /**
             * Get the days.
             * @type {number}
             */
            get: function () {
                return this.values.days || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "hours", {
            /**
             * Get the hours.
             * @type {number}
             */
            get: function () {
                return this.values.hours || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "minutes", {
            /**
             * Get the minutes.
             * @type {number}
             */
            get: function () {
                return this.values.minutes || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "seconds", {
            /**
             * Get the seconds.
             * @return {number}
             */
            get: function () {
                return this.values.seconds || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Duration.prototype, "milliseconds", {
            /**
             * Get the milliseconds.
             * @return {number}
             */
            get: function () {
                return this.values.milliseconds || 0;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Equality check
         * Two Durations are equal iff they have the same units and the same values for each unit.
         * @param {Duration} other
         * @return {boolean}
         */
        Duration.prototype.equals = function (other) {
            if (!this.loc.equals(other.loc)) {
                return false;
            }
            for (var _i = 0, orderedUnits_2 = orderedUnits; _i < orderedUnits_2.length; _i++) {
                var u = orderedUnits_2[_i];
                if (this.values[u] !== other.values[u]) {
                    return false;
                }
            }
            return true;
        };
        /**
         * @private
         */
        // clone really means "create another instance just like this one, but with these changes"
        Duration.prototype.clone = function (values, clear) {
            if (clear === void 0) { clear = true; }
            // deep merge for vals
            var conf = {
                values: clear ? values : Object.assign({}, this.values, values),
                loc: this.loc,
                conversionAccuracy: this.conversionAccuracy()
            };
            return new Duration(conf);
        };
        /**
         * @private
         */
        Duration.prototype.conversionAccuracy = function () {
            return this.matrix === accurateMatrix ? "longterm" : "casual";
        };
        return Duration;
    }());
    /**
     * @private
     */
    function friendlyDuration(duration) {
        if (Duration.isDuration(duration)) {
            return duration;
        }
        if (typeof duration === "object" && duration !== null) {
            return Duration.fromObject(duration);
        }
        throw new InvalidArgumentError("Unknown duration argument " + duration + " of type " + typeof duration);
    }

    // checks if the start is equal to or before the end
    function validateStartEnd(start, end) {
        if (!DateTime.isDateTime(start)) {
            throw new InvalidArgumentError("Must pass a DateTime as the start");
        }
        else if (!DateTime.isDateTime(end)) {
            throw new InvalidArgumentError("Must pass a DateTime as the end");
        }
        else if (end < start) {
            throw new InvalidArgumentError("The end of an interval must be after its start, but you had start=" + start.toISO() + " and end=" + end.toISO());
        }
    }
    function friendlyDateTime(dateTimeish) {
        if (DateTime.isDateTime(dateTimeish)) {
            return dateTimeish;
        }
        else if (dateTimeish instanceof Date) {
            return DateTime.fromJSDate(dateTimeish);
        }
        else if (typeof dateTimeish === "object" && dateTimeish) {
            return DateTime.fromObject(dateTimeish);
        }
        throw new InvalidArgumentError("Unknown datetime argument: " + dateTimeish + ", of type " + typeof dateTimeish);
    }
    /**
     * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
     *
     * Here is a brief overview of the most commonly used methods and getters in Interval:
     *
     * * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
     * * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
     * * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
     * * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval#merge}, {@link Interval#xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
     * * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}.
     * * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
     */
    var Interval = /** @class */ (function () {
        /**
         * @private
         */
        function Interval(config) {
            validateStartEnd(config.start, config.end);
            /**
             * @access private
             */
            this.s = config.start;
            /**
             * @access private
             */
            this.e = config.end;
            /**
             * @access private
             */
            this.isLuxonInterval = true;
        }
        /**
         * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
         * @param {DateTime|Date|Object} start
         * @param {DateTime|Date|Object} end
         * @return {Interval}
         */
        Interval.fromDateTimes = function (start, end) {
            var builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
            return new Interval({
                start: builtStart,
                end: builtEnd
            });
        };
        /**
         * Create an Interval from a start DateTime and a Duration to extend to.
         * @param {DateTime|Date|Object} start
         * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
         * @return {Interval}
         */
        Interval.after = function (start, duration) {
            var dur = friendlyDuration(duration), dt = friendlyDateTime(start);
            return new Interval({
                start: dt,
                end: dt ? dt.plus(dur) : null
            });
        };
        /**
         * Create an Interval from an end DateTime and a Duration to extend backwards to.
         * @param {DateTime|Date|Object} end
         * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
         * @return {Interval}
         */
        Interval.before = function (end, duration) {
            var dur = friendlyDuration(duration), dt = friendlyDateTime(end);
            return new Interval({
                start: dt ? dt.minus(dur) : null,
                end: dt
            });
        };
        /**
         * Create an Interval from an ISO 8601 string.
         * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
         * @param {string} text - the ISO string to parse
         * @param {Object} [options] - options to pass {@link DateTime.fromISO} and optionally {@link Duration.fromISO}
         * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
         * @return {Interval}
         */
        Interval.fromISO = function (text, options) {
            if (options === void 0) { options = {}; }
            var _a = (text || "").split("/", 2), s = _a[0], e = _a[1];
            var nullOnInvalidOpts = Object.assign({}, options, { nullOnInvalid: true });
            if (s && e) {
                var start = DateTime.fromISO(s, nullOnInvalidOpts);
                var end = DateTime.fromISO(e, nullOnInvalidOpts);
                if (start !== null && end !== null) {
                    return Interval.fromDateTimes(start, end);
                }
                if (start !== null) {
                    var dur = Duration.fromISO(e, nullOnInvalidOpts);
                    if (dur !== null) {
                        return Interval.after(start, dur);
                    }
                }
                else if (end !== null) {
                    var dur = Duration.fromISO(s, nullOnInvalidOpts);
                    if (dur !== null) {
                        return Interval.before(end, dur);
                    }
                }
            }
            throw new UnparsableStringError("ISO 8601", text);
        };
        /**
         * Check if an object is an Interval. Works across context boundaries
         * @param {Object} o
         * @return {boolean}
         */
        Interval.isInterval = function (o) {
            return (o && o.isLuxonInterval) || false;
        };
        Object.defineProperty(Interval.prototype, "start", {
            /**
             * Returns the start of the Interval
             * @type {DateTime}
             */
            get: function () {
                return this.s;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Interval.prototype, "end", {
            /**
             * Returns the end of the Interval
             * @type {DateTime}
             */
            get: function () {
                return this.e;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Returns the length of the Interval in the specified unit.
         * @param {string} [unit='milliseconds'] - the unit (such as 'hours' or 'days') to return the length in.
         * @return {number}
         */
        Interval.prototype.length = function (unit) {
            if (unit === void 0) { unit = "milliseconds"; }
            return this.toDuration(unit).get(unit);
        };
        /**
         * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
         * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
         * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
         * @param {string} [unit='milliseconds'] - the unit of time to count.
         * @return {number}
         */
        Interval.prototype.count = function (unit) {
            if (unit === void 0) { unit = "milliseconds"; }
            var start = this.start.startOf(unit), end = this.end.startOf(unit);
            return Math.floor(end.diff(start, unit).get(unit)) + 1;
        };
        /**
         * Returns whether this Interval's start and end are both in the same unit of time
         * @param {string} unit - the unit of time to check sameness on
         * @return {boolean}
         */
        Interval.prototype.hasSame = function (unit) {
            return this.isEmpty() || this.e.minus({ milliseconds: 1 }).hasSame(this.s, unit);
        };
        /**
         * Return whether this Interval has the same start and end DateTimes.
         * @return {boolean}
         */
        Interval.prototype.isEmpty = function () {
            return this.s.valueOf() === this.e.valueOf();
        };
        /**
         * Return whether this Interval's start is after the specified DateTime.
         * @param {DateTime} dateTime
         * @return {boolean}
         */
        Interval.prototype.isAfter = function (dateTime) {
            return this.s > dateTime;
        };
        /**
         * Return whether this Interval's end is before the specified DateTime.
         * @param {DateTime} dateTime
         * @return {boolean}
         */
        Interval.prototype.isBefore = function (dateTime) {
            return this.e <= dateTime;
        };
        /**
         * Return whether this Interval contains the specified DateTime.
         * @param {DateTime} dateTime
         * @return {boolean}
         */
        Interval.prototype.contains = function (dateTime) {
            return this.s <= dateTime && this.e > dateTime;
        };
        /**
         * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
         * @param {Object} values - the values to set
         * @param {DateTime} values.start - the starting DateTime
         * @param {DateTime} values.end - the ending DateTime
         * @return {Interval}
         */
        Interval.prototype.set = function (_a) {
            var start = _a.start, end = _a.end;
            return Interval.fromDateTimes(start || this.s, end || this.e);
        };
        /**
         * Split this Interval at each of the specified DateTimes
         * @param {...[DateTime]} dateTimes - the unit of time to count.
         * @return {[Interval]}
         */
        Interval.prototype.splitAt = function () {
            var _this = this;
            var dateTimes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                dateTimes[_i] = arguments[_i];
            }
            var sorted = dateTimes
                .map(friendlyDateTime)
                .filter(function (d) { return _this.contains(d); })
                .sort(), results = [];
            var s = this.s, i = 0;
            while (s < this.e) {
                var added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
                results.push(Interval.fromDateTimes(s, next));
                s = next;
                i += 1;
            }
            return results;
        };
        /**
         * Split this Interval into smaller Intervals, each of the specified length.
         * Left over time is grouped into a smaller interval
         * @param {Duration|Object} duration - The length of each resulting interval, as a Duration object.
         * @return {[Interval]}
         */
        Interval.prototype.splitBy = function (duration) {
            var dur = friendlyDuration(duration);
            if (dur.as("milliseconds") === 0) {
                return [];
            }
            var s = this.s, added, next;
            var results = [];
            while (s < this.e) {
                added = s.plus(dur);
                next = +added > +this.e ? this.e : added;
                results.push(Interval.fromDateTimes(s, next));
                s = next;
            }
            return results;
        };
        /**
         * Split this Interval into the specified number of smaller intervals.
         * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
         * @return {[Interval]}
         */
        Interval.prototype.divideEqually = function (numberOfParts) {
            return this.splitBy({ milliseconds: this.length() / numberOfParts }).slice(0, numberOfParts);
        };
        /**
         * Return whether this Interval overlaps with the specified Interval
         * @param {Interval} other
         * @return {boolean}
         */
        Interval.prototype.overlaps = function (other) {
            return this.e > other.s && this.s < other.e;
        };
        /**
         * Return whether this Interval's end is adjacent to the specified Interval's start.
         * @param {Interval} other
         * @return {boolean}
         */
        Interval.prototype.abutsStart = function (other) {
            return +this.e === +other.s;
        };
        /**
         * Return whether this Interval's start is adjacent to the specified Interval's end.
         * @param {Interval} other
         * @return {boolean}
         */
        Interval.prototype.abutsEnd = function (other) {
            return +other.e === +this.s;
        };
        /**
         * Return whether this Interval engulfs the start and end of the specified Interval.
         * @param {Interval} other
         * @return {boolean}
         */
        Interval.prototype.engulfs = function (other) {
            return this.s <= other.s && this.e >= other.e;
        };
        /**
         * Return whether this Interval has the same start and end as the specified Interval.
         * @param {Interval} other
         * @return {boolean}
         */
        Interval.prototype.equals = function (other) {
            return this.s.equals(other.s) && this.e.equals(other.e);
        };
        /**
         * Return an Interval representing the intersection of this Interval and the specified Interval.
         * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
         * Returns null if the intersection is empty, meaning, the intervals don't intersect.
         * @param {Interval} other
         * @return {Interval|null}
         */
        Interval.prototype.intersection = function (other) {
            var s = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
            if (s > e) {
                return null;
            }
            else {
                return Interval.fromDateTimes(s, e);
            }
        };
        /**
         * Return an Interval representing the union of this Interval and the specified Interval.
         * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
         * @param {Interval} other
         * @return {Interval}
         */
        Interval.prototype.union = function (other) {
            var s = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
            return Interval.fromDateTimes(s, e);
        };
        /**
         * Merge an array of Intervals into a equivalent minimal set of Intervals.
         * Combines overlapping and adjacent Intervals.
         * @param {[Interval]} intervals
         * @return {[Interval]}
         */
        Interval.merge = function (intervals) {
            var _a = intervals
                .sort(function (a, b) { return a.s.valueOf() - b.s.valueOf(); })
                .reduce(function (_a, item) {
                var sofar = _a[0], current = _a[1];
                if (!current) {
                    return [sofar, item];
                }
                else if (current.overlaps(item) || current.abutsStart(item)) {
                    return [sofar, current.union(item)];
                }
                else {
                    return [sofar.concat([current]), item];
                }
            }, [[], null]), found = _a[0], final = _a[1];
            if (final) {
                found.push(final);
            }
            return found;
        };
        /**
         * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
         * @param {[Interval]} intervals
         * @return {[Interval]}
         */
        Interval.xor = function (intervals) {
            var _a;
            var start = null, currentCount = 0;
            var results = [], ends = intervals.map(function (i) { return [
                { time: i.s, type: "s" },
                { time: i.e, type: "e" }
            ]; }), flattened = (_a = Array.prototype).concat.apply(_a, ends), arr = flattened.sort(function (a, b) { return a.time.valueOf() - b.time.valueOf(); });
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var i = arr_1[_i];
                currentCount += i.type === "s" ? 1 : -1;
                if (currentCount === 1) {
                    start = i.time;
                }
                else {
                    if (start && start.valueOf() !== i.time.valueOf()) {
                        results.push(Interval.fromDateTimes(start, i.time));
                    }
                    start = null;
                }
            }
            return Interval.merge(results);
        };
        /**
         * Returns Intervals representing the span(s) of time in this Interval that don't overlap with any of the specified Intervals.
         * @param {...Interval} intervals
         * @return {[Interval]}
         */
        Interval.prototype.difference = function () {
            var _this = this;
            var intervals = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                intervals[_i] = arguments[_i];
            }
            return Interval.xor([this].concat(intervals))
                .map(function (i) { return _this.intersection(i); })
                .filter(function (i) { return i !== null && !i.isEmpty(); });
        };
        /**
         * Returns a string representation of this Interval appropriate for debugging.
         * @return {string}
         */
        Interval.prototype.toString = function () {
            return "[" + this.s.toISO() + " \u2013 " + this.e.toISO() + ")";
        };
        /**
         * Returns an ISO 8601-compliant string representation of this Interval.
         * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
         * @param {Object} options - The same options as {@link DateTime#toISO}
         * @return {string}
         */
        Interval.prototype.toISO = function (options) {
            if (options === void 0) { options = {}; }
            return this.s.toISO(options) + "/" + this.e.toISO(options);
        };
        /**
         * Returns an ISO 8601-compliant string representation of date of this Interval.
         * The time components are ignored.
         * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
         * @return {string}
         */
        Interval.prototype.toISODate = function () {
            return this.s.toISODate() + "/" + this.e.toISODate();
        };
        /**
         * Returns an ISO 8601-compliant string representation of time of this Interval.
         * The date components are ignored.
         * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
         * @param {Object} options - The same options as {@link DateTime#toISO}
         * @return {string}
         *
         */
        Interval.prototype.toISOTime = function (options) {
            if (options === void 0) { options = {}; }
            return this.s.toISOTime(options) + "/" + this.e.toISOTime(options);
        };
        /**
         * Returns a string representation of this Interval formatted according to the specified format string.
         * @param {string} dateFormat - the format string. This string formats the start and end time. See {@link DateTime.toFormat} for details.
         * @param {Object} options - options
         * @param {string} [options.separator =  ' – '] - a separator to place between the start and end representations
         * @return {string}
         */
        Interval.prototype.toFormat = function (dateFormat, options) {
            if (options === void 0) { options = { separator: " – " }; }
            return "" + this.s.toFormat(dateFormat) + options.separator + this.e.toFormat(dateFormat);
        };
        /**
         * Return a Duration representing the time spanned by this interval.
         * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
         * @param {Object} options - options that affect the creation of the Duration
         * @param {string} [options.locale=end()'s locale] - the locale to use
         * @param {string} [options.numberingSystem=end()'s numberingSystem] - the numbering system to use
         * @param {string} [options.conversionAccuracy='casual'] - the conversion system to use
         * @param {bool} [options.nullOnInvalid=false] - whether to return `null` on error instead of throwing
         * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
         * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
         * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
         * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
         * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
         * @return {Duration}
         */
        Interval.prototype.toDuration = function (unit, options) {
            if (unit === void 0) { unit = "milliseconds"; }
            if (options === void 0) { options = {}; }
            return this.e.diff(this.s, unit, options);
        };
        /**
         * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
         * @param {function} mapFn
         * @return {Interval}
         * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
         * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
         */
        Interval.prototype.mapEndpoints = function (mapFn) {
            return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
        };
        return Interval;
    }());

    /**
     * The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
     */
    var Info = /** @class */ (function () {
        function Info() {
        }
        /**
         * Return whether the specified zone contains a DST.
         * @param {string|Zone|number} [zone='default'] - Zone to check. Defaults to the system's time zone, unless overriden in Settings.defaultZone
         * @return {boolean}
         */
        Info.hasDST = function (zone) {
            var zoneObj = normalizeZone(zone, Settings.defaultZone);
            if (!zoneObj.isValid) {
                return false;
            }
            var proto = DateTime.now()
                .setZone(zoneObj)
                .set({ month: 12 });
            return !zoneObj.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
        };
        /**
         * Return whether the specified zone is a valid IANA specifier.
         * @param {string} zone - Zone to check
         * @return {boolean}
         */
        Info.isValidIANAZone = function (zone) {
            return IANAZone.isValidSpecifier(zone) && IANAZone.isValidZone(zone);
        };
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
         *   instance with {@link Zone.isValid} == false is returned.
         * * If `input is a number, a Zone instance with the specified fixed offset
         *   in minutes is returned.
         * * If `input` is `null` or `undefined`, the default zone is returned.
         * @param {string|Zone|number} [input] - the value to be converted
         * @return {Zone}
         */
        Info.normalizeZone = function (input) {
            return normalizeZone(input, Settings.defaultZone);
        };
        /**
         * Return an array of standalone month names.
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
         * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @param {string} [options.numberingSystem] - the numbering system
         * @param {string} [options.outputCalendar='gregory'] - the calendar
         * @example Info.months()[0] //=> 'January'
         * @example Info.months('short')[0] //=> 'Jan'
         * @example Info.months('numeric')[0] //=> '1'
         * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
         * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
         * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
         * @return {[string]}
         */
        Info.months = function (length, _a) {
            if (length === void 0) { length = "long"; }
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem, _c = _b.outputCalendar, outputCalendar = _c === void 0 ? "gregory" : _c;
            return Locale.create(locale, numberingSystem, outputCalendar).months(length);
        };
        /**
         * Return an array of format month names.
         * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
         * changes the string.
         * See {@link Info#months}
         * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @param {string} [options.numberingSystem] - the numbering system
         * @param {string} [options.outputCalendar='gregory'] - the calendar
         * @return {[string]}
         */
        Info.monthsFormat = function (length, _a) {
            if (length === void 0) { length = "long"; }
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem, _c = _b.outputCalendar, outputCalendar = _c === void 0 ? "gregory" : _c;
            return Locale.create(locale, numberingSystem, outputCalendar).months(length, true);
        };
        /**
         * Return an array of standalone week names.
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
         * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @param {string} [options.numberingSystem] - the numbering system
         * @example Info.weekdays()[0] //=> 'Monday'
         * @example Info.weekdays('short')[0] //=> 'Mon'
         * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
         * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
         * @return {[string]}
         */
        Info.weekdays = function (length, _a) {
            if (length === void 0) { length = "long"; }
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem;
            return Locale.create(locale, numberingSystem).weekdays(length);
        };
        /**
         * Return an array of format week names.
         * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
         * changes the string.
         * See {@link Info#weekdays}
         * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @param {string} [options.numberingSystem] - the numbering system
         * @return {[string]}
         */
        Info.weekdaysFormat = function (length, _a) {
            if (length === void 0) { length = "long"; }
            var _b = _a === void 0 ? {} : _a, locale = _b.locale, numberingSystem = _b.numberingSystem;
            return Locale.create(locale, numberingSystem).weekdays(length, true);
        };
        /**
         * Return an array of meridiems.
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @example Info.meridiems() //=> [ 'AM', 'PM' ]
         * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
         * @return {[string]}
         */
        Info.meridiems = function (_a) {
            var locale = (_a === void 0 ? {} : _a).locale;
            return Locale.create(locale).meridiems();
        };
        /**
         * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
         * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
         * @param {Object} options - options
         * @param {string} [options.locale] - the locale code
         * @example Info.eras() //=> [ 'BC', 'AD' ]
         * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
         * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
         * @return {[string]}
         */
        Info.eras = function (length, _a) {
            if (length === void 0) { length = "short"; }
            var locale = (_a === void 0 ? {} : _a).locale;
            return Locale.create(locale, undefined, "gregory").eras(length);
        };
        /**
         * Return the set of available features in this environment.
         * Some features of Luxon are not available in all environments. For example, on older browsers, timezone support is not available. Use this function to figure out if that's the case.
         * Keys:
         * * `zones`: whether this environment supports IANA timezones
         * * `intlTokens`: whether this environment supports internationalized token-based formatting/parsing
         * * `intl`: whether this environment supports general internationalization
         * * `relative`: whether this environment supports relative time formatting
         * @example Info.features() //=> { intl: true, intlTokens: false, zones: true, relative: false }
         * @return {Object}
         */
        Info.features = function () {
            var intl = false, intlTokens = false, zones = false, relative = false;
            if (hasIntl()) {
                intl = true;
                intlTokens = hasFormatToParts();
                relative = hasRelative();
                try {
                    zones =
                        new Intl.DateTimeFormat("en", { timeZone: "America/New_York" }).resolvedOptions()
                            .timeZone === "America/New_York";
                }
                catch (e) {
                    zones = false;
                }
            }
            return { intl: intl, intlTokens: intlTokens, zones: zones, relative: relative };
        };
        return Info;
    }());

    function dayDiff(earlier, later) {
        var utcDayStart = function (dt) {
            return dt
                .toUTC(0, { keepLocalTime: true })
                .startOf("days")
                .valueOf();
        }, ms = utcDayStart(later) - utcDayStart(earlier);
        return Math.floor(Duration.fromMillis(ms).as("days"));
    }
    function highOrderDiffs(earlier, later, units) {
        var _a, _b;
        var differs = [
            ["years", function (a, b) { return b.year - a.year; }],
            ["months", function (a, b) { return b.month - a.month + (b.year - a.year) * 12; }],
            [
                "weeks",
                function (a, b) {
                    var days = dayDiff(a, b);
                    return (days - (days % 7)) / 7;
                }
            ],
            ["days", dayDiff]
        ];
        var results = {};
        var lowestOrder, highWater = earlier, cursor = earlier.reconfigure({});
        for (var _i = 0, differs_1 = differs; _i < differs_1.length; _i++) {
            var _c = differs_1[_i], unit = _c[0], differ = _c[1];
            if (units.indexOf(unit) >= 0) {
                lowestOrder = unit;
                var delta = differ(cursor, later);
                highWater = cursor.plus((_a = {}, _a[unit] = delta, _a));
                if (highWater > later) {
                    cursor = cursor.plus((_b = {}, _b[unit] = delta - 1, _b));
                    delta -= 1;
                }
                else {
                    cursor = highWater;
                }
                results[unit] = delta;
            }
        }
        return [cursor, results, highWater, lowestOrder];
    }
    var diff = function (earlier, later, units, options) {
        var _a, _b;
        // eslint-disable-next-line prefer-const
        var _c = highOrderDiffs(earlier, later, units), cursor = _c[0], results = _c[1], highWater = _c[2], lowestOrder = _c[3];
        var remainingMillis = later.valueOf() - cursor.valueOf();
        var lowerOrderUnits = units.filter(function (u) { return ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0; });
        if (lowerOrderUnits.length === 0) {
            // if there are no low order units, there is at least one high order unit
            // and lowestOrder is hence defined
            if (highWater < later) {
                highWater = cursor.plus((_a = {}, _a[lowestOrder] = 1, _a));
            }
            if (highWater !== cursor) {
                results[lowestOrder] =
                    results[lowestOrder] +
                        remainingMillis / (highWater.valueOf() - cursor.valueOf());
            }
        }
        var duration = Duration.fromObject(results, options);
        if (lowerOrderUnits.length > 0) {
            return (_b = Duration.fromMillis(remainingMillis, options)).shiftTo.apply(_b, lowerOrderUnits).plus(duration);
        }
        else {
            return duration;
        }
    };

    var numberingSystems = {
        arab: "[\u0660-\u0669]",
        arabext: "[\u06F0-\u06F9]",
        bali: "[\u1B50-\u1B59]",
        beng: "[\u09E6-\u09EF]",
        deva: "[\u0966-\u096F]",
        fullwide: "[\uFF10-\uFF19]",
        gujr: "[\u0AE6-\u0AEF]",
        hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
        khmr: "[\u17E0-\u17E9]",
        knda: "[\u0CE6-\u0CEF]",
        laoo: "[\u0ED0-\u0ED9]",
        limb: "[\u1946-\u194F]",
        mlym: "[\u0D66-\u0D6F]",
        mong: "[\u1810-\u1819]",
        mymr: "[\u1040-\u1049]",
        orya: "[\u0B66-\u0B6F]",
        tamldec: "[\u0BE6-\u0BEF]",
        telu: "[\u0C66-\u0C6F]",
        thai: "[\u0E50-\u0E59]",
        tibt: "[\u0F20-\u0F29]",
        latn: "\\d"
    };
    var numberingSystemsUTF16 = {
        arab: [1632, 1641],
        arabext: [1776, 1785],
        bali: [6992, 7001],
        beng: [2534, 2543],
        deva: [2406, 2415],
        fullwide: [65296, 65303],
        gujr: [2790, 2799],
        khmr: [6112, 6121],
        knda: [3302, 3311],
        laoo: [3792, 3801],
        limb: [6470, 6479],
        mlym: [3430, 3439],
        mong: [6160, 6169],
        mymr: [4160, 4169],
        orya: [2918, 2927],
        tamldec: [3046, 3055],
        telu: [3174, 3183],
        thai: [3664, 3673],
        tibt: [3872, 3881],
        latn: [48, 57],
        hanidec: [-1, -1] // see special case for hanidec characters below
    };
    // eslint-disable-next-line no-useless-escape
    var hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
    function parseDigits(str) {
        var intValue = parseInt(str, 10);
        if (!isNaN(intValue))
            return intValue;
        var digits = "";
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (str[i].search(numberingSystems.hanidec) !== -1) {
                digits += hanidecChars.indexOf(str[i]);
            }
            else {
                for (var key in numberingSystemsUTF16) {
                    var _a = numberingSystemsUTF16[key], min = _a[0], max = _a[1];
                    if (code >= min && code <= max) {
                        digits += code - min;
                        break;
                    }
                }
            }
        }
        return parseInt(digits, 10);
    }
    function digitRegex(locale, append) {
        if (append === void 0) { append = ""; }
        return new RegExp("" + numberingSystems[locale.numberingSystem || "latn"] + append);
    }

    var MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
    function intUnit(regex, post) {
        if (post === void 0) { post = function (i) { return i; }; }
        return { regex: regex, deser: function (_a) {
                var s = _a[0];
                return post(parseDigits(s));
            } };
    }
    var NBSP = String.fromCharCode(160);
    var spaceOrNBSP = "( |" + NBSP + ")";
    var spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
    function fixListRegex(s) {
        // make dots optional and also make them literal
        // make space and non breakable space characters interchangeable
        return s.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
    }
    function stripInsensitivities(s) {
        return s
            .replace(/\./g, "") // ignore dots that were made optional
            .replace(spaceOrNBSPRegExp, " ") // interchange space and nbsp
            .toLowerCase();
    }
    function oneOf(strings, startIndex) {
        return {
            regex: RegExp(strings.map(fixListRegex).join("|")),
            deser: function (_a) {
                var s = _a[0];
                return strings.findIndex(function (i) { return stripInsensitivities(s) === stripInsensitivities(i); }) + startIndex;
            }
        };
    }
    function offset(regex, groups) {
        return { regex: regex, deser: function (_a) {
                var h = _a[1], m = _a[2];
                return signedOffset(h, m);
            }, groups: groups };
    }
    function simple(regex) {
        return { regex: regex, deser: function (_a) {
                var s = _a[0];
                return s;
            } };
    }
    function escapeToken(value) {
        // eslint-disable-next-line no-useless-escape
        return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }
    function unitForToken(token, loc) {
        var one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = function (t) { return ({
            regex: RegExp(escapeToken(t.val)),
            deser: function (_a) {
                var s = _a[0];
                return s;
            },
            literal: true
        }); }, unitate = function (t) {
            if (token.literal) {
                return literal(t);
            }
            switch (t.val) {
                // era
                case "G":
                    return oneOf(loc.eras("short", false), 0);
                case "GG":
                    return oneOf(loc.eras("long", false), 0);
                // years
                case "y":
                    return intUnit(oneToSix);
                case "yy":
                    return intUnit(twoToFour, untruncateYear);
                case "yyyy":
                    return intUnit(four);
                case "yyyyy":
                    return intUnit(fourToSix);
                case "yyyyyy":
                    return intUnit(six);
                // months
                case "M":
                    return intUnit(oneOrTwo);
                case "MM":
                    return intUnit(two);
                case "MMM":
                    return oneOf(loc.months("short", true, false), 1);
                case "MMMM":
                    return oneOf(loc.months("long", true, false), 1);
                case "L":
                    return intUnit(oneOrTwo);
                case "LL":
                    return intUnit(two);
                case "LLL":
                    return oneOf(loc.months("short", false, false), 1);
                case "LLLL":
                    return oneOf(loc.months("long", false, false), 1);
                // dates
                case "d":
                    return intUnit(oneOrTwo);
                case "dd":
                    return intUnit(two);
                // ordinals
                case "o":
                    return intUnit(oneToThree);
                case "ooo":
                    return intUnit(three);
                // time
                case "HH":
                    return intUnit(two);
                case "H":
                    return intUnit(oneOrTwo);
                case "hh":
                    return intUnit(two);
                case "h":
                    return intUnit(oneOrTwo);
                case "mm":
                    return intUnit(two);
                case "m":
                    return intUnit(oneOrTwo);
                case "q":
                    return intUnit(oneOrTwo);
                case "qq":
                    return intUnit(two);
                case "s":
                    return intUnit(oneOrTwo);
                case "ss":
                    return intUnit(two);
                case "S":
                    return intUnit(oneToThree);
                case "SSS":
                    return intUnit(three);
                case "u":
                    return simple(oneToNine);
                // meridiem
                case "a":
                    return oneOf(loc.meridiems(), 0);
                // weekYear (k)
                case "kkkk":
                    return intUnit(four);
                case "kk":
                    return intUnit(twoToFour, untruncateYear);
                // weekNumber (W)
                case "W":
                    return intUnit(oneOrTwo);
                case "WW":
                    return intUnit(two);
                // weekdays
                case "E":
                case "c":
                    return intUnit(one);
                case "EEE":
                    return oneOf(loc.weekdays("short", false, false), 1);
                case "EEEE":
                    return oneOf(loc.weekdays("long", false, false), 1);
                case "ccc":
                    return oneOf(loc.weekdays("short", true, false), 1);
                case "cccc":
                    return oneOf(loc.weekdays("long", true, false), 1);
                // offset/zone
                case "Z":
                case "ZZ":
                    return offset(new RegExp("([+-]" + oneOrTwo.source + ")(?::(" + two.source + "))?"), 2);
                case "ZZZ":
                    return offset(new RegExp("([+-]" + oneOrTwo.source + ")(" + two.source + ")?"), 2);
                // we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
                // because we don't have any way to figure out what they are
                case "z":
                    return simple(/[a-z_+-/]{1,256}?/i);
                default:
                    return literal(t);
            }
        };
        var unit = unitate(token);
        if (unit === null) {
            return {
                invalidReason: MISSING_FTP
            };
        }
        return __assign(__assign({}, unit), { token: token });
    }
    var partTypeStyleToTokenVal = {
        literal: undefined,
        dayPeriod: undefined,
        era: undefined,
        timeZoneName: undefined,
        year: {
            "2-digit": "yy",
            numeric: "yyyyy"
        },
        month: {
            numeric: "M",
            "2-digit": "MM",
            short: "MMM",
            long: "MMMM"
        },
        day: {
            numeric: "d",
            "2-digit": "dd"
        },
        weekday: {
            short: "EEE",
            long: "EEEE"
        },
        hour: {
            numeric: "h",
            "2-digit": "hh"
        },
        minute: {
            numeric: "m",
            "2-digit": "mm"
        },
        second: {
            numeric: "s",
            "2-digit": "ss"
        }
    };
    function tokenForPart(part, formatOptions) {
        var type = part.type, value = part.value;
        if (type === "literal") {
            return {
                literal: true,
                val: value
            };
        }
        if (type === "dayPeriod") {
            return {
                literal: false,
                val: "a"
            };
        }
        var tokenVals = partTypeStyleToTokenVal[type];
        if (tokenVals !== undefined) {
            var style = formatOptions[type];
            if (style) {
                var val = tokenVals[style];
                if (val !== undefined) {
                    return {
                        literal: false,
                        val: val
                    };
                }
            }
        }
        return undefined;
    }
    function buildRegex(units) {
        var re = units.map(function (u) { return u.regex; }).reduce(function (f, r) { return f + "(" + r.source + ")"; }, "");
        return "^" + re + "$";
    }
    function match(input, regex, handlers) {
        var matches = regex.exec(input);
        var all = {};
        if (matches !== null) {
            var matchIndex_1 = 1;
            handlers.forEach(function (h) {
                var groups = h.groups ? h.groups + 1 : 1;
                if (!h.literal) {
                    all[h.token.val[0]] = h.deser(matches.slice(matchIndex_1, matchIndex_1 + groups));
                }
                matchIndex_1 += groups;
            });
        }
        return [matches, all];
    }
    function dateTimeFromMatches(matches) {
        var toField = function (token) {
            switch (token) {
                case "S":
                    return "millisecond";
                case "s":
                    return "second";
                case "m":
                    return "minute";
                case "h":
                case "H":
                    return "hour";
                case "d":
                    return "day";
                case "o":
                    return "ordinal";
                case "L":
                case "M":
                    return "month";
                case "y":
                    return "year";
                case "E":
                case "c":
                    return "weekday";
                case "W":
                    return "weekNumber";
                case "k":
                    return "weekYear";
                default:
                    return null;
            }
        };
        var zone;
        if (!isUndefined(matches.Z)) {
            zone = new FixedOffsetZone(matches.Z);
        }
        else if (!isUndefined(matches.z)) {
            zone = IANAZone.create(matches.z);
        }
        else {
            zone = null;
        }
        if (!isUndefined(matches.q)) {
            matches.M = (matches.q - 1) * 3 + 1;
        }
        if (!isUndefined(matches.h)) {
            if (matches.h < 12 && matches.a === 1) {
                matches.h = matches.h + 12;
            }
            else if (matches.h === 12 && matches.a === 0) {
                matches.h = 0;
            }
        }
        if (matches.G === 0 && matches.y) {
            matches.y = -matches.y;
        }
        if (!isUndefined(matches.u)) {
            matches.S = parseMillis(matches.u) || 0;
        }
        var vals = Object.keys(matches).reduce(function (r, k) {
            var f = toField(k);
            if (f) {
                r[f] = matches[k];
            }
            return r;
        }, {});
        return [vals, zone];
    }
    var dummyDateTimeCache;
    function getDummyDateTime() {
        if (dummyDateTimeCache === undefined) {
            dummyDateTimeCache = DateTime.fromMillis(1555555555555);
        }
        return dummyDateTimeCache;
    }
    function maybeExpandMacroToken(token, locale) {
        if (token.literal) {
            return token;
        }
        var formatOpts = Formatter.macroTokenToFormatOpts(token.val);
        if (!formatOpts) {
            return token;
        }
        var formatter = Formatter.create(locale, formatOpts);
        var parts = formatter.formatDateTimeParts(getDummyDateTime());
        var tokens = parts.map(function (p) { return tokenForPart(p, formatOpts); });
        if (tokens.indexOf(undefined) >= 0) {
            return token;
        }
        return tokens;
    }
    function expandMacroTokens(tokens, locale) {
        var _a;
        return (_a = Array.prototype).concat.apply(_a, tokens.map(function (t) { return maybeExpandMacroToken(t, locale); }));
    }
    function isInvalidUnitParser(parser) {
        return !!parser && !!parser.invalidReason;
    }
    /**
     * @private
     */
    function explainFromTokens(locale, input, format) {
        var tokens = expandMacroTokens(Formatter.parseFormat(format), locale), units = tokens.map(function (t) { return unitForToken(t, locale); }), disqualifyingUnit = units.find(isInvalidUnitParser);
        if (disqualifyingUnit) {
            return { input: input, tokens: tokens, invalidReason: disqualifyingUnit.invalidReason };
        }
        else {
            var regexString = buildRegex(units), regex = RegExp(regexString, "i"), _a = match(input, regex, units), rawMatches = _a[0], matches = _a[1], _b = matches ? dateTimeFromMatches(matches) : [null, null], result = _b[0], zone = _b[1];
            if ("a" in matches && "H" in matches) {
                throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");
            }
            return { input: input, tokens: tokens, regex: regex, rawMatches: rawMatches, matches: matches, result: result, zone: zone };
        }
    }
    function parseFromTokens(locale, input, format) {
        var _a = explainFromTokens(locale, input, format), result = _a.result, zone = _a.zone, invalidReason = _a.invalidReason;
        return [result, zone, invalidReason];
    }

    var nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
    function dayOfWeek(year, month, day) {
        var js = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        return js === 0 ? 7 : js;
    }
    function computeOrdinal(year, month, day) {
        return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
    }
    function uncomputeOrdinal(year, ordinal) {
        var table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex(function (i) { return i < ordinal; }), day = ordinal - table[month0];
        return { month: month0 + 1, day: day };
    }
    /**
     * @private
     */
    function gregorianToWeek(gregObj) {
        var year = gregObj.year, month = gregObj.month, day = gregObj.day, ordinal = computeOrdinal(year, month, day), weekday = dayOfWeek(year, month, day);
        var weekNumber = Math.floor((ordinal - weekday + 10) / 7), weekYear;
        if (weekNumber < 1) {
            weekYear = year - 1;
            weekNumber = weeksInWeekYear(weekYear);
        }
        else if (weekNumber > weeksInWeekYear(year)) {
            weekYear = year + 1;
            weekNumber = 1;
        }
        else {
            weekYear = year;
        }
        return Object.assign({ weekYear: weekYear, weekNumber: weekNumber, weekday: weekday }, timeObject(gregObj));
    }
    function weekToGregorian(weekData) {
        var weekYear = weekData.weekYear, weekNumber = weekData.weekNumber, weekday = weekData.weekday, weekdayOfJan4 = dayOfWeek(weekYear, 1, 4), yearInDays = daysInYear(weekYear);
        var ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 3, year;
        if (ordinal < 1) {
            year = weekYear - 1;
            ordinal += daysInYear(year);
        }
        else if (ordinal > yearInDays) {
            year = weekYear + 1;
            ordinal -= daysInYear(weekYear);
        }
        else {
            year = weekYear;
        }
        var _a = uncomputeOrdinal(year, ordinal), month = _a.month, day = _a.day;
        return Object.assign({ year: year, month: month, day: day }, timeObject(weekData));
    }
    function gregorianToOrdinal(gregData) {
        var year = gregData.year, month = gregData.month, day = gregData.day, ordinal = computeOrdinal(year, month, day);
        return Object.assign({ year: year, ordinal: ordinal }, timeObject(gregData));
    }
    function ordinalToGregorian(ordinalData) {
        var year = ordinalData.year, ordinal = ordinalData.ordinal, _a = uncomputeOrdinal(year, ordinal), month = _a.month, day = _a.day;
        return Object.assign({ year: year, month: month, day: day }, timeObject(ordinalData));
    }
    function hasInvalidWeekData(obj) {
        var validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear)), validWeekday = integerBetween(obj.weekday, 1, 7);
        if (!validYear) {
            return ["weekYear", obj.weekYear];
        }
        else if (!validWeek) {
            return ["weekNumber", obj.weekNumber];
        }
        else if (!validWeekday) {
            return ["weekday", obj.weekday];
        }
        else
            return null;
    }
    function hasInvalidOrdinalData(obj) {
        var validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
        if (!validYear) {
            return ["year", obj.year];
        }
        else if (!validOrdinal) {
            return ["ordinal", obj.ordinal];
        }
        else
            return null;
    }
    function hasInvalidGregorianData(obj) {
        var validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
        if (!validYear) {
            return ["year", obj.year];
        }
        else if (!validMonth) {
            return ["month", obj.month];
        }
        else if (!validDay) {
            return ["day", obj.day];
        }
        else
            return null;
    }
    function hasInvalidTimeData(obj) {
        var hour = obj.hour, minute = obj.minute, second = obj.second, millisecond = obj.millisecond;
        var validHour = integerBetween(hour, 0, 23) ||
            (hour === 24 && minute === 0 && second === 0 && millisecond === 0), validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
        if (!validHour) {
            return ["hour", obj.hour];
        }
        else if (!validMinute) {
            return ["minute", obj.minute];
        }
        else if (!validSecond) {
            return ["second", obj.second];
        }
        else if (!validMillisecond) {
            return ["millisecond", obj.millisecond];
        }
        else
            return null;
    }

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
            if (inst !== null) {
                return setZone ? inst : inst.setZone(zone);
            }
        }
        if (options.nullOnInvalid) {
            return null;
        }
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
    var orderedUnits$1 = [
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
        if (!normalized) {
            throw new InvalidUnitError(unit);
        }
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
            if (Number.isNaN(c.year)) {
                throw new InvalidArgumentError("invalid timestamp");
            }
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
                if (options.nullOnInvalid) {
                    return null;
                }
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
                if (options.nullOnInvalid) {
                    return null;
                }
                throw new InvalidArgumentError("fromMillis requires a numerical input, but received a " + typeof milliseconds + " with value " + milliseconds);
            }
            if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
                // this isn't perfect because because we can still end up out of range because of additional shifting, but it's a start
                if (options.nullOnInvalid) {
                    return null;
                }
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
                if (options.nullOnInvalid) {
                    return null;
                }
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
                if (options.nullOnInvalid) {
                    return null;
                }
                throw error;
            }
            var containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber, loc = Locale.fromObject(options);
            // cases:
            // just a weekday -> this week's instance of that weekday, no worries
            // (gregorian data or ordinal) + (weekYear or weekNumber) -> error
            // (gregorian month or day) + ordinal -> error
            // otherwise just use weeks or ordinals or gregorian, depending on what's specified
            if ((containsGregor || containsOrdinal) && definiteWeekDef) {
                if (options.nullOnInvalid) {
                    return null;
                }
                throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
            }
            if (containsGregorMD && containsOrdinal) {
                if (options.nullOnInvalid) {
                    return null;
                }
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
                DateTime.normalizeWithDefaults(gregorianNow, normalized, orderedUnits$1, defaultUnitValues);
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
                if (options.nullOnInvalid) {
                    return null;
                }
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
                if (options.nullOnInvalid) {
                    return null;
                }
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
                if (options.nullOnInvalid) {
                    return null;
                }
                throw new InvalidArgumentError("fromFormat requires an input string and a format");
            }
            var localeToUse = Locale.create(options.locale, options.numberingSystem, options.outputCalendar, true /* defaultToEN */), _a = parseFromTokens(localeToUse, text, format), vals = _a[0], parsedZone = _a[1], invalid = _a[2];
            if (invalid) {
                if (options.nullOnInvalid) {
                    return null;
                }
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
            if (options === void 0) { options = DATE_SHORT; }
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
                if (units.length === 0) {
                    throw new InvalidArgumentError("At least one unit must be specified");
                }
            }
            catch (error) {
                if (options.nullOnInvalid) {
                    return null;
                }
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
                var otherZoneDateTime = this.setZone(other.zone, { keepLocalTime: true });
                return +otherZoneDateTime.startOf(unit) <= inputMs && inputMs <= +otherZoneDateTime.endOf(unit);
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
            if (dateTimes.length === 0) {
                return undefined;
            }
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
            if (dateTimes.length === 0) {
                return undefined;
            }
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
                return DATE_SHORT;
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
                return DATE_MED;
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
                return DATE_MED_WITH_WEEKDAY;
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
                return DATE_FULL;
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
                return DATE_HUGE;
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
                return TIME_SIMPLE;
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
                return TIME_WITH_SECONDS;
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
                return TIME_WITH_SHORT_OFFSET;
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
                return TIME_WITH_LONG_OFFSET;
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
                return TIME_24_SIMPLE;
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
                return TIME_24_WITH_SECONDS;
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
                return TIME_24_WITH_SHORT_OFFSET;
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
                return TIME_24_WITH_LONG_OFFSET;
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
                return DATETIME_SHORT;
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
                return DATETIME_SHORT_WITH_SECONDS;
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
                return DATETIME_MED;
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
                return DATETIME_MED_WITH_SECONDS;
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
                return DATETIME_MED_WITH_WEEKDAY;
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
                return DATETIME_FULL;
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
                return DATETIME_FULL_WITH_SECONDS;
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
                return DATETIME_HUGE;
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
                return DATETIME_HUGE_WITH_SECONDS;
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
                for (var _i = 0, orderedUnits_1 = orderedUnits$1; _i < orderedUnits_1.length; _i++) {
                    var u = orderedUnits_1[_i];
                    if (isUndefined(obj[u])) {
                        obj[u] = defaultUnitValues[u];
                    }
                }
                var invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
                if (invalid) {
                    if (options.nullOnInvalid) {
                        return null;
                    }
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
                if (options.style) {
                    rtfOptions.style = options.style;
                }
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
                    else {
                        return 0;
                    }
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

    exports.DateTime = DateTime;
    exports.Duration = Duration;
    exports.FixedOffsetZone = FixedOffsetZone;
    exports.IANAZone = IANAZone;
    exports.Info = Info;
    exports.Interval = Interval;
    exports.Settings = Settings;
    exports.SystemZone = SystemZone;
    exports.Zone = Zone;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ts-luxon.umd.js.map
