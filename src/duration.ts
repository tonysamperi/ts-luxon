import {
    asNumber,
    isUndefined,
    isNumber,
    normalizeObject,
    roundTo,
    snapFloatingPoint,
    ORDERED_UNITS,
    REVERSE_ORDERED_UNITS,
    HUMAN_ORDERED_UNITS
} from "./impl/util.js";
import {Locale} from "./impl/locale.js";
import {Formatter} from "./impl/formatter.js";
import {parseISODuration, parseISOTimeOnly} from "./impl/regexParser.js";
import {InvalidArgumentError, InvalidDurationError, InvalidUnitError} from "./errors.js";
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
} from "./types/duration.js";
import {ConversionAccuracy} from "./types/common.js";
import {Settings} from "./settings.js";
import {Invalid} from "./types/invalid.js";
import {NumberingSystem} from "./types/locale.js";
import {DateTime} from "./datetime.js";
import {ToISOTimeOptions} from "./types/datetime.js";

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
    hours: {minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1000},
    minutes: {seconds: 60, milliseconds: 60 * 1000},
    seconds: {milliseconds: 1000}
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

// Remove all properties with a value of 0 from an object
function removeZeroes(vals: DurationObject = {}): DurationObject {
    return Object.entries(vals).reduce((acc, [key, value]) => {
        if (value !== 0) {
            acc[key as DurationUnit] = value;
        }

        return acc;
    }, {} as DurationObject);
}

// Render a number for toISO(). JS prints very small magnitudes in exponential
// notation (e.g. `1e-7`), which is not valid ISO 8601 and which fromISO() cannot
// parse, so expand those to a plain decimal. (toFixed keeps exponential notation
// for magnitudes >= 1e21, so very large durations are left untouched here.)
function toISONumber(value: number) {
    const str = `${value}`;

    return str.includes("e") ? value.toFixed(20).replace(/\.?0+$/, "") : str;
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
        return Duration.fromObject({milliseconds}, opts);
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
            return new Duration({invalid});
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
        }
        else {
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

        return this._clone(this, {values: result}, true);
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

        return this._clone(this, {values: negated}, true);
    }

    /**
     * Reduce this Duration to its canonical representation in its current units.
     * This is equivalent to `this.shiftTo()`.
     * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
     * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
     * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
     * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
     * @return {Duration}
     */
    normalize() {
        if (!this.isValid) {
            return this;
        }
        return this.shiftTo();
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

        return this._clone(this, {values: result}, !0);
    }

    /**
     * "Set" the locale and/or numberingSystem and/or conversionAccuracy. Returns a newly-constructed Duration.
     * @example dur.reconfigure({ locale: 'en-GB' })
     * @return {Duration}
     */
    reconfigure({locale, numberingSystem, conversionAccuracy, matrix}: DurationOptions = {}): Duration {
        const loc = this._loc.clone({locale, numberingSystem});
        const opts: Config = {loc, matrix, conversionAccuracy};

        return this._clone(this, opts);
    }

    /**
     * Removes all units with values equal to 0 from this Duration.
     * @example Duration.fromObject({ years: 2, days: 0, hours: 0, minutes: 0 }).removeZeros().toObject() //=> { years: 2 }
     * @return {Duration}
     */
    removeZeroes() {
        if (!this.isValid) {
            return this;
        }
        const vals = removeZeroes(this._values);

        return this._clone(this, {values: vals}, true);
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
        const vals = removeZeroes(this.shiftToAll().toObject());
        return this._clone(this, {values: vals}, true);
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

        return this._clone(this, {values: mixed});
    }

    /**
     * Convert this Duration into its representation in a different set of units.
     * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
     * @return {Duration}
     */
    shiftTo(...units: DurationUnit[]): Duration {
        if (!this.isValid) {
            return this;
        }

        if (units.length === 0) {
            units = Object.keys(this._values) as (keyof NormalizedDurationObject)[];
        }
        else {
            units = units.map((u) => Duration.normalizeUnit(u));
        }

        // built is the final result, accumulated is our "working copy" of things still to do
        const built: NormalizedDurationObject = {},
            accumulated: NormalizedDurationObject = this.toObject();

        // Pass 1: Build up the target units largest to smallest.
        //         Units grab as many whole units (e.g., grab "1 year" from "370 days") as they can from anything
        //         still left in "accumulated".
        //         Additionally, we accumulate the entire Duration in the smallest unit to determine
        //         the overall sign of the target Duration.
        let lastUnit: ConversionMatrixUnit | NormalizedDurationUnit;
        let lastUnitTotal = 0;
        for (let i = 0; i < ORDERED_UNITS.length; i++) {
            const k = ORDERED_UNITS[i];
            if (units.includes(k)) {
                if (lastUnit) {
                    // make sure lastUnitTotal stays in the correct unit
                    lastUnitTotal *= this.matrix[lastUnit as ConversionMatrixUnit][k];
                }
                lastUnit = k;

                let own = 0;
                // Grab as much as we can from "accumulated" into this unit.
                for (const ak in accumulated) {
                    const av = accumulated[ak as NormalizedDurationUnit];
                    if (ak === k) {
                        own += av;
                    }
                    else if (i > ORDERED_UNITS.indexOf(ak as NormalizedDurationUnit)) {
                        // ak is a larger unit than us, meaning whatever we have accumulated for it must not
                        // have fit into any higher unit. We down-convert it to this.
                        const converted = this.matrix[ak as ConversionMatrixUnit][k as NormalizedDurationUnit] * av;
                        own += converted;
                        accumulated[ak as NormalizedDurationUnit] = 0;
                    }
                    else {
                        // ak is a smaller unit than us, grab any overflow from it.
                        // e.g., 125 minutes => 2 hours, 5 minutes
                        const conv = this.matrix[k as ConversionMatrixUnit][ak as NormalizedDurationUnit];
                        const toConvert = Math.trunc(av / conv);
                        accumulated[ak as NormalizedDurationUnit] -= toConvert * conv;
                        own += toConvert;
                    }
                }

                own = snapFloatingPoint(own);
                // only keep the integer part for now in the hopes of putting any decimal part
                // into a smaller unit later
                accumulated[k] = own % 1;
                lastUnitTotal += built[k] = Math.trunc(own);
            }
        }

        // anything leftover gets converted to the last unit
        // lastUnit must be defined since units is not empty
        for (const key in accumulated) {
            if (accumulated[key as NormalizedDurationUnit] !== 0) {
                const toAdd =
                    key === lastUnit ? accumulated[key] : accumulated[key as NormalizedDurationUnit] / this.matrix[lastUnit as ConversionMatrixUnit][key as NormalizedDurationUnit];
                built[lastUnit] += toAdd;
                lastUnitTotal += toAdd;
            }
        }

        // Pass 2: ensure the unit signs are consistent with the overall sign according to lastUnitTotal
        // Do this by "borrowing" from a higher unit.
        // Note that we only work within the target units here to avoid unexpected intermediary conversions.
        const overallSign = Math.sign(lastUnitTotal);
        if (overallSign !== 0) {
            for (let i = 0; i < REVERSE_ORDERED_UNITS.length; i++) {
                const unit = REVERSE_ORDERED_UNITS[i];
                if (unit in built) {
                    const unitValue = built[unit];
                    const unitSign = Math.sign(unitValue);
                    if (unitSign !== 0 && unitSign !== overallSign) {
                        // find the next largest unit that we have and "borrow" from it
                        for (let j = i + 1; j < REVERSE_ORDERED_UNITS.length; j++) {
                            const higherUnit = REVERSE_ORDERED_UNITS[j];
                            if (higherUnit in built) {
                                const conv = this.matrix[higherUnit as ConversionMatrixUnit][unit];
                                // we want to an integer divide by "conv" and round away from zero.
                                // For example: 3 hours, -122 minutes
                                // => -122 / 60 => -3 hours to borrow so that we get 0 hours, 58 minutes
                                // Another example: -3 hours, 122 minutes
                                // => 122 / 60 => 3 hours to borrow so that we get 0 hours, -58 minutes
                                const toBorrow = Math.trunc((unitValue + (conv - 1) * unitSign) / conv);
                                built[higherUnit] += toBorrow;
                                // this may leave a fractional part behind - it will be fixed below
                                built[unit] -= toBorrow * conv;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // Pass 3: ensure any fractional parts created by the sign redistribution above are
        // distributed to lower order units again
        for (let i = 0; i < ORDERED_UNITS.length; i++) {
            const unit = ORDERED_UNITS[i];
            // last unit keeps fractions
            if (unit !== lastUnit && unit in built) {
                const unitValue = built[unit];
                if (!Number.isInteger(unitValue)) {
                    // find the next unit down to convert it into
                    for (let j = i + 1; j < ORDERED_UNITS.length; j++) {
                        const smallerUnit = ORDERED_UNITS[j];
                        if (smallerUnit in built) {
                            const conv = this.matrix[unit as ConversionMatrixUnit][smallerUnit];
                            const unitFrac = unitValue % 1;
                            built[unit] = Math.trunc(unitValue);
                            built[smallerUnit] += unitFrac * conv;
                            break;
                        }
                    }
                }
            }
        }

        // Pass 4: make sure any overflowing units get converted into a higher unit
        for (let i = 0; i < REVERSE_ORDERED_UNITS.length; i++) {
            const unit = REVERSE_ORDERED_UNITS[i];
            if (units.includes(unit)) {
                for (const ak in built) {
                    if (i > REVERSE_ORDERED_UNITS.indexOf(ak as NormalizedDurationUnit)) {
                        // unit is a larger unit than ak
                        // try to up-convert any overflow in "ak"
                        // for example, 61 minutes => 1 hour, 1 minute
                        const conv = this.matrix[unit as ConversionMatrixUnit][ak as NormalizedDurationUnit];
                        const av = built[ak as NormalizedDurationUnit];
                        const toConvert = Math.trunc(av / conv);
                        built[unit] += toConvert;
                        built[ak as NormalizedDurationUnit] -= toConvert * conv;
                    }
                }
            }
        }

        return this._clone(this, {values: built}, !0);
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
     * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
     * Tokens can be escaped by wrapping with single quotes.
     * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations' conversion accuracy setting.
     * @param {string} fmt - the format string
     * @param {Object} opts - options
     * @param {boolean} [opts.floor=true] - floor numerical values
     * @param {"negative"|"all"|"negativeLargestOnly"} [opts.signMode=negative] - How to handle signs
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
     * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
     * @example Duration.fromObject({ days: 6, seconds: 2 }).toFormat("d s", { signMode: "all" }) //=> "+6 +2"
     * @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "all" }) //=> "-6 -2"
     * @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "negativeLargestOnly" }) //=> "-6 2"
     * @return {string}
     */
    toFormat(fmt: string, opts: DurationToFormatOptions = {floor: true}): string {
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
     * @param {boolean} [opts.showZeroes=true] - Show all units previously used by the duration even if they are zero
     * @example
     * ```js
     * var dur = Duration.fromObject({ months: 1, weeks: 0, hours: 5, minutes: 6 })
     * dur.toHuman() //=> '1 month, 0 weeks, 5 hours, 6 minutes'
     * dur.toHuman({ listStyle: "long" }) //=> '1 month, 0 weeks, 5 hours, and 6 minutes'
     * dur.toHuman({ unitDisplay: "short" }) //=> '1 mth, 0 wks, 5 hr, 6 min'
     * dur.toHuman({ showZeros: false }) //=> '1 month, 5 hours, 6 minutes'
     * ```
     */
    toHuman(opts: Intl.NumberFormatOptions & DurationToHumanOptions = {}): string {
        if (!this.isValid) {
            return Duration._INVALID;
        }
        const showZeroes = opts.showZeroes === true;
        const maxUnit: NormalizedHumanDurationUnit = this.getMaxUnit(!0);
        const refUnits = opts.onlyHumanUnits !== false ? HUMAN_ORDERED_UNITS : ORDERED_UNITS;
        const shifted = this.shiftTo(...refUnits.slice(refUnits.indexOf(maxUnit)));
        const shiftedValues = shifted.toObject();
        const l = refUnits
            .map((unit: NormalizedDurationUnit) => {
                const val = shiftedValues[unit];
                if (isUndefined(val) || (val === 0 && !showZeroes)) {
                    return null;
                }
                return this._loc
                    .numberFormatter({style: "unit", unitDisplay: "long", ...opts, unit: unit.slice(0, -1)})
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
            s += toISONumber(this.years) + "Y";
        }
        if (this.months !== 0 || this.quarters !== 0) {
            s += toISONumber(this.months + this.quarters * 3) + "M";
        }
        if (this.weeks !== 0) {
            s += toISONumber(this.weeks) + "W";
        }
        if (this.days !== 0) {
            s += toISONumber(this.days) + "D";
        }
        if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) {
            s += "T";
        }
        if (this.hours !== 0) {
            s += toISONumber(this.hours) + "H";
        }
        if (this.minutes !== 0) {
            s += toISONumber(this.minutes) + "M";
        }
        if (this.seconds !== 0 || this.milliseconds !== 0) {
            // this will handle "floating point madness" by removing extra decimal places
            // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
            s += toISONumber(roundTo(this.seconds + this.milliseconds / 1000, 3)) + "S";
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

        const dateTime = DateTime.fromMillis(millis, {zone: "UTC"});

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
            values: clear ? alts.values : {...dur._values, ...(alts.values || {})},
            loc: dur._loc.clone(alts.loc),
            conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
            matrix: alts.matrix || dur.matrix
        };

        return new Duration(conf);
    }

}

export type DurationLike = Duration | UnparsedDurationObject;

export default Duration;
