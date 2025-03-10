import * as English from "./english";
import * as Formats from "./formats";
import { padStart } from "./util";
import { Locale, PolyDateFormatter } from "./locale";
import { DateTime } from "../datetime";
import { Duration } from "../duration";
import { StringUnitLength } from "../types/common";
import { DurationUnit } from "../types/duration";
import { ZoneOffsetFormat } from "../types/zone";
import { Interval } from "../interval";

function stringifyTokens(
    splits: FormatToken[],
    tokenToString: (token: string) => string | undefined
): string {
    let s = "";
    for (const token of
        splits) {
        if (token.literal) {
            s += token.val;
        }
        else {
            s += tokenToString(token.val);
        }
    }
    return s;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const TokenToFormatOpts: Record<string, Intl.DateTimeFormatOptions> = {
    /* eslint-disable @typescript-eslint/naming-convention */
    D: Formats.DATE_SHORT,
    DD: Formats.DATE_MED,
    DDD: Formats.DATE_FULL,
    DDDD: Formats.DATE_HUGE,
    t: Formats.TIME_SIMPLE,
    tt: Formats.TIME_WITH_SECONDS,
    ttt: Formats.TIME_WITH_SHORT_OFFSET,
    tttt: Formats.TIME_WITH_LONG_OFFSET,
    T: Formats.TIME_24_SIMPLE,
    TT: Formats.TIME_24_WITH_SECONDS,
    TTT: Formats.TIME_24_WITH_SHORT_OFFSET,
    TTTT: Formats.TIME_24_WITH_LONG_OFFSET,
    f: Formats.DATETIME_SHORT,
    ff: Formats.DATETIME_MED,
    fff: Formats.DATETIME_FULL,
    ffff: Formats.DATETIME_HUGE,
    F: Formats.DATETIME_SHORT_WITH_SECONDS,
    FF: Formats.DATETIME_MED_WITH_SECONDS,
    FFF: Formats.DATETIME_FULL_WITH_SECONDS,
    FFFF: Formats.DATETIME_HUGE_WITH_SECONDS
    /* eslint-enable @typescript-eslint/naming-convention */
};

export interface FormatToken {
    literal: boolean;
    val: string;
}

export interface FormatterOptions extends Intl.DateTimeFormatOptions {
    allowZ?: boolean;
    floor?: boolean;
    forceSimple?: boolean;
    format?: ZoneOffsetFormat;
    padTo?: number;
}

/**
 * @private
 */

export class Formatter {

    private readonly _loc: Locale;
    private readonly _opts: Readonly<FormatterOptions>;
    private _systemLoc?: Locale;

    constructor(locale: Locale, formatOptions: FormatterOptions) {
        this._opts = formatOptions;
        this._loc = locale;
        this._systemLoc = void 0;
    }

    static create(locale: Locale, options: FormatterOptions = {}): Formatter {
        return new Formatter(locale, options);
    }

    static macroTokenToFormatOpts(token: string): Intl.DateTimeFormatOptions {
        return TokenToFormatOpts[token];
    }

    static parseFormat(fmt: string): {literal: boolean; val: string}[] {
        // white-space is always considered a literal in user-provided formats
        // the " " token has a special meaning (see unitForToken)
        let current = null,
            currentFull = "",
            bracketed = false;
        const splits = [];
        for (let i = 0;
             i < fmt.length;
             i++) {
            const c = fmt.charAt(i);
            if (c === "'") {
                if (currentFull.length > 0) {
                    splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
                }
                current = null;
                currentFull = "";
                bracketed = !bracketed;
            }
            else if (bracketed) {
                currentFull += c;
            }
            else if (c === current) {
                currentFull += c;
            }
            else {
                if (currentFull.length > 0) {
                    splits.push({ literal: /^\s+$/.test(currentFull), val: currentFull });
                }
                currentFull = c;
                current = c;
            }
        }

        if (currentFull.length > 0) {
            splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
        }

        return splits;
    }

    dtFormatter(dt: DateTime, opts: Intl.DateTimeFormatOptions = {}): PolyDateFormatter {
        return this._loc.dtFormatter(dt, { ...this._opts, ...opts });
    }

    formatDateTime(dt: DateTime, opts?: Intl.DateTimeFormatOptions): string {
        return this.dtFormatter(dt, opts).format();
    }

    formatDateTimeFromString(dt: DateTime, fmt: string): string {
        const knownEnglish = this._loc.listingMode() === "en",
            useDateTimeFormatter = this._loc.outputCalendar && this._loc.outputCalendar !== "gregory",
            string = (opts: Intl.DateTimeFormatOptions, extract: Intl.DateTimeFormatPartTypes) => this._loc.extract(dt, opts, extract),
            formatOffset = (opts: FormatterOptions & { format: ZoneOffsetFormat }) => {
                if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
                    return "Z";
                }

                return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
            },
            meridiem = () =>
                knownEnglish
                    ? English.meridiemForDateTime(dt)
                    : string({ hour: "numeric", hourCycle: "h12" }, "dayPeriod"),
            month = (length: StringUnitLength, standalone: boolean) =>
                knownEnglish
                    ? English.monthForDateTime(dt, length)
                    : string(standalone ? { month: length } : { month: length, day: "numeric" }, "month"),
            weekday = (length: StringUnitLength, standalone: boolean) =>
                knownEnglish
                    ? English.weekdayForDateTime(dt, length)
                    : string(
                        standalone ? { weekday: length } : { weekday: length, month: "long", day: "numeric" },
                        "weekday"
                    ),
            maybeMacro = (token: string) => {
                const formatOpts = Formatter.macroTokenToFormatOpts(token);
                if (formatOpts) {
                    return this.formatWithSystemDefault(dt, formatOpts);
                }
                else {
                    return token;
                }
            },
            era = (length: StringUnitLength) =>
                knownEnglish ? English.eraForDateTime(dt, length) : string({ era: length }, "era"),
            tokenToString = (token: string): string => {
                // Where possible: https://cldr.unicode.org/translation/date-time/date-time-symbols
                switch (token) {
                    // ms
                    case "S":
                        return this.num(dt.millisecond);
                    case "u":
                    // falls through
                    case "SSS":
                        return this.num(dt.millisecond, 3);
                    // seconds
                    case "s":
                        return this.num(dt.second);
                    case "ss":
                        return this.num(dt.second, 2);
                    // fractional seconds
                    case "uu":
                        return this.num(Math.floor(dt.millisecond / 10), 2);
                    case "uuu":
                        return this.num(Math.floor(dt.millisecond / 100));
                    // minutes
                    case "m":
                        return this.num(dt.minute);
                    case "mm":
                        return this.num(dt.minute, 2);
                    // hours
                    case "h":
                        return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
                    case "hh":
                        return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
                    case "H":
                        return this.num(dt.hour);
                    case "HH":
                        return this.num(dt.hour, 2);
                    // offset
                    case "Z":
                        // like +6
                        return formatOffset({ format: "narrow", allowZ: this._opts.allowZ });
                    case "ZZ":
                        // like +06:00
                        return formatOffset({ format: "short", allowZ: this._opts.allowZ });
                    case "ZZZ":
                        // like +0600
                        return formatOffset({ format: "techie", allowZ: this._opts.allowZ });
                    case "ZZZZ":
                        // like EST
                        return dt.zone.offsetName(dt.ts, { format: "short", locale: this._loc.locale }) || "";
                    case "ZZZZZ":
                        // like Eastern Standard Time
                        return dt.zone.offsetName(dt.ts, { format: "long", locale: this._loc.locale }) || "";
                    // zone
                    case "z":
                        // like America/New_York
                        return dt.zoneName || "";
                    // meridiems
                    case "a":
                        return meridiem();
                    // dates
                    case "d":
                        return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt.day);
                    case "dd":
                        return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt.day, 2);
                    // weekdays - standalone
                    case "c":
                        // like 1
                        return this.num(dt.weekday);
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
                        return this.num(dt.weekday);
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
                            : this.num(dt.month);
                    case "LL":
                        // like 01, doesn't seem to work
                        return useDateTimeFormatter
                            ? string({ month: "2-digit", day: "numeric" }, "month")
                            : this.num(dt.month, 2);
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
                            : this.num(dt.month);
                    case "MM":
                        // like 01
                        return useDateTimeFormatter
                            ? string({ month: "2-digit" }, "month")
                            : this.num(dt.month, 2);
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
                        return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year);
                    case "yy":
                        // like 14
                        return useDateTimeFormatter
                            ? string({ year: "2-digit" }, "year")
                            : this.num(parseInt(dt.year.toString().slice(-2), 10), 2);
                    case "yyyy":
                        // like 0012
                        return useDateTimeFormatter
                            ? string({ year: "numeric" }, "year")
                            : this.num(dt.year, 4);
                    case "yyyyyy":
                        // like 000012
                        return useDateTimeFormatter
                            ? string({ year: "numeric" }, "year")
                            : this.num(dt.year, 6);
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
                        return this.num(parseInt(dt.weekYear.toString().slice(-2), 10), 2);
                    case "kkkk":
                        return this.num(dt.weekYear, 4);
                    case "W":
                        return this.num(dt.weekNumber);
                    case "WW":
                        return this.num(dt.weekNumber, 2);
                    case "o":
                        return this.num(dt.ordinal);
                    case "ooo":
                        return this.num(dt.ordinal, 3);
                    case "q":
                        // like 1
                        return this.num(dt.quarter);
                    case "qq":
                        // like 01
                        return this.num(dt.quarter, 2);
                    case "X":
                        return this.num(Math.floor(dt.ts / 1000));
                    case "x":
                        return this.num(dt.ts);
                    default:
                        return maybeMacro(token);
                }
            };

        return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
    }

    formatDateTimeParts(dt: DateTime, opts?: Intl.DateTimeFormatOptions): Intl.DateTimeFormatPart[] {
        return this.dtFormatter(dt, opts).formatToParts();
    }

    formatDurationFromString(dur: Duration, format: string): string {
        const tokenToField = (token: string): DurationUnit | undefined => {
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
        };
        const tokenToString = (lildur: Duration) => (token: string) => {
            const mapped = tokenToField(token);
            if (mapped) {
                return this.num(lildur.get(mapped), token.length);
            }
            else {
                return token;
            }
        };
        const tokens = Formatter.parseFormat(format);
        const realTokens = tokens.reduce<string[]>((found, {
            literal,
            val
        }) => (literal ? found : found.concat(val)), []);
        const collapsed = dur.shiftTo(...(realTokens.map(tokenToField).filter((t) => !!t) as DurationUnit[]));

        return stringifyTokens(tokens, tokenToString(collapsed));
    }

    formatInterval(interval: Interval, opts: FormatterOptions = {}): string {
        if (!interval.isValid) {
            throw Error("Invalid Interval provided!");
        }
        const df = this.dtFormatter(interval.start!, opts);

        return df.dtf.formatRange(interval.start!.toJSDate(), interval.end!.toJSDate());
    }

    formatWithSystemDefault(dt: DateTime, opts: Intl.DateTimeFormatOptions): string {
        if (this._systemLoc === void 0) {
            this._systemLoc = this._loc.redefaultToSystem();
        }
        const df = this._systemLoc.dtFormatter(dt, { ...this._opts, ...opts });
        return df.format();
    }

    num(n: number, p = 0): string {
        // we get some perf out of doing this here, annoyingly
        if (this._opts.forceSimple) {

            return padStart(n, p);
        }
        const opts: FormatterOptions = { ...this._opts };
        if (p > 0) {
            opts.padTo = p;
        }

        return this._loc.numberFormatter(opts).format(n);
    }

    resolvedOptions(dt: DateTime, opts: Intl.DateTimeFormatOptions = {}): Intl.ResolvedDateTimeFormatOptions {
        return this.dtFormatter(dt, opts).resolvedOptions();
    }

}
