import * as English from "./english";
import * as Formats from "./formats";
import { hasFormatToParts, padStart } from "./util";
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
                ? English.meridiemForDateTime(dt)
                : string({ hour: "numeric", hour12: true }, "dayPeriod");
        }, month = function (length, standalone) {
            return knownEnglish
                ? English.monthForDateTime(dt, length)
                : string(standalone ? { month: length } : { month: length, day: "numeric" }, "month");
        }, weekday = function (length, standalone) {
            return knownEnglish
                ? English.weekdayForDateTime(dt, length)
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
            return knownEnglish ? English.eraForDateTime(dt, length) : string({ era: length }, "era");
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
export default Formatter;
//# sourceMappingURL=formatter.js.map