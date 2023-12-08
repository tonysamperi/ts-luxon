import { NumberingSystem, LocaleOptions } from "./locale";
import { DateTime } from "../datetime";
import { Zone } from "../zone";
import { FormatToken } from "../impl/formatter";
import { Locale } from "../impl/locale";
import Intl from "./intl-next";

export interface SetZoneOptions {
    keepCalendarTime?: boolean;
    keepLocalTime?: boolean;
}

export interface ToRelativeOptions {
    /** The DateTime to use as the basis to which this time is compared. Defaults to now. */
    base?: DateTime;
    locale?: string;
    /** The Intl system may choose not to honor this */
    numberingSystem?: NumberingSystem;
    /**
     * Padding in milliseconds. This allows you to round up the result if it fits inside the threshold.
     * Don't use in combination with {round: false} because the decimal output will include the padding.
     * Defaults to 0.
     */
    padding?: number;
    /** Defaults to `true`. */
    round?: boolean;
    style?: Intl.RelativeTimeFormatStyle;
    /** If omitted, the method will pick the unit. */
    unit?: Intl.RelativeTimeFormatUnit;
}

export type ToRelativeCalendarUnit = "years" | "quarters" | "months" | "weeks" | "days";

export interface ToRelativeCalendarOptions {
    /** The DateTime to use as the basis to which this time is compared. Defaults to now. */
    base?: DateTime;
    locale?: string;
    /** The Intl system may choose not to honor this. */
    numberingSystem?: NumberingSystem;
    /** If omitted, the method will pick the unit. */
    unit?: ToRelativeCalendarUnit;
}

export interface ToSQLOptions {
    includeOffset?: boolean;
    includeOffsetSpace?: boolean;
    includeZone?: boolean;
}

export type ToISOFormat = "basic" | "extended";

export interface ToISOTimeOptions {
    extendedZone?: boolean;
    format?: ToISOFormat;
    includeOffset?: boolean;
    includePrefix?: boolean;
    suppressMilliseconds?: boolean;
    suppressSeconds?: boolean;
}

export interface DateTimeOptions extends LocaleOptions {
    setZone?: boolean;
    specificOffset?: number;
    zone?: string | Zone;
}

interface BaseObject {
    [key: string]: any;
}

export interface TimeObject {
    hour: number;
    millisecond: number;
    minute: number;
    second: number;
}

export interface GregorianDateTime extends TimeObject {
    day: number;
    month: number;
    year: number;
}

export interface WeekDateTime extends TimeObject {
    weekNumber: number;
    weekYear: number;
    weekday: number;
}

export interface LocalWeekDateTime {
    localWeekNumber: number;
    localWeekYear: number;
    localWeekday: number;
}

export interface OrdinalDateTime extends TimeObject {
    ordinal: number;
    year: number;
}

export type GenericDateTime = Partial<GregorianDateTime & WeekDateTime & OrdinalDateTime & DateTimeOptions>;
export type GenericDateTimeExtended = Partial<GregorianDateTime & WeekDateTime & OrdinalDateTime & DateTimeOptions & LocalWeekDateTime & {
    quarter: number,
    quarters: number
}>;

export interface ExplainedFormat {
    input: string;
    invalidReason?: string;
    matches?: Record<string, string | number>;
    rawMatches?: RegExpMatchArray | null;
    regex?: RegExp;
    result?: GenericDateTime | null;
    specificOffset?: number;
    tokens: FormatToken[];
    zone?: Zone | null;
}

export interface DefaultUnitValues extends BaseObject {
    day: 0 | 1;
    hour: 0 | 1;
    millisecond: 0 | 1;
    minute: 0 | 1;
    month: 0 | 1;
    second: 0 | 1;
    year: 0 | 1;
}

export interface DefaultWeekUnitValues extends BaseObject {
    hour: 0 | 1;
    millisecond: 0 | 1;
    minute: 0 | 1;
    second: 0 | 1;
    weekNumber: 0 | 1;
    weekday: 0 | 1;
}

export interface DefaultOrdinalUnitValues extends BaseObject {
    hour: 0 | 1;
    millisecond: 0 | 1;
    minute: 0 | 1;
    ordinal: 0 | 1;
    second: 0 | 1;
}

export interface InnerBuildObjectConfig {
    containsGregor: boolean;
    containsOrdinal: boolean;
    loc: Locale;
    normalized: { [key: string]: number; };
    obj: Partial<GregorianDateTime & WeekDateTime & OrdinalDateTime>;
    offsetProvis: number;
    useWeekData: number | boolean;
    zoneToUse: Zone;
}

// PLURALS - TODO: UNDERSTAND IF NEEDED

export interface TimeObjectPlurals {
    hours: number;
    milliseconds: number;
    minutes: number;
    seconds: number;
}

export interface GregorianDateTimePlurals extends TimeObjectPlurals {
    days: number;
    months: number;
    years: number;
}

export interface WeekDateTimePlurals extends TimeObjectPlurals {
    weekYears: number;
    weekdays: number;
    weeksNumber: number;
}

export interface LocalWeekDateTimePlurals {
    localWeekNumbers: number;
    localWeekYears: number;
    localWeekdays: number;
}

export interface OrdinalDateTimePlurals extends TimeObjectPlurals {
    ordinal: number;
    years: number;
}

export type GenericDateTimePlurals = Partial<GregorianDateTimePlurals & WeekDateTimePlurals & LocalWeekDateTimePlurals & OrdinalDateTimePlurals & DateTimeOptions>;
