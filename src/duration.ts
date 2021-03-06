import { asNumber, isUndefined, isNumber, normalizeObject, roundTo } from "./impl/util";
import { Locale } from "./impl/locale";
import { Formatter } from "./impl/formatter";
import { parseISODuration, parseISOTimeOnly } from "./impl/regexParser";
import { InvalidArgumentError, InvalidDurationError, InvalidUnitError } from "./errors";
import {
  DurationObject,
  DurationOptions,
  DurationToFormatOptions,
  DurationUnit
} from "./types/duration";
import { ConversionAccuracy, ThrowOnInvalid } from "./types/common";
import { Settings } from "./settings";
import { Invalid } from "./types/invalid";
import { NumberingSystem } from "./types/locale";
import { ToISOTimeOptions } from "./types/datetime";

interface NormalizedDurationObject {
  years?: number;
  quarters?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

type NormalizedDurationUnit = keyof NormalizedDurationObject;

type ConversionMatrixUnit = Exclude<NormalizedDurationUnit, "milliseconds">;
type ConversionMatrix = Readonly<{ [keya in ConversionMatrixUnit]: { [keyb in NormalizedDurationUnit]?: number } }>;

const INVALID = "Invalid Duration";

// unit conversion constants
const lowOrderMatrix = {
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
  },
  casualMatrix: ConversionMatrix = Object.assign(
    {
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
    },
    lowOrderMatrix
  ),
  daysInYearAccurate = 146097.0 / 400,
  daysInMonthAccurate = 146097.0 / 4800,
  accurateMatrix: ConversionMatrix = Object.assign(
    {
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
    },
    lowOrderMatrix
  );

// units ordered by size
const orderedUnits: NormalizedDurationUnit[] = [
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

const reverseUnits = orderedUnits.slice(0).reverse();

function antiTrunc(n: number) {
  return n < 0 ? Math.floor(n) : Math.ceil(n);
}

// NB: mutates parameters
function convert(matrix: ConversionMatrix,
                 fromMap: NormalizedDurationObject,
                 fromUnit: NormalizedDurationUnit,
                 toMap: NormalizedDurationObject,
                 toUnit: ConversionMatrixUnit) {
  const conv = matrix[toUnit][fromUnit] as number,
    raw = (fromMap[fromUnit] as number) / conv,
    sameSign = Math.sign(raw) === Math.sign(toMap[toUnit] as number),
    // ok, so this is wild, but see the matrix in the tests
    added =
      !sameSign && toMap[toUnit] !== 0 && Math.abs(raw) <= 1 ? antiTrunc(raw) : Math.trunc(raw);

  toMap[toUnit] = (toMap[toUnit] as number) + added;
  fromMap[fromUnit] = (fromMap[fromUnit] as number) - added * conv;
}

function eq(v1: number | undefined, v2: number | undefined) {
  // Consider 0 and undefined as equal
  if (v1 === undefined || v1 === 0) {
    return v2 === undefined || v2 === 0;
  }
  return v1 === v2;
}

// NB: mutates vals parameters
function normalizeValues(matrix: ConversionMatrix, vals: NormalizedDurationObject) {
  let previousUnit: NormalizedDurationUnit | undefined;
  reverseUnits.forEach(unit => {
    if (!isUndefined(vals[unit])) {
      if (previousUnit) {
        convert(matrix, vals, previousUnit, vals, unit as ConversionMatrixUnit);
      }
      previousUnit = unit;
    }
  });
}

interface Config {
  conversionAccuracy?: ConversionAccuracy;
  invalid?: Invalid;
  values?: NormalizedDurationObject;
  loc?: Locale;
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
export class Duration implements NormalizedDurationObject {

  /**
   * Returns the conversion system to use
   * @type {ConversionAccuracy}
   */
  get conversionAccuracy(): ConversionAccuracy {
    return this._conversionAccuracy;
  }

  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this._invalid ? this._invalid.explanation : null;
  }

  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this._invalid ? this._invalid.reason : null;
  }

  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
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
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {NumberingSystem}
   */
  get numberingSystem(): NumberingSystem | void {
    return this.isValid ? this._loc.numberingSystem : void 0;
  }

  // Private readonly fields
  private readonly _conversionAccuracy: ConversionAccuracy;
  private readonly _invalid: Invalid | null;
  private readonly _values: NormalizedDurationObject;
  private _loc: Locale;
  private readonly _matrix: ConversionMatrix;
  private readonly _isLuxonDuration: true;

  /**
   * @private
   */
  private constructor(config: Config) {
    const accurate = config.conversionAccuracy === "longterm" || false;
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
    this._conversionAccuracy = accurate ? "longterm" : "casual";
    /**
     * @access private
     */
    this._invalid = config.invalid || null;
    /**
     * @access private
     */
    this._matrix = accurate ? accurateMatrix : casualMatrix;
    /**
     * @access private
     */
    this._isLuxonDuration = true;
  }


  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(text: string, opts: DurationOptions & ThrowOnInvalid = {}) {
    const [parsed] = parseISOTimeOnly(text);
    if (parsed) {
      return Duration.fromObject({
        ...parsed,
        ...opts
      });
    }
    else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }

  static fromMillis(count: number): Duration;
  static fromMillis(count: number, opts: DurationOptions & ThrowOnInvalid): Duration;
  static fromMillis(count: number, opts: DurationOptions): Duration | null;
  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(count: number, opts: DurationOptions = {}) {
    return Duration.fromObject(Object.assign({ milliseconds: count }, opts));
  }

  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours.
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
   * @param {string} [obj.locale='en-US'] - the locale to use
   * @param {string} obj.numberingSystem - the numbering system to use
   * @param {string} [obj.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromObject(obj: (DurationObject & DurationOptions & ThrowOnInvalid) | null): Duration {
    if (obj == null || typeof obj !== "object") {
      throw new InvalidArgumentError(
        `Duration.fromObject: argument expected to be an object, got ${
          obj === null ? "null" : typeof obj
        }`
      );
    }
    return new Duration({
      values: normalizeObject(obj as Record<string, any>, Duration.normalizeUnit, [
        "locale",
        "numberingSystem",
        "conversionAccuracy",
        "zone" // a bit of debt; it's super inconvenient internally not to be able to blindly pass this
      ]),
      loc: Locale.fromObject(obj),
      conversionAccuracy: obj.conversionAccuracy
    });
  }

  static fromISO(text: string): Duration;
  static fromISO(text: string, opts: DurationOptions & ThrowOnInvalid): Duration;
  static fromISO(text: string, opts: DurationOptions): Duration | null;
  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(text: string, opts: DurationOptions & ThrowOnInvalid = {}) {
    const [parsed] = parseISODuration(text);
    if (parsed) {
      const obj = Object.assign(parsed, opts);
      return Duration.fromObject(obj);
    }
    else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }


  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {Object} o
   * @return {boolean}
   */
  static isDuration(o: unknown): o is Duration {
    return (o && (o as Duration)._isLuxonDuration) || false;
  }


  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(reason: Invalid | string, explanation?: string) {
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
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */
  toFormat(fmt: string, opts: DurationToFormatOptions = { floor: true }) {
    // reverse-compat since 1.2; we always round down now, never up, and we do it by default
    const fmtOpts = Object.assign({}, opts, {
      floor: opts.round !== false && opts.floor !== false
    });
    return this.isValid
      ? Formatter.create(this._loc, fmtOpts).formatDurationFromString(this, fmt)
      : INVALID;
  }

  /**
   * Returns a JavaScript object with this Duration's values.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject(opts: { includeConfig: boolean } = { includeConfig: !1 }): DurationObject & Partial<DurationOptions> {
    if (!this.isValid) {
      return {};
    }

    const base = Object.assign({}, this._values) as DurationObject & Partial<DurationOptions>;

    if (opts.includeConfig) {
      base.conversionAccuracy = this.conversionAccuracy;
      base.numberingSystem = this._loc.numberingSystem;
      base.locale = this._loc.locale;
    }

    return base;
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
  toISO() {
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
  toISOTime(opts: ToISOTimeOptions = {}) {
    if (!this.isValid) {
      return null;
    }

    const millis = this.toMillis();
    if (millis < 0 || millis >= 86400000) {
      return null;
    }

    opts = Object.assign(
      {
        suppressMilliseconds: false,
        suppressSeconds: false,
        includePrefix: false,
        format: "extended"
      },
      opts
    );

    const value = this.shiftTo("hours", "minutes", "seconds", "milliseconds");

    let fmt = opts.format === "basic" ? "hhmm" : "hh:mm";

    if (!opts.suppressSeconds || value.seconds !== 0 || value.milliseconds !== 0) {
      fmt += opts.format === "basic" ? "ss" : ":ss";
      if (!opts.suppressMilliseconds || value.milliseconds !== 0) {
        fmt += ".SSS";
      }
    }

    let str = value.toFormat(fmt);

    if (opts.includePrefix) {
      str = "T" + str;
    }

    return str;
  }

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }

  /**
   * Returns a milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    return this.as("milliseconds");
  }

  /**
   * Returns a milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
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

    const dur = friendlyDuration(duration),
      result: NormalizedDurationObject = {};

    orderedUnits.forEach(unit => {
      if (dur._values[unit] !== undefined || this._values[unit] !== undefined) {
        result[unit] = dur.get(unit) + this.get(unit);
      }
    });

    return this._clone(this, { _values: result }, !0);
  }

  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object} duration - The amount to subtract. Either a Luxon Duration or the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(duration: DurationLike) {
    if (!this.isValid) {
      return this;
    }
    const dur = friendlyDuration(duration);
    return this.plus(dur.negate());
  }

  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnit((x, u) => u === "hour" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
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

    return this._clone(this, { _values: result }, true);
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
    return this[Duration.normalizeUnit(unit)];
  }

  /**
   * "Set" the values of specified units. Non-specified units stay unchanged. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(values: DurationObject) {
    if (!this.isValid) {
      return this;
    }

    const mixed = Object.assign(
      this._values,
      normalizeObject(values as Record<string, number>, Duration.normalizeUnit)
    );
    return this._clone(this, { _values: mixed });
  }

  /**
   * "Set" the locale and/or numberingSystem and/or conversionAccuracy. Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({ locale, numberingSystem, conversionAccuracy }: DurationOptions = {}): Duration {
    const conf = {
      values: this._values,
      loc: this._loc.clone({ locale, numberingSystem }),
      conversionAccuracy: conversionAccuracy || this._conversionAccuracy
    };
    return new Duration(conf);
  }

  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(unit: DurationUnit) {
    return this.shiftTo(unit).get(unit);
  }

  /**
   * Reduce this Duration to its canonical representation in its current units.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) {
      return this;
    }
    const vals = this.toObject();
    normalizeValues(this._matrix, vals);
    return this._clone(this, { _values: vals }, !0);
  }

  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...units: DurationUnit[]) {
    if (!this.isValid || units.length === 0) {
      return this;
    }

    units = units.map(u => Duration.normalizeUnit(u));

    const built: NormalizedDurationObject = {},
      accumulated: NormalizedDurationObject = {},
      vals: DurationObject = this.toObject();
    let lastUnit: NormalizedDurationUnit;

    orderedUnits.forEach((k: NormalizedDurationUnit) => {
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
        accumulated[k] = own - i; // we'd like to absorb these fractions in another unit

        // plus anything further down the chain that should be rolled up in to this
        // for (const down in vals) {
        Object.keys(vals).forEach((down: string) => {
          if (orderedUnits.indexOf(down as NormalizedDurationUnit) > orderedUnits.indexOf(k)) {
            convert(this._matrix, vals, down as NormalizedDurationUnit, built, k as ConversionMatrixUnit);
          }
        });
        // }
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

    return this._clone(this, { _values: built }, true).normalize();
  }

  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) {
      return this;
    }
    const negated: NormalizedDurationObject = {};
    (Object.keys(this._values) as NormalizedDurationUnit[]).forEach((unit: NormalizedDurationUnit) => {
      negated[unit] = -(this._values[unit] as number);
    });

    return this._clone(this, { _values: negated }, true);
  }

  /**
   * Get the years.
   * @type {number}
   */
  get years(): number {
    return this.isValid ? this._values.years || 0 : NaN;
  }

  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this._values.quarters || 0 : NaN;
  }

  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this._values.months || 0 : NaN;
  }

  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this._values.weeks || 0 : NaN;
  }

  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this._values.days || 0 : NaN;
  }

  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this._values.hours || 0 : NaN;
  }

  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this._values.minutes || 0 : NaN;
  }

  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this._values.seconds || 0 : NaN;
  }

  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this._values.milliseconds || 0 : NaN;
  }

  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(other: Duration) {
    if (!this._loc.equals(other._loc)) {
      return false;
    }

    for (const u of orderedUnits) {
      if (!eq(this._values[u], other._values[u])) {
        return false;
      }
    }

    return true;
  }

  /**
   * @private
   */
  // clone really means "create another instance just like this one, but with these changes"
  private _clone(dur: Duration, alts: { _values: NormalizedDurationObject, _loc?: Locale, conversionAccuracy?: ConversionAccuracy }, clear = true): Duration {
    // deep merge for vals
    const conf = {
      values: clear ? alts._values : Object.assign({}, dur._values, alts._values || {}),
      loc: dur._loc.clone({
        locale: alts._loc?.locale
      }),
      conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy
    };
    return new Duration(conf);
  }

}

export type DurationLike = Duration | DurationObject;

/**
 * @private
 */
export function friendlyDuration(durationish: DurationLike | number): Duration {
  if (isNumber(durationish)) {
    return Duration.fromMillis(durationish);
  }
  else if (Duration.isDuration(durationish)) {
    return durationish;
  }
  else if (typeof durationish === "object") {
    return Duration.fromObject(durationish) as Duration;
  }
  else {
    throw new InvalidArgumentError(`Unknown duration argument ${durationish} of type ${typeof durationish}`);
  }
}
