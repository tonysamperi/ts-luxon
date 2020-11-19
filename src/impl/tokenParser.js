import { __assign } from "tslib";
import { parseMillis, isUndefined, untruncateYear, signedOffset } from "./util";
import Formatter from "./formatter";
import FixedOffsetZone from "../zones/fixedOffsetZone";
import IANAZone from "../zones/IANAZone";
import { digitRegex, parseDigits } from "./digits";
import DateTime from "../datetime";
import { ConflictingSpecificationError } from "../errors";
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
    if (unit === null)
        return {
            invalidReason: MISSING_FTP
        };
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
export function explainFromTokens(locale, input, format) {
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
export function parseFromTokens(locale, input, format) {
    var _a = explainFromTokens(locale, input, format), result = _a.result, zone = _a.zone, invalidReason = _a.invalidReason;
    return [result, zone, invalidReason];
}
//# sourceMappingURL=tokenParser.js.map