import { DateTime, DateTimeLike } from "./datetime";
import { Duration, DurationLike } from "./duration";
import { InvalidArgumentError, InvalidIntervalError } from "./errors";
import { ToISOTimeOptions, DateTimeOptions } from "./types/datetime";
import { DurationUnit, DurationOptions, DurationObject } from "./types/duration";
import { IntervalObject } from "./types/interval";
import { Invalid } from "./types/invalid";
import { Settings } from "./settings";
import { isNumber } from "./impl/util";
import { Formatter } from "./impl/formatter";
import { DATE_SHORT } from "./impl/formats";
import { LocaleOptions } from "./types/locale";
import Intl from "./types/intl-next";

// eslint-disable-next-line @typescript-eslint/naming-convention
const INVALID = "Invalid Interval";

interface IntervalBoundary {
    time: DateTime;
    type: "s" | "e";
}

// checks if the start is equal to or before the end
function validateStartEnd(start?: DateTime, end?: DateTime): Interval | void {
    if (!start || !start.isValid) {
        return Interval.invalid("missing or invalid start");
    }
    else if (!end || !end.isValid) {
        return Interval.invalid("missing or invalid end");
    }
    else if (end < start) {
        return Interval.invalid(
            "end before start",
            `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`
        );
    }
}

function friendlyDateTime(dateTimeish: DateTimeLike): DateTime {
    if (DateTime.isDateTime(dateTimeish)) {
        return dateTimeish;
    }
    else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
        return DateTime.fromJSDate(dateTimeish as Date);
    }
    else if (dateTimeish && typeof dateTimeish === "object") {
        return DateTime.fromObject(dateTimeish as DurationObject);
    }
    else {
        throw new InvalidArgumentError(
            `Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`
        );
    }
}

interface Config {
    end?: DateTime;
    invalid?: Invalid;
    start?: DateTime;
}

/**
 * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
 *
 * Here is a brief overview of the most commonly used methods and getters in Interval:
 *
 * * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
 * * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
 * * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
 * * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval.merge}, {@link Interval.xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
 * * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}
 * * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toLocaleString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
 */
export class Interval {

    /**
     * Returns the end of the Interval
     */
    get end(): DateTime | null {
        return this.isValid ? this._e : null;
    }

    /**
     * Returns an error code if this Interval is invalid, or null if the Interval is valid
     */
    get invalidReason(): string | null {
        return this._invalid ? this._invalid.reason : null;
    }

    /**
     * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
     */
    get isValid(): boolean {
        return this.invalidReason === null;
    }

    /**
     * Returns the start of the Interval
     */
    get start(): DateTime | null {
        return this.isValid ? this._s : null;
    }

    // Private readonly fields
    private readonly _e: DateTime;
    private readonly _invalid: Invalid | null;
    private readonly _isLuxonInterval: true;
    private readonly _s: DateTime;

    /**
     * @private
     */
    private constructor(config: Config) {
        /**
         * @access private
         */
        this._s = config.start as DateTime;
        /**
         * @access private
         */
        this._e = config.end as DateTime;
        /**
         * @access private
         */
        this._invalid = config.invalid || null;
        /**
         * @access private
         */
        this._isLuxonInterval = true;
    }

    /**
     * Create an Interval from a start DateTime and a Duration to extend to.
     * @param {DateTime|Date|Object} start
     * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
     */
    static after(start: DateTimeLike, duration: DurationLike): Interval {
        const dur = Duration.fromDurationLike(duration),
            dt = friendlyDateTime(start);

        return new Interval({
            start: dt,
            end: dt ? dt.plus(dur) : void 0
        });
    }

    /**
     * Create an Interval from an end DateTime and a Duration to extend backwards to.
     * @param {DateTime|Date|Object} end
     * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
     */
    static before(end: DateTimeLike, duration: DurationLike): Interval {
        const dur = Duration.fromDurationLike(duration),
            dt = friendlyDateTime(end);

        return new Interval({
            start: dt ? dt.minus(dur) : void 0,
            end: dt
        });
    }

    /**
     * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
     * @param {DateTime|Date|Object} start
     * @param {DateTime|Date|Object} end
     */
    static fromDateTimes(start: DateTimeLike, end: DateTimeLike): Interval {
        const builtStart = friendlyDateTime(start),
            builtEnd = friendlyDateTime(end);

        const validateError = validateStartEnd(builtStart, builtEnd);

        return validateError || new Interval({
            start: builtStart,
            end: builtEnd
        });
    }

    /**
     * Create an Interval from an ISO 8601 string.
     * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
     * @param {string} text - the ISO string to parse
     * @param {Object} [opts] - options to pass {@link DateTime.fromISO} and optionally {@link Duration.fromISO}
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     */
    static fromISO(text: string, opts: DateTimeOptions = {}): Interval {
        const [s, e] = (text || "").split("/", 2);
        if (s && e) {
            let start, startIsValid;
            try {
                start = DateTime.fromISO(s, opts);
                startIsValid = start.isValid;
            }
            catch (e) {
                startIsValid = false;
            }

            let end, endIsValid;
            try {
                end = DateTime.fromISO(e, opts);
                endIsValid = end.isValid;
            }
            catch (e) {
                endIsValid = false;
            }

            if (startIsValid && endIsValid) {
                return Interval.fromDateTimes(start as DateTime, end as DateTime);
            }

            if (startIsValid) {
                const dur = Duration.fromISO(e, opts);
                if (dur.isValid) {
                    return Interval.after(start as DateTime, dur);
                }
            }
            else if (endIsValid) {
                const dur = Duration.fromISO(s, opts);
                if (dur.isValid) {
                    return Interval.before(end as DateTime, dur);
                }
            }
        }
        return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }

    /**
     * Create an invalid Interval.
     * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
     * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
     */
    static invalid(reason: string | Invalid, explanation?: string): Interval {
        if (!reason) {
            throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
        }

        const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

        if (Settings.throwOnInvalid) {
            throw new InvalidIntervalError(invalid);
        }
        else {
            return new Interval({ invalid });
        }
    }

    /**
     * Check if an object is an Interval. Works across context boundaries
     * @param {Object} o
     */
    static isInterval(o: unknown): o is Interval {
        return (!!o && (o as Interval)._isLuxonInterval) || false;
    }

    /**
     * Merge an array of Intervals into a equivalent minimal set of Intervals.
     * Combines overlapping and adjacent Intervals.
     * @param {Interval[]} intervals
     */
    static merge(intervals: Interval[]): Interval[] {
        const [found, final] = intervals
            .sort((a, b) => a._s.valueOf() - b._s.valueOf())
            .reduce<[Interval[], Interval | null]>(
                ([sofar, current], item) => {
                    if (!current) {
                        return [sofar, item];
                    }
                    else if (current.overlaps(item) || current.abutsStart(item)) {
                        return [sofar, current.union(item)];
                    }
                    else {
                        return [sofar.concat([current]), item];
                    }
                },
                [[], null]
            );
        if (final) {
            found.push(final);
        }
        return found;
    }

    /**
     * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
     * @param {Interval[]} intervals
     * @return {Interval[]}
     */
    static xor(intervals: Interval[]): Interval[] {
        let start: DateTime | null = null, currentCount = 0;

        const results = [],
            ends = intervals.map(i => [
                { time: i._s, type: "s" },
                { time: i._e, type: "e" }
            ]),
            flattened: IntervalBoundary[] = Array.prototype.concat(...ends),
            arr = flattened.sort((a, b) => +a.time - +b.time);

        for (const i of
            arr) {
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
    }

    // PUBLIC INSTANCE

    /**
     * Returns a string representation of this Interval appropriate for the REPL.
     * @return {string}
     */
    [Symbol.for("nodejs.util.inspect.custom")](): string {
        if (this.isValid) {
            return `Interval { start: ${this._s.toISO()}, end: ${this._e.toISO()} }`;
        } else {
            return `Interval { Invalid, reason: ${this.invalidReason} }`;
        }
    }

    /**
     * Return whether this Interval's start is adjacent to the specified Interval's end.
     * @param {Interval} other
     * @return {boolean}
     */
    abutsEnd(other: Interval): boolean {
        return +other._e === +this._s;
    }

    /**
     * Return whether this Interval's end is adjacent to the specified Interval's start.
     * @param {Interval} other
     * @return {boolean}
     */
    abutsStart(other: Interval): boolean {
        return +this._e === +other._s;
    }

    /**
     * Return whether this Interval contains the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    contains(dateTime: DateTime): boolean {
        return this._s <= dateTime && this._e > dateTime;
    }

    /**
     * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
     * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
     * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
     * @param {string} [unit='milliseconds'] - the unit of time to count.
     * @param {Object} opts - options
     */
    count(unit: DurationUnit = "milliseconds", opts?: { useLocaleWeeks?: boolean }): number {
        if (!this.isValid) {
            return NaN;
        }
        const start = this.start.startOf(unit, opts);
        let end;
        if (opts?.useLocaleWeeks) {
            end = this.end.reconfigure({ locale: start.locale });
        }
        else {
            end = this.end;
        }
        end = end.startOf(unit, opts);
        return Math.floor(end.diff(start, unit).get(unit)) + +(end.valueOf() !== this.end.valueOf());
    }

    /**
     * Returns Intervals representing the span(s) of time in this Interval that don't overlap with any of the specified Intervals.
     * @param {...Interval} intervals
     * @return {Interval[]}
     */
    difference(...intervals: Interval[]): Interval[] {
        return Interval.xor([this as Interval].concat(intervals))
                       .map(i => this.intersection(i))
                       .filter(i => i && !i.isEmpty()) as Interval[];
    }

    /**
     * Split this Interval into the specified number of smaller intervals.
     * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
     * @return {Interval[]}
     */
    divideEqually(numberOfParts: number): Interval[] {
        if (!this.isValid) {
            return [];
        }
        return this.splitBy({ milliseconds: this.length() / numberOfParts }).slice(0, numberOfParts);
    }

    /**
     * Return whether this Interval engulfs the start and end of the specified Interval.
     * @param {Interval} other
     * @return {boolean}
     */
    engulfs(other: Interval): boolean {
        if (!this.isValid) {
            return false;
        }

        return this._s <= other._s && this._e >= other._e;
    }

    /**
     * Return whether this Interval has the same start and end as the specified Interval.
     * @param {Interval} other
     * @return {boolean}
     */
    equals(other: Interval): boolean {
        if (!this.isValid || !other.isValid) {
            return false;
        }

        return this._s.equals(other._s) && this._e.equals(other._e);
    }

    /**
     * Returns whether this Interval's start and end are both in the same unit of time
     * @param {string} unit - the unit of time to check sameness on
     * @return {boolean}
     */
    hasSame(unit: DurationUnit): boolean {
        return this.isValid ? this.isEmpty() || this._e.minus(1).hasSame(this._s, unit) : false;
    }

    /**
     * Return an Interval representing the intersection of this Interval and the specified Interval.
     * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
     * Returns null if the intersection is empty, meaning, the intervals don't intersect.
     * @param {Interval} other
     * @return {Interval|null}
     */
    intersection(other: Interval): Interval {
        if (!this.isValid) {
            return this;
        }
        const s = this._s > other._s ? this._s : other._s,
            e = this._e < other._e ? this._e : other._e;

        if (s >= e) {
            return null;
        }
        else {
            return Interval.fromDateTimes(s, e);
        }
    }

    /**
     * Return whether this Interval's start is after the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    isAfter(dateTime: DateTime): boolean {
        if (!this.isValid) {
            return false;
        }

        return this._s > dateTime;
    }

    /**
     * Return whether this Interval's end is before the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    isBefore(dateTime: DateTime): boolean {
        if (!this.isValid) {
            return false;
        }

        return this._e <= dateTime;
    }

    /**
     * Return whether this Interval has the same start and end DateTimes.
     * @return {boolean}
     */
    isEmpty(): boolean {
        return this._s.valueOf() === this._e.valueOf();
    }

    /**
     * Returns the length of the Interval in the specified unit.
     * @param {string} [unit='milliseconds'] - the unit (such as 'hours' or 'days') to return the length in.
     */
    length(unit: DurationUnit = "milliseconds"): number {
        return this.toDuration(unit).get(unit);
    }

    /**
     * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
     * @param {function} mapFn
     * @return {Interval}
     * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
     * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
     */
    mapEndpoints(mapFn: (dt: DateTime) => DateTime): Interval {
        return Interval.fromDateTimes(mapFn(this._s), mapFn(this._e));
    }

    /**
     * Return whether this Interval overlaps with the specified Interval
     * @param {Interval} other
     * @return {boolean}
     */
    overlaps(other: Interval): boolean {
        return this._e > other._s && this._s < other._e;
    }


    /**
     * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
     * @param {Object} values - the values to set
     * @param {DateTime} values.start - the starting DateTime
     * @param {DateTime} values.end - the ending DateTime
     * @return {Interval}
     */
    set({ start, end }: IntervalObject = {}): Interval {
        if (!this.isValid) {
            return this;
        }
        return Interval.fromDateTimes(start || this._s, end || this._e);
    }

    /**
     * Split this Interval at each of the specified DateTimes
     * @param {...[DateTime]} dateTimes - the unit of time to count.
     * @return {Interval[]}
     */
    splitAt(...dateTimes: DateTimeLike[]): Interval[] {
        const sorted = dateTimes
            .map(friendlyDateTime)
            .filter((d: DateTime) => this.contains(d))
            .sort((a, b) => a.toMillis() - b.toMillis());
        const results = [];
        let s = this._s,
            i = 0;

        while (s < this._e) {
            const added = sorted[i] || this._e;
            const next = +added > +this._e ? this._e : added;
            results.push(Interval.fromDateTimes(s, next));
            s = next;
            i += 1;
        }

        return results;
    }

    /**
     * Split this Interval into smaller Intervals, each of the specified length.
     * Left over time is grouped into a smaller interval
     * @param {Duration|Object} duration - The length of each resulting interval, as a Duration object.
     * @return {Interval[]}
     */
    splitBy(duration: DurationLike): Interval[] {
        const dur = Duration.fromDurationLike(duration);

        if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
            return [];
        }

        let s = this._s, idx = 1, next;

        const results = [];
        while (s < this._e) {
            // Start is not null here because it's valid
            const added = (this.start as DateTime).plus(dur.mapUnits(x => x * idx));
            next = +added > +this._e ? this._e : added;
            results.push(Interval.fromDateTimes(s, next));
            s = next;
            idx += 1;
        }

        return results;
    }

    /**
     * Return a Duration representing the time spanned by this interval.
     * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
     * @param {Object} opts - options that affect the creation of the Duration
     * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
     * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
     * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
     * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
     * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
     * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
     * @return {Duration}
     */
    toDuration(unit: DurationUnit | DurationUnit[] = "milliseconds", opts: DurationOptions = {}): Duration {
        if (!this.isValid) {
            return Duration.invalid(this._invalid.reason);
        }

        return this._e.diff(this._s, unit, opts);
    }

    /**
     * Returns a string representation of this Interval formatted according to the specified format
     * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
     * formatting tool.
     * @param {string} dateFormat - The format string. This string formats the start and end time.
     * See {@link DateTime#toFormat} for details.
     * @param {Object} opts - Options.
     * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
     * representations.
     * @return {string}
     */
    toFormat(dateFormat: string, { separator = " - " }: { separator?: string } = {}): string {
        if (!this.isValid) {
            return INVALID;
        }
        return `${this._s.toFormat(dateFormat)}${separator}${this._e.toFormat(dateFormat)}`;
    }

    /**
     * Returns an ISO 8601-compliant string representation of this Interval.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @param {Object} options - The same options as {@link DateTime#toISO}
     * @return {string}
     */
    toISO(options: ToISOTimeOptions = {}): string {
        if (!this.isValid) {
            return INVALID;
        }
        return `${this._s.toISO(options)}/${this._e.toISO(options)}`;
    }

    /**
     * Returns an ISO 8601-compliant string representation of date of this Interval.
     * The time components are ignored.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @return {string}
     */
    toISODate(): string {
        if (!this.isValid) {
            return INVALID;
        }
        return `${this._s.toISODate()}/${this._e.toISODate()}`;
    }

    /**
     * Returns an ISO 8601-compliant string representation of time of this Interval.
     * The date components are ignored.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @param {Object} options - The same options as {@link DateTime#toISO}
     * @return {string}
     *
     */
    toISOTime(options: ToISOTimeOptions = {}): string {
        if (!this.isValid) {
            return INVALID;
        }
        return `${this._s.toISOTime(options)}/${this._e.toISOTime(options)}`;
    }

    /**
     * Returns a localized string representing this Interval. Accepts the same options as the
     * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
     * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
     * is browser-specific, but in general it will return an appropriate representation of the
     * Interval in the assigned locale. Defaults to the system's locale if no locale has been
     * specified.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
     * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
     * Intl.DateTimeFormat constructor options.
     * @param {Object} opts - Options to override the configuration of the start DateTime.
     * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
     * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
     * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
     * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
     * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
     * @return {string}
     */
    toLocaleString(formatOpts: Intl.DateTimeFormatOptions & LocaleOptions = DATE_SHORT, opts = {}): string {
        return this.isValid
            // tslint:disable-next-line:no-non-null-assertion
            ? Formatter.create(this._s.loc!.clone(opts), formatOpts).formatInterval(this)
            : INVALID;
    }

    /**
     * Returns a string representation of this Interval appropriate for debugging.
     * @return {string}
     */
    toString(): string {
        if (!this.isValid) {
            return INVALID;
        }

        return `[${this._s.toISO()} – ${this._e.toISO()})`;
    }

    /**
     * Return an Interval representing the union of this Interval and the specified Interval.
     * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
     * @param {Interval} other
     * @return {Interval}
     */
    union(other: Interval): Interval {
        if (!this.isValid) {
            return this;
        }
        const s = this._s < other._s ? this._s : other._s,
            e = this._e > other._e ? this._e : other._e;
        return Interval.fromDateTimes(s, e);
    }
}
