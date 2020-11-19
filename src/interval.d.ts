import DateTime, { DateTimeLike } from "./datetime";
import Duration, { DurationLike } from "./duration";
import { ToISOTimeOptions, DateTimeWithZoneOptions } from "./types/datetime";
import { DurationUnit, DurationOptions } from "./types/duration";
import { IntervalObject } from "./types/interval";
import { ThrowOnInvalid } from "./types/common";
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
export default class Interval {
    private s;
    private e;
    private readonly isLuxonInterval;
    /**
     * @private
     */
    private constructor();
    /**
     * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
     * @param {DateTime|Date|Object} start
     * @param {DateTime|Date|Object} end
     * @return {Interval}
     */
    static fromDateTimes(start: DateTimeLike, end: DateTimeLike): Interval;
    /**
     * Create an Interval from a start DateTime and a Duration to extend to.
     * @param {DateTime|Date|Object} start
     * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
     * @return {Interval}
     */
    static after(start: DateTimeLike, duration: DurationLike): Interval;
    /**
     * Create an Interval from an end DateTime and a Duration to extend backwards to.
     * @param {DateTime|Date|Object} end
     * @param {Duration|Object} duration - the length of the Interval, as a Duration object.
     * @return {Interval}
     */
    static before(end: DateTimeLike, duration: DurationLike): Interval;
    /**
     * Create an Interval from an ISO 8601 string.
     * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
     * @param {string} text - the ISO string to parse
     * @param {Object} [options] - options to pass {@link DateTime.fromISO} and optionally {@link Duration.fromISO}
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @return {Interval}
     */
    static fromISO(text: string, options?: DateTimeWithZoneOptions): Interval;
    /**
     * Check if an object is an Interval. Works across context boundaries
     * @param {Object} o
     * @return {boolean}
     */
    static isInterval(o: unknown): o is Interval;
    /**
     * Returns the start of the Interval
     * @type {DateTime}
     */
    get start(): DateTime;
    /**
     * Returns the end of the Interval
     * @type {DateTime}
     */
    get end(): DateTime;
    /**
     * Returns the length of the Interval in the specified unit.
     * @param {string} [unit='milliseconds'] - the unit (such as 'hours' or 'days') to return the length in.
     * @return {number}
     */
    length(unit?: DurationUnit): number;
    /**
     * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
     * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
     * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
     * @param {string} [unit='milliseconds'] - the unit of time to count.
     * @return {number}
     */
    count(unit?: DurationUnit): number;
    /**
     * Returns whether this Interval's start and end are both in the same unit of time
     * @param {string} unit - the unit of time to check sameness on
     * @return {boolean}
     */
    hasSame(unit: DurationUnit): boolean;
    /**
     * Return whether this Interval has the same start and end DateTimes.
     * @return {boolean}
     */
    isEmpty(): boolean;
    /**
     * Return whether this Interval's start is after the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    isAfter(dateTime: DateTime): boolean;
    /**
     * Return whether this Interval's end is before the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    isBefore(dateTime: DateTime): boolean;
    /**
     * Return whether this Interval contains the specified DateTime.
     * @param {DateTime} dateTime
     * @return {boolean}
     */
    contains(dateTime: DateTime): boolean;
    /**
     * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
     * @param {Object} values - the values to set
     * @param {DateTime} values.start - the starting DateTime
     * @param {DateTime} values.end - the ending DateTime
     * @return {Interval}
     */
    set({ start, end }: IntervalObject): Interval;
    /**
     * Split this Interval at each of the specified DateTimes
     * @param {...[DateTime]} dateTimes - the unit of time to count.
     * @return {[Interval]}
     */
    splitAt(...dateTimes: DateTimeLike[]): Interval[];
    /**
     * Split this Interval into smaller Intervals, each of the specified length.
     * Left over time is grouped into a smaller interval
     * @param {Duration|Object} duration - The length of each resulting interval, as a Duration object.
     * @return {[Interval]}
     */
    splitBy(duration: DurationLike): Interval[];
    /**
     * Split this Interval into the specified number of smaller intervals.
     * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
     * @return {[Interval]}
     */
    divideEqually(numberOfParts: number): Interval[];
    /**
     * Return whether this Interval overlaps with the specified Interval
     * @param {Interval} other
     * @return {boolean}
     */
    overlaps(other: Interval): boolean;
    /**
     * Return whether this Interval's end is adjacent to the specified Interval's start.
     * @param {Interval} other
     * @return {boolean}
     */
    abutsStart(other: Interval): boolean;
    /**
     * Return whether this Interval's start is adjacent to the specified Interval's end.
     * @param {Interval} other
     * @return {boolean}
     */
    abutsEnd(other: Interval): boolean;
    /**
     * Return whether this Interval engulfs the start and end of the specified Interval.
     * @param {Interval} other
     * @return {boolean}
     */
    engulfs(other: Interval): boolean;
    /**
     * Return whether this Interval has the same start and end as the specified Interval.
     * @param {Interval} other
     * @return {boolean}
     */
    equals(other: Interval): boolean;
    /**
     * Return an Interval representing the intersection of this Interval and the specified Interval.
     * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
     * Returns null if the intersection is empty, meaning, the intervals don't intersect.
     * @param {Interval} other
     * @return {Interval|null}
     */
    intersection(other: Interval): Interval | null;
    /**
     * Return an Interval representing the union of this Interval and the specified Interval.
     * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
     * @param {Interval} other
     * @return {Interval}
     */
    union(other: Interval): Interval;
    /**
     * Merge an array of Intervals into a equivalent minimal set of Intervals.
     * Combines overlapping and adjacent Intervals.
     * @param {[Interval]} intervals
     * @return {[Interval]}
     */
    static merge(intervals: Interval[]): Interval[];
    /**
     * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
     * @param {[Interval]} intervals
     * @return {[Interval]}
     */
    static xor(intervals: Interval[]): Interval[];
    /**
     * Returns Intervals representing the span(s) of time in this Interval that don't overlap with any of the specified Intervals.
     * @param {...Interval} intervals
     * @return {[Interval]}
     */
    difference(...intervals: Interval[]): Interval[];
    /**
     * Returns a string representation of this Interval appropriate for debugging.
     * @return {string}
     */
    toString(): string;
    /**
     * Returns an ISO 8601-compliant string representation of this Interval.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @param {Object} options - The same options as {@link DateTime#toISO}
     * @return {string}
     */
    toISO(options?: ToISOTimeOptions): string;
    /**
     * Returns an ISO 8601-compliant string representation of date of this Interval.
     * The time components are ignored.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @return {string}
     */
    toISODate(): string;
    /**
     * Returns an ISO 8601-compliant string representation of time of this Interval.
     * The date components are ignored.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
     * @param {Object} options - The same options as {@link DateTime#toISO}
     * @return {string}
     *
     */
    toISOTime(options?: ToISOTimeOptions): string;
    /**
     * Returns a string representation of this Interval formatted according to the specified format string.
     * @param {string} dateFormat - the format string. This string formats the start and end time. See {@link DateTime.toFormat} for details.
     * @param {Object} options - options
     * @param {string} [options.separator =  ' – '] - a separator to place between the start and end representations
     * @return {string}
     */
    toFormat(dateFormat: string, options?: {
        separator: string;
    }): string;
    toDuration(): Duration;
    toDuration(unit: DurationUnit | DurationUnit[]): Duration;
    toDuration(unit: DurationUnit | DurationUnit[], options: DurationOptions & ThrowOnInvalid): Duration;
    toDuration(unit: DurationUnit | DurationUnit[], options: DurationOptions): Duration | null;
    /**
     * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
     * @param {function} mapFn
     * @return {Interval}
     * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
     * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
     */
    mapEndpoints(mapFn: (dt: DateTime) => DateTime): Interval;
}
