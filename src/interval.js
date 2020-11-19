import DateTime from "./datetime";
import Duration, { friendlyDuration } from "./duration";
import { InvalidArgumentError, UnparsableStringError } from "./errors";
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
export default Interval;
//# sourceMappingURL=interval.js.map