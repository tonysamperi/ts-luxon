import { hasFormatToParts, hasIntl, padStart, roundTo, hasRelative } from "./util";
import * as English from "./english";
import Settings from "../settings";
import DateTime from "../datetime";
import Formatter from "./formatter";
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
            if (this.padTo > 0)
                intlOpts.minimumIntegerDigits = this.padTo;
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
            var tokenFormat = English.formatString(this.options), loc = Locale.create("en-US");
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
            return English.formatRelativeTime(unit, count, this.options.numeric, this.options.style !== "long");
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
        return listStuff(this, length, defaultOK, English.months, function (len) {
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
        return listStuff(this, length, defaultOK, English.weekdays, function (len) {
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
        defaultOK, function () { return English.meridiems; }, function () {
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
        return listStuff(this, length, defaultOK, English.eras, function (len) {
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
        if (!matching)
            throw new Error("Invalid extract field " + field);
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
export default Locale;
//# sourceMappingURL=locale.js.map