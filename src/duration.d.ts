import { DurationObject, DurationOptions, DurationToFormatOptions, DurationUnit } from "./types/duration";
import { ThrowOnInvalid } from "./types/common";
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
export default class Duration {
    private values;
    private loc;
    private matrix;
    private readonly isLuxonDuration;
    /**
     * @private
     */
    private constructor();
    static fromMillis(count: number): Duration;
    static fromMillis(count: number, options: DurationOptions & ThrowOnInvalid): Duration;
    static fromMillis(count: number, options: DurationOptions): Duration | null;
    static fromObject(obj: DurationObject): Duration;
    static fromObject(obj: DurationObject, options: DurationOptions & ThrowOnInvalid): Duration;
    static fromObject(obj: DurationObject, options: DurationOptions): Duration | null;
    static fromISO(text: string): Duration;
    static fromISO(text: string, options: DurationOptions & ThrowOnInvalid): Duration;
    static fromISO(text: string, options: DurationOptions): Duration | null;
    /**
     * @private
     */
    static normalizeUnit(unit: string): "years" | "quarters" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds" | "milliseconds";
    /**
     * Check if an object is a Duration. Works across context boundaries
     * @param {Object} o
     * @return {boolean}
     */
    static isDuration(o: unknown): o is Duration;
    /**
     * Get  the locale of a Duration, such 'en-GB'
     * @type {string}
     */
    get locale(): string;
    /**
     * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
     *
     * @type {NumberingSystem}
     */
    get numberingSystem(): "arab" | "arabext" | "bali" | "beng" | "deva" | "fullwide" | "gujr" | "hanidec" | "khmr" | "knda" | "laoo" | "latn" | "limb" | "mlym" | "mong" | "mymr" | "orya" | "tamldec" | "telu" | "thai" | "tibt" | undefined;
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
    toFormat(format: string, options?: DurationToFormatOptions): string;
    /**
     * Returns a Javascript object with this Duration's values.
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
     * @return {Object}
     */
    toObject(): DurationObject;
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
    toISO(): string;
    /**
     * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
     * @return {string}
     */
    toJSON(): string;
    /**
     * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
     * @return {string}
     */
    toString(): string;
    /**
     * Returns an milliseconds value of this Duration.
     * @return {number}
     */
    valueOf(): number;
    /**
     * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
     * @param {Duration|Object} duration - The amount to add. Either a Luxon Duration or the object argument to Duration.fromObject()
     * @return {Duration}
     */
    plus(duration: DurationLike): Duration;
    /**
     * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
     * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
     * @return {Duration}
     */
    minus(duration: DurationLike): Duration;
    /**
     * Scale this Duration by the specified amount. Return a newly-constructed Duration.
     * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
     * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit(x => x * 2) //=> { hours: 2, minutes: 60 }
     * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit((x, u) => u === "hour" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
     * @return {Duration}
     */
    mapUnits(fn: (x: number, unit: DurationUnit) => number): Duration;
    /**
     * Get the value of unit.
     * @param {string} unit - a unit such as 'minute' or 'day'
     * @example Duration.fromObject({years: 2, days: 3}).years //=> 2
     * @example Duration.fromObject({years: 2, days: 3}).months //=> 0
     * @example Duration.fromObject({years: 2, days: 3}).days //=> 3
     * @return {number}
     */
    get(unit: DurationUnit): number;
    /**
     * "Set" the values of specified units. Non-specified units stay unchanged. Return a newly-constructed Duration.
     * @param {Object} values - a mapping of units to numbers
     * @example dur.set({ years: 2017 })
     * @example dur.set({ hours: 8, minutes: 30 })
     * @return {Duration}
     */
    set(values: DurationObject): Duration;
    /**
     * "Set" the locale and/or numberingSystem and/or conversionAccuracy. Returns a newly-constructed Duration.
     * @example dur.reconfigure({ locale: 'en-GB' })
     * @return {Duration}
     */
    reconfigure({ locale, numberingSystem, conversionAccuracy }?: DurationOptions): Duration;
    /**
     * Return the length of the duration in the specified unit.
     * @param {string} unit - a unit such as 'minutes' or 'days'
     * @example Duration.fromObject({years: 1}).as('days') //=> 365
     * @example Duration.fromObject({years: 1}).as('months') //=> 12
     * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
     * @return {number}
     */
    as(unit: DurationUnit): number;
    /**
     * Reduce this Duration to its canonical representation in its current units.
     * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
     * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
     * @return {Duration}
     */
    normalize(): Duration;
    /**
     * Convert this Duration into its representation in a different set of units.
     * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
     * @return {Duration}
     */
    shiftTo(...units: DurationUnit[]): Duration;
    /**
     * Return the negative of this Duration.
     * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
     * @return {Duration}
     */
    negate(): Duration;
    /**
     * Get the years.
     * @type {number}
     */
    get years(): number;
    /**
     * Get the quarters.
     * @type {number}
     */
    get quarters(): number;
    /**
     * Get the months.
     * @type {number}
     */
    get months(): number;
    /**
     * Get the weeks
     * @type {number}
     */
    get weeks(): number;
    /**
     * Get the days.
     * @type {number}
     */
    get days(): number;
    /**
     * Get the hours.
     * @type {number}
     */
    get hours(): number;
    /**
     * Get the minutes.
     * @type {number}
     */
    get minutes(): number;
    /**
     * Get the seconds.
     * @return {number}
     */
    get seconds(): number;
    /**
     * Get the milliseconds.
     * @return {number}
     */
    get milliseconds(): number;
    /**
     * Equality check
     * Two Durations are equal iff they have the same units and the same values for each unit.
     * @param {Duration} other
     * @return {boolean}
     */
    equals(other: Duration): boolean;
    /**
     * @private
     */
    private clone;
    /**
     * @private
     */
    private conversionAccuracy;
}
export declare type DurationLike = Duration | DurationObject;
/**
 * @private
 */
export declare function friendlyDuration(duration: DurationLike | unknown): Duration;
