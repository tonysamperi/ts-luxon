import { parseMillis, untruncateYear, signedOffset, isDefined } from "./util";
import { Formatter, FormatToken } from "./formatter";
import { FixedOffsetZone } from "../zones/fixedOffsetZone";
import { IANAZone } from "../zones/IANAZone";
import { digitRegex, parseDigits } from "./digits";
import { Locale } from "./locale";
import {
    GenericDateTime,
    ExplainedFormat,
    GenericDateTimeExtended
} from "../types/datetime";
import { Zone } from "../zone";
import { DateTime } from "../datetime";
import { ConflictingSpecificationError } from "../errors";

const missingFtp = "missing Intl.DateTimeFormat.formatToParts support";

interface TokenForPart {
    literal: boolean;
    val: string;
}

interface UnitParser {
    deser: (a: string[]) => number | string;
    groups?: number;
    literal?: boolean; // TODO investigate if this shall not be merged with token.literal
    regex: RegExp;
    token: FormatToken;
}

interface InvalidUnitParser {
    invalidReason: string;
}

type CoreUnitParser = Omit<UnitParser, "token">;

function intUnit(regex: RegExp, post: (a: number) => number = (i: number): number => i): CoreUnitParser {
    return { regex, deser: ([s]) => post(parseDigits(s)) };
}

const spaceOrNBSPPattern = `[ ${String.fromCharCode(160)}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSPPattern, "g");

function fixListRegex(s: string): string {
    // make dots optional and also make them literal
    // make space and non-breakable space characters interchangeable
    return s.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSPPattern);
}

function stripInsensitivities(s: string): string {
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

function escapeToken(value: string): string {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}

/**
 * @param token
 * @param {Locale} loc
 */
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
        unitate = (t: FormatToken): CoreUnitParser => {
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
        invalidReason: missingFtp
    };

    return { ...unit, token };
}

type SlimDateTimeFormatPartTypes = Exclude<Intl.DateTimeFormatPartTypes, "literal" | "era"> | "hour12" | "hour24";

interface TokensForPartTypes {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "2-digit"?: string;
    "long"?: string;
    "numeric"?: string;
    "short"?: string;
}

const partTypeStyleToTokenVal: Partial<{ [key in SlimDateTimeFormatPartTypes]: TokensForPartTypes | string }> = {
    year: {
        "2-digit": "yy",
        numeric: "yyyy"
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
    dayPeriod: "a",
    hour12: {
        numeric: "h",
        "2-digit": "hh"
    },
    hour24: {
        numeric: "H",
        "2-digit": "HH"
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

function tokenForPart(part: Intl.DateTimeFormatPart,
                      formatOpts: Intl.DateTimeFormatOptions,
                      resolvedOpts: Intl.ResolvedDateTimeFormatOptions): TokenForPart | void {
    const { type, value } = part;

    if (type === "literal") {
        const isSpace = /^\s+$/.test(value);
        return {
            literal: !isSpace,
            val: isSpace ? " " : value
        };
    }

    const style = (formatOpts as any)[type];

    // The user might have explicitly specified hour12 or hourCycle
    // if so, respect their decision
    // if not, refer back to the resolvedOpts, which are based on the locale
    let actualType: SlimDateTimeFormatPartTypes | keyof Intl.DateTimeFormatOptions = type;
    if (type === "hour") {
        if (formatOpts.hour12 != null) {
            actualType = formatOpts.hour12 ? "hour12" : "hour24";
        }
        else if (formatOpts.hourCycle != null) {
            if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") {
                actualType = "hour12";
            }
            else {
                actualType = "hour24";
            }
        }
        else {
            // tokens only differentiate between 24 hours or not,
            // so we do not need to check hourCycle here, which is less supported anyway
            actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
        }
    }
    // TODO: would like a more reliable typing here...
    let val = (partTypeStyleToTokenVal as any)[actualType];
    if (typeof val === "object") {
        val = val[style];
    }

    if (val) {
        return {
            literal: false,
            val
        };
    }

    return void 0;
}

function buildRegex(units: UnitParser[]): [string, UnitParser[]] {
    const re = units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
    return [`^${re}$`, units];
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
    const toField = (token: string): keyof GenericDateTimeExtended | null => {
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

    if (isDefined(matches.q)) {
        matches.M = ((matches.q as number) - 1) * 3 + 1;
    }

    if (isDefined(matches.h)) {
        if (+matches.h < 12 && matches.a === 1) {
            matches.h = (matches.h as number) + 12;
        }
        else if (matches.h === 12 && matches.a === 0) {
            matches.h = 0;
        }
    }

    if (matches.G === 0 && matches.y) {
        matches.y = -matches.y;
    }

    if (isDefined(matches.u)) {
        matches.S = parseMillis(matches.u as string) || 0;
    }

    const values: GenericDateTimeExtended = Object.keys(matches).reduce((r: Record<string, string | number>, k: string) => {
        const f = toField(k);
        if (f) {
            r[f] = matches[k] as number;
        }

        return r;
    }, {});

    return [values, zone, specificOffset];
}

let dummyDateTimeCache: DateTime | undefined;

function getDummyDateTime(locale: Locale): DateTime {
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

export function expandMacroTokens(tokens: FormatToken[], locale: Locale): Array<FormatToken | TokenForPart> {
    return Array.prototype.concat(...tokens.map(t => maybeExpandMacroToken(t, locale)));
}

/**
 * @private
 */

export class TokenParser {

    get invalidReason(): string | null {
        return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
    }

    get isValid(): boolean {
        return !this.disqualifyingUnit;
    }

    disqualifyingUnit: { invalidReason: string };
    handlers: UnitParser[];
    regex: RegExp;
    tokens: Array<FormatToken | TokenForPart>;
    units: UnitParser[];

    constructor(public locale: Locale, public format: string) {
        this._mapTokens();
    }

    explainFromTokens(input: string): ExplainedFormat {
        if (!this.isValid) {
            return { input, tokens: this.tokens, invalidReason: this.invalidReason };
        }
        else {
            const [rawMatches, matches] = match(input, this.regex, this.handlers),
                [result, zone, specificOffset] = matches
                    ? dateTimeFromMatches(matches)
                    : [null, null, undefined];
            if (matches.hasOwnProperty("a") && matches.hasOwnProperty("H")) {
                throw new ConflictingSpecificationError(
                    "Can't include meridiem when specifying 24-hour format"
                );
            }
            return {
                input,
                tokens: this.tokens,
                regex: this.regex,
                rawMatches,
                matches,
                result,
                zone,
                specificOffset
            };
        }
    }

    private _mapTokens(): void {
        this.tokens = expandMacroTokens(Formatter.parseFormat(this.format), this.locale);
        const units = this.tokens.map((t) => unitForToken(t, this.locale));
        this.disqualifyingUnit = units.find((t) => (t as InvalidUnitParser).invalidReason) as {
            invalidReason: string
        };
        this.units = units.filter(u => !(u as InvalidUnitParser).invalidReason) as UnitParser[];

        if (!this.disqualifyingUnit) {
            const [regexString, handlers] = buildRegex(this.units);
            this.regex = RegExp(regexString, "i");
            this.handlers = handlers;
        }
    }

}

export function explainFromTokens(locale: Locale, input: string, format: string): ExplainedFormat {
    const parser = new TokenParser(locale, format);
    return parser.explainFromTokens(input);
}

export function sanitizeSpaces(input: string): string {
    return input.replace(/\u202F/g, " ");
}

export function parseFromTokens(locale: Locale,
                                input: string,
                                format: string): [GenericDateTime | null | void, Zone | null | void, number | undefined, string | void] {
    const {
        result,
        zone,
        specificOffset,
        invalidReason
    } = explainFromTokens(locale, sanitizeSpaces(input), sanitizeSpaces(format));
    return [result, zone, specificOffset, invalidReason];
}

export function formatOptsToTokens(formatOpts: Intl.DateTimeFormatOptions, locale: Locale): (void | TokenForPart)[] {
    if (!formatOpts) {
        return null;
    }

    const formatter = Formatter.create(locale, formatOpts);
    const df = formatter.dtFormatter(getDummyDateTime(locale));
    const parts = df.formatToParts();
    const resolvedOpts = df.resolvedOptions();
    return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
}
