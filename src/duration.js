import { asNumber, isUndefined, isNumber, normalizeObject, roundTo } from "./impl/util";
import Locale from "./impl/locale";
import Formatter from "./impl/formatter";
import { parseISODuration } from "./impl/regexParser";
import { InvalidArgumentError, InvalidUnitError, UnparsableStringError } from "./errors";
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
            if (options.nullOnInvalid)
                return null;
            throw new InvalidArgumentError("Duration.fromObject: argument expected to be an object, got " + (obj === null ? "null" : typeof obj));
        }
        var values;
        try {
            values = normalizeObject(obj, Duration.normalizeUnit);
        }
        catch (error) {
            if (options.nullOnInvalid)
                return null;
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
            if (options.nullOnInvalid)
                return null;
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
        if (!normalized)
            throw new InvalidUnitError(unit);
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
        if (this.years !== 0)
            s += this.years + "Y";
        if (this.months !== 0 || this.quarters !== 0)
            s += this.months + this.quarters * 3 + "M";
        if (this.weeks !== 0)
            s += this.weeks + "W";
        if (this.days !== 0)
            s += this.days + "D";
        if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0)
            s += "T";
        if (this.hours !== 0)
            s += this.hours + "H";
        if (this.minutes !== 0)
            s += this.minutes + "M";
        if (this.seconds !== 0 || this.milliseconds !== 0)
            // this will handle "floating point madness" by removing extra decimal places
            // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
            s += roundTo(this.seconds + this.milliseconds / 1000, 3) + "S";
        if (s === "P")
            s += "T0S";
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
                if (isNumber(unitValue))
                    own += unitValue;
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
export default Duration;
/**
 * @private
 */
export function friendlyDuration(duration) {
    if (Duration.isDuration(duration))
        return duration;
    if (typeof duration === "object" && duration !== null)
        return Duration.fromObject(duration);
    throw new InvalidArgumentError("Unknown duration argument " + duration + " of type " + typeof duration);
}
//# sourceMappingURL=duration.js.map