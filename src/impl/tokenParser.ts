import { parseMillis, isUndefined, untruncateYear, signedOffset, isDefined } from "./util";
import { Formatter, FormatToken } from "./formatter";
import { FixedOffsetZone } from "../zones/fixedOffsetZone";
import { IANAZone } from "../zones/IANAZone";
import { digitRegex, parseDigits } from "./digits";
import { Locale } from "./locale";
import { GenericDateTime, ExplainedFormat, GenericDateTimeExtended } from "../types/datetime";
import { Zone } from "../zone";
import { DateTime } from "../datetime";
import { ConflictingSpecificationError } from "../errors";
import Intl from "../types/intl-next";

const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";

interface TokenForPart {
    literal: boolean;
    val: string;
}

interface UnitParser {
    regex: RegExp;
    deser: (a: string[]) => number | string;
    groups?: number;
    literal?: boolean; // TODO investigate if this shall not be merged with token.literal
    token: FormatToken;
}

interface InvalidUnitParser {
    invalidReason: string;
}

type CoreUnitParser = Omit<UnitParser, "token">;

function intUnit(regex: RegExp, post: (a: number) => number = i => i): CoreUnitParser {
    return { regex, deser: ([s]) => post(parseDigits(s)) };
}

const spaceOrNBSPPattern = `[ ${String.fromCharCode(160)}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSPPattern, "g");

function fixListRegex(s: string) {
    // make dots optional and also make them literal
    // make space and non breakable space characters interchangeable
    return s.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSPPattern);
}

function stripInsensitivities(s: string) {
    return s
        .replace(/\./g, "") // ignore dots that were made optional
        .replace(spaceOrNBSPRegExp, " ") // interchange space and nbsp
        .toLowerCase();
}

function oneOf(strings: string[], startIndex: number): CoreUnitParser {
    return {
        regex: RegExp(strings.map(fixListRegex).join("|")),
        deser: ([s]) =>
            strings.findIndex(i => stripInsensitivities(s) === stripInsensitivities(i)) + startIndex
    };
}

function offset(regex: RegExp, groups: number): CoreUnitParser {
    return { regex, deser: ([, h, m]) => signedOffset(h, m), groups };
}

function simple(regex: RegExp): CoreUnitParser {
    return { regex, deser: ([s]) => s };
}

function escapeToken(value: string) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}

function unitForToken(token: FormatToken, loc: Locale): UnitParser | { invalidReason: string } {
    const one = digitRegex(loc),
        two = digitRegex(loc, "{2}"),
        three = digitRegex(loc, "{3}"),
        four = digitRegex(loc, "{4}"),
        six = digitRegex(loc, "{6}"),
        oneOrTwo = digitRegex(loc, "{1,2}"),
        oneToThree = digitRegex(loc, "{1,3}"),
        oneToSix = digitRegex(loc, "{1,6}"),
        oneToNine = digitRegex(loc, "{1,9}"),
        twoToFour = digitRegex(loc, "{2,4}"),
        fourToSix = digitRegex(loc, "{4,6}"),
        literal = (t: FormatToken): CoreUnitParser => ({
            regex: RegExp(escapeToken(t.val)),
            deser: ([s]) => s,
            literal: true
        }),
        unitate = (t: FormatToken) => {
            if (token.literal) {
                return literal(t);
            }
            switch (t.val) {
                // era
                case "G":
                    return oneOf(loc.eras("short"), 0);
                case "GG":
                    return oneOf(loc.eras("long"), 0);
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
                    return oneOf(loc.months("short", true), 1);
                case "MMMM":
                    return oneOf(loc.months("long", true), 1);
                case "L":
                    return intUnit(oneOrTwo);
                case "LL":
                    return intUnit(two);
                case "LLL":
                    return oneOf(loc.months("short", false), 1);
                case "LLLL":
                    return oneOf(loc.months("long", false), 1);
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
                    return oneOf(loc.weekdays("short", false), 1);
                case "EEEE":
                    return oneOf(loc.weekdays("long", false), 1);
                case "ccc":
                    return oneOf(loc.weekdays("short", true), 1);
                case "cccc":
                    return oneOf(loc.weekdays("long", true), 1);
                // offset/zone
                case "Z":
                case "ZZ":
                    return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
                case "ZZZ":
                    return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
                // we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
                // because we don't have any way to figure out what they are
                case "z":
                    return simple(/[a-z_+-/]{1,256}?/i);
                default:
                    return literal(t);
            }
        };

    const unit = unitate(token) || {
        invalidReason: MISSING_FTP
    };

    return { ...unit, token };
}

type SlimDateTimeFormatPartTypes = Exclude<Intl.DateTimeFormatPartTypes, "literal" | "era" | "dayPeriod">;
const partTypeStyleToTokenVal: { [key in SlimDateTimeFormatPartTypes]: Record<string, string> } = {
    // literal: void 0, era: void 0, dayPeriod: void 0, timeZoneName: void 0,
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
    },
    timeZoneName: {
        long: "ZZZZZ",
        short: "ZZZ"
    }
};

function tokenForPart(part: Intl.DateTimeFormatPart, formatOptions: Intl.DateTimeFormatOptions): TokenForPart | void {
    const { type, value } = part;
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

    const tokenVals = partTypeStyleToTokenVal[type as SlimDateTimeFormatPartTypes];
    if (tokenVals !== void 0) {
        const style = formatOptions[type];
        if (style) {
            const val = tokenVals[style];
            if (val !== undefined) {
                return {
                    literal: false,
                    val
                };
            }
        }
    }

    return void 0;
}

function buildRegex(units: UnitParser[]) {
    const re = units.map(u => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
    return `^${re}$`;
}

function match(input: string, regex: RegExp, handlers: UnitParser[]): [RegExpMatchArray | null, Record<string, number | string>] {
    const matches = regex.exec(input);
    const all: Record<string, number | string> = {};

    if (matches !== null) {
        let matchIndex = 1;
        handlers.forEach(h => {
            const groups = h.groups ? h.groups + 1 : 1;
            if (!h.literal) {
                all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
            }
            matchIndex += groups;
        });
    }

    return [matches, all];
}

function dateTimeFromMatches(matches: Record<string, string | number>): [GenericDateTimeExtended, Zone | null, number | undefined] {
    const toField = (token: string) => {
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
            case "q":
                return "quarter";
            default:
                return null;
        }
    };

    let zone = null;
    let specificOffset;
    if (isDefined(matches.z)) {
        zone = IANAZone.create(matches.z as string);
    }

    if (isDefined(matches.Z)) {
        if (!zone) {
            zone = new FixedOffsetZone(+matches.Z);
        }
        specificOffset = +matches.Z;
    }

    if (!isUndefined(matches.q)) {
        matches.M = ((matches.q as number) - 1) * 3 + 1;
    }

    if (!isUndefined(matches.h)) {
        if (matches.h < 12 && matches.a === 1) {
            matches.h = (matches.h as number) + 12;
        }
        else if (matches.h === 12 && matches.a === 0) {
            matches.h = 0;
        }
    }

    if (matches.G === 0 && matches.y) {
        matches.y = -matches.y;
    }

    if (!isUndefined(matches.u)) {
        matches.S = parseMillis(matches.u as string) || 0;
    }

    const vals = Object.keys(matches).reduce((r: GenericDateTimeExtended, k: string) => {
        const f = toField(k);
        if (f) {
            r[f] = matches[k] as number;
        }

        return r;
    }, {} as GenericDateTimeExtended);

    return [vals, zone, specificOffset];
}

let dummyDateTimeCache: DateTime | undefined;

function getDummyDateTime(locale: Locale) {
    if (dummyDateTimeCache === void 0) {
        dummyDateTimeCache = DateTime.fromMillis(1555555555555, {
            locale: locale.locale
        });
    }

    return dummyDateTimeCache;
}

function maybeExpandMacroToken(token: FormatToken, locale: Locale): FormatToken | Array<TokenForPart | void> {
    if (token.literal) {

        return token;
    }
    const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
    const tokens = formatOptsToTokens(formatOpts, locale);
    if (tokens == null || tokens.includes(undefined)) {

        return token;
    }

    return tokens;
}

function isInvalidUnitParser(parser: unknown): parser is InvalidUnitParser {
    return !!parser && !!(parser as { invalidReason: string | undefined }).invalidReason;
}

export function expandMacroTokens(tokens: FormatToken[], locale: Locale): Array<FormatToken | TokenForPart> {
    return Array.prototype.concat(...tokens.map(t => maybeExpandMacroToken(t, locale)));
}

/**
 * @private
 */
export function explainFromTokens(locale: Locale, input: string, format: string): ExplainedFormat {
    const tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
    const units = tokens.map((t: FormatToken) => unitForToken(t, locale));
    const disqualifyingUnit = units.find(isInvalidUnitParser);

    if (disqualifyingUnit) {
        return { input, tokens, invalidReason: disqualifyingUnit.invalidReason };
    }
    else {
        const regexString = buildRegex(units as UnitParser[]),
            regex = RegExp(regexString, "i"),
            [rawMatches, matches] = match(input, regex, units as UnitParser[]),
            [result, zone, specificOffset] = matches
                ? dateTimeFromMatches(matches)
                : [null, null, void 0];
        if ("a" in matches && "H" in matches) {
            throw new ConflictingSpecificationError(
                "Can't include meridiem when specifying 24-hour format"
            );
        }
        return { input, tokens, regex, rawMatches, matches, result, zone, specificOffset };
    }
}

export function parseFromTokens(locale: Locale,
                                input: string,
                                format: string): [GenericDateTime | null | void, Zone | null | void, number | undefined, string | void] {
    const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
    return [result, zone, specificOffset, invalidReason];
}

export function formatOptsToTokens(formatOpts: Intl.DateTimeFormatOptions, locale: Locale) {
    if (!formatOpts) {
        return null;
    }

    const formatter = Formatter.create(locale, formatOpts);
    const parts = formatter.formatDateTimeParts(getDummyDateTime(locale));

    return parts.map((p) => tokenForPart(p, formatOpts));
}
