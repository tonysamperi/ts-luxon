import {
    untruncateYear,
    signedOffset,
    parseInteger,
    parseMillis,
    isUndefined,
    parseFloating
} from "./util.js";
import * as English from "./english.js";
import { FixedOffsetZone } from "../zones/fixedOffsetZone.js";
import { IANAZone } from "../zones/IANAZone.js";
import { Zone } from "../zone.js";
import { GenericDateTime } from "../types/datetime.js";

/*
 * This file handles parsing for well-specified formats. Here's how it works:
 * Two things go into parsing: a regex to match with and an extractor to take apart the groups in the match.
 * An extractor is just a function that takes a regex match array and returns a { year: ..., month: ... } object
 * parse() does the work of executing the regex and applying the extractor. It takes multiple regex/extractor pairs to try in sequence.
 * Extractors can take a "cursor" representing the offset in the match to look at. This makes it easy to combine extractors.
 * combineExtractors() does the work of combining them, keeping track of the cursor through multiple extractions.
 * Some extractions are super dumb and simpleParse and fromStrings help DRY them.
 */

type ParseResult = [GenericDateTime | null, Zone | null];
type Extractor = (match: RegExpExecArray) => ParseResult;
type CombinableParseResult = [GenericDateTime | null, Zone | null, number];
type CombinableExtractor = (match: RegExpExecArray, cursor: number) => CombinableParseResult;
type ParsePattern = [RegExp, Extractor];

function combineRegexes(...regexes: RegExp[]) {
    const full = regexes.reduce((f, r) => f + r.source, "");
    return RegExp(`^${full}$`);
}

function combineExtractors(...extractors: CombinableExtractor[]) {

    return (m: RegExpExecArray) =>
        extractors
            .reduce<CombinableParseResult>(
                ([mergedVals, mergedZone, cursor], ex) => {
                    const [val, zone, next] = ex(m, cursor);
                    return [{ ...mergedVals, ...val }, zone || mergedZone, next];
                },
                [{}, null, 1]
            )
            .slice(0, 2) as ParseResult;
}

function parse(s: string, ...patterns: (ParsePattern)[]): ParseResult {
    if (s === undefined || s === null) {
        return [null, null];
    }

    for (const [regex, extractor] of patterns) {
        const m = regex.exec(s);
        if (!!m) {
            return extractor(m);
        }
    }

    return [null, null];
}

function simpleParse(...keys: (keyof GenericDateTime)[]) {
    return (match: RegExpExecArray, cursor: number): CombinableParseResult => {
        const ret: Record<string, number | undefined> = {};
        let i;

        for (i = 0; i < keys.length; i++) {
            ret[keys[i]] = parseInteger(match[cursor + i]);
        }
        return [ret, null, cursor + i];
    };
}

// ISO and SQL parsing
export const IANA_REGEX = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${IANA_REGEX.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekday");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/; // dumbed-down version of the ISO one
const sqlTimeRegex = RegExp(
    `${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${IANA_REGEX.source}))?`
);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);

function int(match: RegExpExecArray, pos: number, fallback: number) {

    return isUndefined(match[pos]) ? fallback : parseInteger(match[pos]);
}

function extractISOYmd(match: RegExpExecArray, cursor: number): CombinableParseResult {
    const item = {
        year: int(match, cursor, 0), // 0 default value never used?
        month: int(match, cursor + 1, 1),
        day: int(match, cursor + 2, 1)
    };

    return [item, null, cursor + 3];
}

function extractISOTime(match: RegExpExecArray, cursor: number): CombinableParseResult {
    const item = {
        hour: int(match, cursor, 0),
        minute: int(match, cursor + 1, 0),
        second: int(match, cursor + 2, 0),
        millisecond: parseMillis(match[cursor + 3])
    };

    return [item, null, cursor + 4];
}

function extractISOOffset(match: RegExpExecArray, cursor: number): CombinableParseResult {
    const local = !match[cursor] && !match[cursor + 1],
        fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]),
        zone = local ? null : FixedOffsetZone.instance(fullOffset);
    return [{}, zone, cursor + 3];
}

function extractIANAZone(match: RegExpExecArray, cursor: number): CombinableParseResult {
    const zone = match[cursor] ? IANAZone.create(match[cursor]) : null;
    return [{}, zone, cursor + 1];
}

// ISO time parsing

const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);

// ISO duration parsing

const isoDuration =
    /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;

function extractISODuration(match: RegExpExecArray): any {
    const [s, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] =
        match;

    const hasNegativePrefix: boolean = s.startsWith("-");
    const negativeSeconds: boolean = !!secondStr && secondStr.startsWith("-");

    const maybeNegate = (num: number | void, force: boolean = !1) =>
        typeof num === typeof 0 && (force || (num && hasNegativePrefix)) ? -num : num;

    return [{
        years: maybeNegate(parseFloating(yearStr)),
        months: maybeNegate(parseFloating(monthStr)),
        weeks: maybeNegate(parseFloating(weekStr)),
        days: maybeNegate(parseFloating(dayStr)),
        hours: maybeNegate(parseFloating(hourStr)),
        minutes: maybeNegate(parseFloating(minuteStr)),
        seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
        milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
    }];
}

// These are a little brain-dead. EDT *should* tell us that we're in, say, America/New_York
// and not just that we're in -240 *right now*. But since I don't think these are used that often
// I'm just going to ignore that
const obsOffsets: Record<string, number> = {
    /* eslint-disable @typescript-eslint/naming-convention */
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
    /* eslint-enable @typescript-eslint/naming-convention */
};

function fromStrings(weekdayStr: string, yearStr: string, monthStr: string, dayStr: string, hourStr: string, minuteStr: string, secondStr: string) {
    let weekday;
    if (weekdayStr) {
        weekday = weekdayStr.length > 3
            ? English.weekdaysLong.indexOf(weekdayStr) + 1
            : English.weekdaysShort.indexOf(weekdayStr) + 1;
    }

    const year = yearStr.length === 2 ? untruncateYear(parseInteger(yearStr) as number) : parseInteger(yearStr);

    return {
        year,
        month: English.monthsShort.indexOf(monthStr) + 1,
        day: parseInteger(dayStr),
        hour: parseInteger(hourStr),
        minute: parseInteger(minuteStr),
        second: parseInteger(secondStr),
        weekday
    };
}

// RFC 2822/5322
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;

function extractRFC2822(match: RegExpExecArray): ParseResult {
    const [
            ,
            weekdayStr,
            dayStr,
            monthStr,
            yearStr,
            hourStr,
            minuteStr,
            secondStr,
            obsOffset,
            milOffset,
            offHourStr,
            offMinuteStr
        ] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

    let offset;
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

function preprocessRFC2822(s: string) {
    // Remove comments and folding whitespace and replace multiple-spaces with a single space
    return s
        .replace(/\([^()]*\)|[\n\t]/g, " ")
        .replace(/(\s\s+)/g, " ")
        .trim();
}

// http date

const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
    rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
    ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;

function extractRFC1123Or850(match: RegExpExecArray): ParseResult {
    const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
    return [result, FixedOffsetZone.utcInstance];
}

function extractASCII(match: RegExpExecArray): ParseResult {
    const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match,
        result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
    return [result, FixedOffsetZone.utcInstance];
}

const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);

const extractISOYmdTimeAndOffset = combineExtractors(
    extractISOYmd,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOWeekTimeAndOffset = combineExtractors(
    extractISOWeekData,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOOrdinalDateAndTime = combineExtractors(
    extractISOOrdinalData,
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);
const extractISOTimeAndOffset = combineExtractors(
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);

/**
 * end @private
 */

export function parseHTTPDate(s: string) {
    return parse(
        s,
        [rfc1123, extractRFC1123Or850],
        [rfc850, extractRFC1123Or850],
        [ascii, extractASCII]
    );
}

export function parseISODate(s: string) {
    return parse(
        s,
        [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
        [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
        [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime],
        [isoTimeCombinedRegex, extractISOTimeAndOffset]
    );
}

export function parseISODuration(s: string): ParseResult {
    return parse(s, [isoDuration, extractISODuration]);
}

export function parseISOTimeOnly(s: string) {
    return parse(s, [isoTimeOnly, combineExtractors(extractISOTime)]);
}

export function parseRFC2822Date(s: string) {
    return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
}

const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);

const extractISOTimeOffsetAndIANAZone = combineExtractors(
    extractISOTime,
    extractISOOffset,
    extractIANAZone
);

export function parseSQL(s: string) {
    return parse(
        s,
        [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
        [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
    );
}
