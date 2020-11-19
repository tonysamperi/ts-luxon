import { untruncateYear, signedOffset, parseInteger, parseMillis, ianaRegex, isUndefined } from "./util";
import * as English from "./english";
import FixedOffsetZone from "../zones/fixedOffsetZone";
import IANAZone from "../zones/IANAZone";
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
    if (weekdayStr)
        weekday =
            weekdayStr.length > 3
                ? English.weekdaysLong.indexOf(weekdayStr) + 1
                : English.weekdaysShort.indexOf(weekdayStr) + 1;
    var year = yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr);
    return {
        year: year,
        month: English.monthsShort.indexOf(monthStr) + 1,
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
export function parseISODate(s) {
    return parse(s, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDataAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
}
export function parseRFC2822Date(s) {
    return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
}
export function parseHTTPDate(s) {
    return parse(s, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}
export function parseISODuration(s) {
    var m = isoDuration.exec(s);
    if (m !== null)
        return extractISODuration(m);
    return undefined;
}
var sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
var sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
var extractISOYmdTimeOffsetAndIANAZone = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
var extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
export function parseSQL(s) {
    return parse(s, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeOffsetAndIANAZone], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
}
//# sourceMappingURL=regexParser.js.map