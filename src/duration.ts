import {
    asNumber,
    isUndefined,
    isNumber,
    normalizeObject,
    roundTo,
    ORDERED_UNITS,
    REVERSE_ORDERED_UNITS,
    HUMAN_ORDERED_UNITS
} from "./impl/util";
import { Locale } from "./impl/locale";
import { Formatter } from "./impl/formatter";
import { parseISODuration, parseISOTimeOnly } from "./impl/regexParser";
import { InvalidArgumentError, InvalidDurationError, InvalidUnitError } from "./errors";
import {
    DurationObject,
    DurationOptions,
    DurationToFormatOptions,
    DurationUnit,
    UnparsedDurationObject,
    NormalizedDurationUnit,
    NormalizedDurationObject,
    DurationToHumanOptions,
    NormalizedHumanDurationUnit,
    ConversionMatrixUnit,
    ConversionMatrix,
    DurationConfig as Config
} from "./types/duration";
import { ConversionAccuracy } from "./types/common";
import { Settings } from "./settings";
import { Invalid } from "./types/invalid";
import { NumberingSystem } from "./types/locale";
import { ToISOTimeOptions } from "./types/datetime";
import Intl from "./types/intl-next";
import { DateTime } from "./datetime";

// unit conversion constants
// tslint:disable-next-line:naming-convention
export const lowOrderMatrix = {
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
};
// tslint:disable-next-line:naming-convention
export const casualMatrix: ConversionMatrix = {
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
    },
    ...lowOrderMatrix
};
const daysInYearAccurate = 146097.0 / 400;
const daysInMonthAccurate = 146097.0 / 4800;
const accurateMatrix: ConversionMatrix = {
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
    },
    ...lowOrderMatrix
};

function durationToMillis(matrix: ConversionMatrix, vals: NormalizedDurationObject): number {
    let sum = vals.milliseconds ?? 0;
    for (const unit of
        REVERSE_ORDERED_UNITS.slice(1)) {
        if (vals[unit]) {
            sum += vals[unit] * matrix[unit as ConversionMatrixUnit]["milliseconds"];
        }
    }
    return sum;
}

function eq(v1: number | undefined, v2: number | undefined): boolean {
    // Consider 0 and undefined as equal
    if (v1 === undefined || v1 === 0) {
        return v2 === undefined || v2 === 0;
    }
    return v1 === v2;
}

// NB: mutates vals parameters
function normalizeValues(matrix: ConversionMatrix, vals: NormalizedDurationObject): void {
    // the logic below assumes the overall value of the duration is positive
    // if this is not the case, factor is used to make it so
    const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;

    REVERSE_ORDERED_UNITS.reduce((previous, current) => {
        if (!isUndefined(vals[current])) {
            if (previous) {
                const previousVal = vals[previous] * factor;
                const conv = matrix[current as ConversionMatrixUnit][previous];

                // if (previousVal < 0):
                // lower order unit is negative (e.g. { years: 2, days: -2 })
                // normalize this by reducing the higher order unit by the appropriate amount
                // and increasing the lower order unit
                // this can never make the higher order unit negative, because this function only operates
                // on positive durations, so the amount of time represented by the lower order unit cannot
                // be larger than the higher order unit
                // else:
                // lower order unit is positive (e.g. { years: 2, days: 450 } or { years: -2, days: 450 })
                // in this case we attempt to convert as much as possible from the lower order unit into
                // the higher order one
                //
                // Math.floor takes care of both of these cases, rounding away from 0
                // if previousVal < 0 it makes the absolute value larger
                // if previousVal >= it makes the absolute value smaller
                const rollUp = Math.floor(previousVal / conv);
                vals[current] += rollUp * factor;
                vals[previous] -= rollUp * conv * factor;
            }
            return current;
        }
        else {
            return previous;
        }
    }, null);

    // try to convert any decimals into smaller units if possible
    // for example for { years: 2.5, days: 0, seconds: 0 } we want to get { years: 2, days: 182, hours: 12 }
    ORDERED_UNITS.reduce((previous, current) => {
        if (!isUndefined(vals[current])) {
            if (previous) {
                const fraction = vals[previous] % 1;
                vals[previous] -= fraction;
                vals[current] += fraction * matrix[previous as ConversionMatrixUnit][current];
            }
            return current;
        }
        else {
            return previous;
        }
    }, null);
}

// Remove all properties with a value of 0 from an object
function removeZeroes(vals: DurationObject = {}): DurationObject {
    return Object.entries(vals).reduce((acc, [key, value]) => {
        if (value !== 0) {
            acc[key as DurationUnit] = value;
        }

        return acc;
    }, {} as DurationObject);
}

/**
 * A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime#plus} to add a Duration object to a DateTime, producing another DateTime. *
 * Here is a brief overview of commonly used methods and getters in Duration:
 *
 * * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
 * * **Unit values** See the {@link Duration#years}, {@link Duration#months}, {@link Duration#weeks}, {@link Duration#days}, {@link Duration#hours}, {@link Duration#minutes}, {@link Duration#seconds}, {@link Duration#milliseconds} accessors.
 * * **Configuration** See  {@link Duration#locale} and {@link Duration#numberingSystem} accessors.
 * * **Transformation** To create new Durations out of old ones use {@link Duration#plus}, {@link Duration#minus}, {@link Duration#normalize}, {@link Duration#set}, {@link Duration#reconfigure}, {@link Duration#shiftTo}, and {@link Duration#negate}.
 * * **Output** To convert the Duration into other representations, see {@link Duration#as}, {@link Duration#toISO}, {@link Duration#toFormat}, and {@link Duration#toJSON}
 *
 * There are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
 */
export class Duration implements NormalizedDurationObject {

    private static get _INVALID(): string {
        return "Invalid Duration";
    }

    /**
     * Returns the conversion system to use
     * @type {ConversionAccuracy}
     */
    get conversionAccuracy(): ConversionAccuracy {
        return this._conversionAccuracy;
    }

    /**
     * Get the days.
     * @type {number}
     */
    get days(): number {
        return this.isValid ? this._values.days || 0 : NaN;
    }

    /**
     * Get the hours.
     * @type {number}
     */
    get hours(): number {
        return this.isValid ? this._values.hours || 0 : NaN;
    }

    /**
     * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
     * @type {string}
     */
    get invalidExplanation(): string | null {
        return this._invalid ? this._invalid.explanation! : null;
    }

    /**
     * Returns an error code if this Duration became invalid, or null if the Duration is valid
     * @return {string}
     */
    get invalidReason(): string | null {
        return this._invalid ? this._invalid.reason : null;
    }

    /**
     * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
     * on invalid DateTimes or Intervals.
     * @return {boolean}
     */
    get isValid(): boolean {
        return this._invalid === null;
    }

    /**
     * Get  the locale of a Duration, such 'en-GB'
     * @type {string}
     */
    get locale(): string | void {
        return this.isValid ? this._loc.locale : void 0;
    }

    /**
     * Get the conversion matrix of a Duration
     * @type {ConversionMatrix}
     */
    get matrix(): ConversionMatrix {
        return this._matrix;
    }

    /**
     * Get the milliseconds.
     * @return {number}
     */
    get milliseconds(): number {
        return this.isValid ? this._values.milliseconds || 0 : NaN;
    }

    /**
     * Get the minutes.
     * @type {number}
     */
    get minutes(): number {
        return this.isValid ? this._values.minutes || 0 : NaN;
    }

    /**
     * Get the months.
     * @type {number}
     */
    get months(): number {
        return this.isValid ? this._values.months || 0 : NaN;
    }

    /**
     * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
     *
     * @type {NumberingSystem}
     */
    get numberingSystem(): NumberingSystem | void {
        return this.isValid ? this._loc.numberingSystem : void 0;
    }

    /**
     * Get the quarters.
     * @type {number}
     */
    get quarters(): number {
        return this.isValid ? this._values.quarters || 0 : NaN;
    }

    /**
     * Get the seconds.
     * @return {number}
     */
    get seconds(): number {
        return this.isValid ? this._values.seconds || 0 : NaN;
    }

    /**
     * Get the weeks
     * @type {number}
     */
    get weeks(): number {
        return this.isValid ? this._values.weeks || 0 : NaN;
    }

    /**
     * Get the years.
     * @type {number}
     */
    get years(): number {
        return this.isValid ? this._values.years || 0 : NaN;
    }

    // Private readonly fields
    private readonly _conversionAccuracy: ConversionAccuracy;
    private readonly _invalid: Invalid | null;
    private readonly _isLuxonDuration: true;
    private _loc: Locale;
    private readonly _matrix: ConversionMatrix;
    private readonly _values: NormalizedDurationObject;

    /**
     * @private
     */
    private constructor(config: Config) {
        const accurate = config.conversionAccuracy === "longterm" || false;
        let matrix: ConversionMatrix, conversionAccuracy: ConversionAccuracy;
        if (accurate) {
            conversionAccuracy = "longterm";
            matrix = accurateMatrix;
        }
        else {
            conversionAccuracy = "casual";
            matrix = casualMatrix;
        }

        if (config.matrix) {
            matrix = config.matrix;
        }
        /**
         * @access private
         */
        this._values = config.values || {};
        /**
         * @access private
         */
        this._loc = config.loc || Locale.create();
        /**
         * @access private
         */
        this._conversionAccuracy = conversionAccuracy;
        /**
         * @access private
         */
        this._invalid = config.invalid || null;
        /**
         * @access private
         */
        this._matrix = matrix;
        /**
         * @access private
         */
        this._isLuxonDuration = true;
    }

    /**
     * Create a Duration from DurationLike.
     *
     * @param {Object | number | Duration} durationLike
     * One of:
     * - object with keys like 'years' and 'hours'.
     * - number representing milliseconds
     * - Duration instance
     * @return {Duration}
     */
    static fromDurationLike(durationLike: number | DurationLike): Duration {
        if (isNumber(durationLike)) {
            return Duration.fromMillis(durationLike);
        }
        else if (Duration.isDuration(durationLike)) {
            return durationLike;
        }
        else if (typeof durationLike === "object") {
            return Duration.fromObject(durationLike);
        }
        else {
            throw new InvalidArgumentError(
                `Unknown duration argument ${durationLike} of type ${typeof durationLike}`
            );
        }
    }

    /**
     * Create a Duration from an ISO 8601 duration string.
     * @param {string} text - text to parse
     * @param {Object} opts - options for parsing
     * @param {string} [opts.locale='en-US'] - the locale to use
     * @param {string} opts.numberingSystem - the numbering system to use
     * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
     * @param {string} [opts.matrix=Object] - the preset conversion system to use
     * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
     * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
     * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
     * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
     * @return {Duration}
     */
    static fromISO(text: string, opts?: DurationOptions): Duration {
        const [parsed] = parseISODuration(text);
        if (parsed) {
            return Duration.fromObject(parsed, opts);
        }
        else {
            return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
        }
    }

    /**
     * Create a Duration from an ISO 8601 time string.
     * @param {string} text - text to parse
     * @param {Object} opts - options for parsing
     * @param {string} [opts.locale='en-US'] - the locale to use
     * @param {string} opts.numberingSystem - the numbering system to use
     * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
     * @param {string} [opts.matrix=Object] - the conversion system to use
     * @see https://en.wikipedia.org/wiki/ISO_8601#Times
     * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
     * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
     * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
     * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
     * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
     * @return {Duration}
     */
    static fromISOTime(text: string, opts: DurationOptions = {}): Duration {
        const [parsed] = parseISOTimeOnly(text);
        if (parsed) {
            return Duration.fromObject(parsed, opts);
        }
        else {
            return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
        }
    }

    /**
     * Create Duration from a number of milliseconds.
     * @param {number} milliseconds of milliseconds
     * @param {Object} opts - options for parsing
     * @param {string} [opts.locale='en-US'] - the locale to use
     * @param {string} opts.numberingSystem - the numbering system to use
     * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
     * @return {Duration}
     */
    static fromMillis(milliseconds: number, opts: DurationOptions = {}): Duration {
        return Duration.fromObject({ milliseconds }, opts);
    }

    /**
     * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
     * If this object is empty then a zero milliseconds duration is returned.
     * @param {Object} obj - the object to create the DateTime from
     * @param {number} obj.years
     * @param {number} obj.quarters
     * @param {number} obj.months
     * @param {number} obj.weeks
     * @param {number} obj.days
     * @param {number} obj.hours
     * @param {number} obj.minutes
     * @param {number} obj.seconds
     * @param {number} obj.milliseconds
     * @param {Object} [opts=[]] - options for creating this Duration
     * @param {string} [opts.locale='en-US'] - the locale to use
     * @param {string} opts.numberingSystem - the numbering system to use
     * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
     * @param {string} [opts.matrix=Object] - the custom conversion system to use
     * @return {Duration}
     */
    static fromObject(obj: UnparsedDurationObject | null, opts: DurationOptions = {}): Duration {
        if (obj == null || typeof obj !== "object") {
            throw new InvalidArgumentError(
                `Duration.fromObject: argument expected to be an object, got ${
                    obj === null ? "null" : typeof obj
                }`
            );
        }

        return new Duration({
            values: normalizeObject(obj as Record<string, any>, Duration.normalizeUnit),
            loc: Locale.fromObject(opts),
            conversionAccuracy: opts.conversionAccuracy,
            matrix: opts.matrix
        });
    }

    /**
     * Create an invalid Duration.
     * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
     * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
     * @return {Duration}
     */
    static invalid(reason: Invalid | string, explanation?: string): Duration {
        if (!reason) {
            throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
        }

        const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

        if (Settings.throwOnInvalid) {
            throw new InvalidDurationError(invalid);
        }
        else {
            return new Duration({ invalid });
        }
    }

    /**
     * Check if an object is a Duration. Works across context boundaries
     * @param {Object} o
     * @return {boolean}
     */
    static isDuration(o: unknown): o is Duration {
        return (!!o && (o as Duration)._isLuxonDuration) || false;
    }

    /**
     * @private
     */
    static normalizeUnit(unit: string): keyof NormalizedDurationObject {
        const normalized: NormalizedDurationUnit = {
            year: "years",
            years: "years",
            quarter: "quarters",
            quarters: "quarters",
            month: "months",
            months: "months",
            localWeekNumber: "localWeekNumbers",
            localWeekYear: "localWeekYears",
            localWeekday: "localWeekdays",
            localWeekNumbers: "localWeekNumbers",
            localWeekYears: "localWeekYears",
            localWeekdays: "localWeekdays",
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
        }[unit as DurationUnit] as NormalizedDurationUnit;

        if (!normalized) {
            throw new InvalidUnitError(unit);
        }

        return normalized;
    }

    // PUBLIC INSTANCE

    /**
     * Returns a string representation of this Duration appropriate for the REPL.
     * @return {string}
     */
    [Symbol.for("nodejs.util.inspect.custom")](): string {
        if (this.isValid) {
            return `Duration { values: ${JSON.stringify(this._values)} }`;
        } else {
            return `Duration { Invalid, reason: ${this.invalidReason} }`;
        }
    }


    /**
     * Return the length of the duration in the specified unit.
     * @param {string} unit - a unit such as 'minutes' or 'days'
     * @example Duration.fromObject({years: 1}).as('days') //=> 365
     * @example Duration.fromObject({years: 1}).as('months') //=> 12
     * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
     * @return {number}
     */
    as(unit: DurationUnit): number {
        return this.shiftTo(unit).get(unit);
    }

    /**
     * Equality check
     * Two Durations are equal iff they have the same units and the same values for each unit.
     * @param {Duration} other
     * @return {boolean}
     */
    equals(other: Duration): boolean {
        if (!this.isValid || !other.isValid) {
            return false;
        }

        if (!this._loc.equals(other._loc)) {
            return false;
        }

        for (const u of
            ORDERED_UNITS) {
            if (!eq(this._values[u], other._values[u])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the value of unit.
     * @param {string} unit - a unit such as 'minute' or 'day'
     * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
     * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
     * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
     * @return {number}
     */
    get(unit: DurationUnit): number {
        return (this as NormalizedDurationObject)[Duration.normalizeUnit(unit)];
    }

    /**
     * Returns the max unit in the duration, forcing the shifting to the max possible.
     * Forcing solves having bigger units at 0, when creating with a smaller unit.
     * Es. Duration.fromMillis(4945676146971854)
     * By default it uses all the units, but a flag can be passed to use only Human duration units (all except quarters and weeks)
     * @param onlyHuman - Choose if using ORDERED_UNITS (default) or HUMAN_ORDERED_UNITS
     * @example
     * ```js
     * var dur = Duration.fromObject({ minutes: 61 })
     * dur.getMaxUnit() //=> 'hours'
     * ```
     */
    getMaxUnit(onlyHuman: false): NormalizedDurationUnit;
    getMaxUnit(onlyHuman: true): NormalizedHumanDurationUnit;
    getMaxUnit(onlyHuman: boolean = !1): NormalizedDurationUnit | NormalizedHumanDurationUnit {
        const refUnits = onlyHuman ? HUMAN_ORDERED_UNITS : ORDERED_UNITS;
        const val: NormalizedDurationObject = this.shiftTo(...refUnits).toObject();

        return refUnits.find((k: NormalizedDurationUnit) => (val[k] || 0) > 0) || REVERSE_ORDERED_UNITS[0];
    }

    /**
     * Scale this Duration by the specified amount. Return a newly-constructed Duration.
     * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
     * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
     * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
     * @return {Duration}
     */
    mapUnits(fn: (x: number, unit: DurationUnit) => number): Duration {
        if (!this.isValid) {
            return this;
        }
        const result: NormalizedDurationObject = {};

        (Object.keys(this._values) as NormalizedDurationUnit[]).forEach((unit: NormalizedDurationUnit) => {
            result[unit] = asNumber(fn(this._values[unit] as number, unit));
        });

        return this._clone(this, { values: result }, true);
    }

    /**
     * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
     * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
     * @return {Duration}
     */
    minus(duration: DurationLike): Duration {
        if (!this.isValid) {
            return this;
        }
        const dur = Duration.fromDurationLike(duration);
        return this.plus(dur.negate());
    }

    /**
     * Return the negative of this Duration.
     * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
     * @return {Duration}
     */
    negate(): Duration {
        if (!this.isValid) {
            return this;
        }
        const negated: NormalizedDurationObject = {};
        (Object.keys(this._values) as NormalizedDurationUnit[]).forEach((unit: NormalizedDurationUnit) => {
            negated[unit] = this._values[unit] === 0 ? 0 : -(this._values[unit] as number);
        });

        return this._clone(this, { values: negated }, true);
    }

    /**
     * Reduce this Duration to its canonical representation in its current units.
     * Assuming the overall value of the Duration is positive, this means:
     * - excessive values for lower-order units are converted to higher order units (if possible, see first and second example)
     * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
     *   the overall value would be negative, see third example)
     *
     * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
     * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
     * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
     * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
     * @return {Duration}
     */
    normalize(): Duration {
        if (!this.isValid) {
            return this;
        }
        const vals = this.toObject();
        normalizeValues(this._matrix, vals);
        return this._clone(this, { values: vals }, !0);
    }

    /**
     * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
     * @param {Duration|Object} duration - The amount to add. Either a Luxon Duration or the object argument to Duration.fromObject()
     * @return {Duration}
     */

    plus(duration: DurationLike): Duration {
        if (!this.isValid) {
            return this;
        }

        const dur = Duration.fromDurationLike(duration),
            result: NormalizedDurationObject = {};

        ORDERED_UNITS.forEach(unit => {
            if (dur._values[unit] !== undefined || this._values[unit] !== undefined) {
                result[unit] = dur.get(unit) + this.get(unit);
            }
        });

        return this._clone(this, { values: result }, !0);
    }

    /**
     * "Set" the locale and/or numberingSystem and/or conversionAccuracy. Returns a newly-constructed Duration.
     * @example dur.reconfigure({ locale: 'en-GB' })
     * @return {Duration}
     */
    reconfigure({ locale, numberingSystem, conversionAccuracy, matrix }: DurationOptions = {}): Duration {
        const loc = this._loc.clone({ locale, numberingSystem });
        const opts: Config = { loc, matrix, conversionAccuracy };

        return this._clone(this, opts);
    }

    /**
     * Rescale units to its largest representation
     * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
     * @return {Duration}
     */
    rescale(): Duration {
        if (!this.isValid) {
            return this;
        }
        const vals = removeZeroes(this.normalize().shiftToAll().toObject());
        return this._clone(this, { values: vals }, true);
    }

    /**
     * "Set" the values of specified units. Non-specified units stay unchanged. Return a newly-constructed Duration.
     * @param {Object} values - a mapping of units to numbers
     * @example dur.set({ years: 2017 })
     * @example dur.set({ hours: 8, minutes: 30 })
     * @return {Duration}
     */
    set(values: DurationObject): Duration {
        if (!this.isValid) {
            return this;
        }
        const mixed = {
            ...this._values,
            ...normalizeObject(values as Record<string, number>, Duration.normalizeUnit)
        };

        return this._clone(this, { values: mixed });
    }

    /**
     * Convert this Duration into its representation in a different set of units.
     * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
     * @return {Duration}
     */
    shiftTo(...units: DurationUnit[]): Duration {
        if (!this.isValid || units.length === 0) {
            return this;
        }

        units = units.map((u: DurationUnit) => Duration.normalizeUnit(u));

        const built: NormalizedDurationObject = {},
            accumulated: NormalizedDurationObject = {},
            vals: DurationObject = this.toObject();
        let lastUnit: NormalizedDurationUnit;

        ORDERED_UNITS.forEach((k: NormalizedDurationUnit) => {
            if (units.indexOf(k) >= 0) {
                lastUnit = k;

                let own = 0;

                Object.keys(accumulated).forEach((ak: string) => {
                    own += (this._matrix[ak as ConversionMatrixUnit][k] as number) * (accumulated[ak as NormalizedDurationUnit] as number);
                    accumulated[ak as NormalizedDurationUnit] = 0;
                });

                // plus anything that's already in this unit
                if (isNumber(vals[k])) {
                    own += vals[k] as number;
                }

                const i = Math.trunc(own);
                built[k] = i;
                accumulated[k] = (own * 1000 - i * 1000) / 1000;

                // otherwise, keep it in the wings to boil it later
            }
            else if (isNumber(vals[k])) {
                accumulated[k] = vals[k];
            }
        });

        // anything leftover becomes the decimal for the last unit
        // lastUnit must be defined since units is not empty
        Object.keys(accumulated).forEach((key: string) => {
            const v = accumulated[key as NormalizedDurationUnit] as number;
            if (v !== 0) {
                (built[lastUnit] as number) +=
                    key === lastUnit ? v : v / (this._matrix[lastUnit as ConversionMatrixUnit][key as NormalizedDurationUnit] as number);
            }
        });

        return this._clone(this, { values: built }, true).normalize();
    }


    /**
     * Shift this Duration to all available units.
     * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
     * @return {Duration}
     */
    shiftToAll(): Duration {
        if (!this.isValid) {
            return this;
        }

        return this.shiftTo(
            "years",
            "months",
            "weeks",
            "days",
            "hours",
            "minutes",
            "seconds",
            "milliseconds"
        );
    }

    /**
     * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
     * * `S` for milliseconds
     * * `s` for seconds
     * * `m` for minutes
     * * `h` for hours
     * * `d` for days
     * * `w` for weeks
     * * `M` for months
     * * `y` for years
     * Notes:
     * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
     * * Tokens can be escaped by wrapping with single quotes.
     * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations' conversion accuracy setting.
     * @param {string} fmt - the format string
     * @param {Object} opts - options
     * @param {boolean} [opts.floor=true] - floor numerical values
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
     * @return {string}
     */
    toFormat(fmt: string, opts: DurationToFormatOptions = { floor: true }): string {
        // reverse-compat since 1.2; we always round down now, never up, and we do it by default
        const fmtOpts = {
            ...opts,
            floor: opts.round !== false && opts.floor !== false
        };

        return this.isValid
            ? Formatter.create(this._loc, fmtOpts).formatDurationFromString(this, fmt)
            : Duration._INVALID;
    }

    /**
     * Returns a string representation of a Duration with all units included.
     * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
     * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
     * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
     * @example
     * ```js
     * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
     * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
     * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
     * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
     * ```
     */
    toHuman(opts: Intl.NumberFormatOptions & DurationToHumanOptions = {}): string {
        if (!this.isValid) {
            return Duration._INVALID;
        }
        const maxUnit: NormalizedHumanDurationUnit = this.getMaxUnit(!0);
        const refUnits = !!opts.onlyHumanUnits ? HUMAN_ORDERED_UNITS : ORDERED_UNITS;
        const shifted = this.shiftTo(...refUnits.slice(refUnits.indexOf(maxUnit)));
        const shiftedValues = shifted.toObject();
        const l = refUnits
            .map((unit: NormalizedDurationUnit) => {
                const val = shiftedValues[unit];
                if (isUndefined(val) || val === 0) {
                    return null;
                }
                return this._loc
                           .numberFormatter({ style: "unit", unitDisplay: "long", ...opts, unit: unit.slice(0, -1) })
                           .format(val);
            })
            .filter((n) => n);

        const mergedOpts = {
            type: "conjunction",
            style: opts.listStyle || "narrow", ...opts
        } as Intl.ListFormatOptions;

        return this._loc
                   .listFormatter(mergedOpts)
                   .format(l);
    }

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
    toISO(): string | null {
        // we could use the formatter, but this is an easier way to get the minimum string
        if (!this.isValid) {
            return null;
        }
        let s = "P";
        if (this.years !== 0) {
            s += this.years + "Y";
        }
        if (this.months !== 0 || this.quarters !== 0) {
            s += this.months + this.quarters * 3 + "M";
        }
        if (this.weeks !== 0) {
            s += this.weeks + "W";
        }
        if (this.days !== 0) {
            s += this.days + "D";
        }
        if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) {
            s += "T";
        }
        if (this.hours !== 0) {
            s += this.hours + "H";
        }
        if (this.minutes !== 0) {
            s += this.minutes + "M";
        }
        if (this.seconds !== 0 || this.milliseconds !== 0) {
            // this will handle "floating point madness" by removing extra decimal places
            // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
            s += roundTo(this.seconds + this.milliseconds / 1000, 3) + "S";
        }
        if (s === "P") {
            s += "T0S";
        }
        return s;
    }

    /**
     * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
     * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
     * @see https://en.wikipedia.org/wiki/ISO_8601#Times
     * @param {Object} opts - options
     * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
     * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
     * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
     * @param {string} [opts.format='extended'] - choose between the basic and extended format
     * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
     * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
     * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
     * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
     * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
     * @return {string}
     */
    toISOTime(opts: ToISOTimeOptions = {}): string | null {
        if (!this.isValid) {
            return null;
        }

        const millis = this.toMillis();
        if (millis < 0 || millis >= 86400000) {
            return null;
        }

        opts = {
            suppressMilliseconds: false,
            suppressSeconds: false,
            includePrefix: false,
            format: "extended",
            ...opts,
            includeOffset: false
        };

        const dateTime = DateTime.fromMillis(millis, { zone: "UTC" });

        return dateTime.toISOTime(opts);
    }

    /**
     * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
     * @return {string}
     */
    toJSON(): string | null {
        return this.toISO();
    }

    /**
     * Returns the value of this Duration in milliseconds.
     * @return {number}
     */
    toMillis(): number {
        if (!this.isValid) {
            return NaN;
        }

        return durationToMillis(this.matrix, this._values);
    }

    /**
     * Returns a JavaScript object with this Duration's values.
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
     * @return {Object}
     */
    toObject(): DurationObject & Partial<DurationOptions> {
        if (!this.isValid) {
            return {};
        }

        return {
            ...this._values
        };
    }

    /**
     * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
     * @return {string}
     */
    toString(): string | null {
        return this.toISO();
    }

    /**
     * Returns a milliseconds value of this Duration. Alias of {@link toMillis}
     * @return {number}
     */
    valueOf(): number {
        return this.toMillis();
    }

    /**
     * @private
     */
    // clone really means "create another instance just like this one, but with these changes"
    private _clone(dur: Duration, alts: Config, clear = false): Duration {
        // deep merge for vals
        const conf = {
            values: clear ? alts.values : { ...dur._values, ...(alts.values || {}) },
            loc: dur._loc.clone(alts.loc),
            conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
            matrix: alts.matrix || dur.matrix
        };
        return new Duration(conf);
    }

}

export type DurationLike = Duration | UnparsedDurationObject;
