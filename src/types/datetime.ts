import { NumberingSystem, LocaleOptions } from "./locale";
import { DateTime } from "../datetime";
import { Zone } from "../zone";
import { FormatToken } from "../impl/formatter";
import Intl from "./intl-2020";
import { Locale } from "../impl/locale";

export interface SetZoneOptions {
  keepLocalTime?: boolean;
  keepCalendarTime?: boolean;
}

export interface ToRelativeOptions {
  /** The DateTime to use as the basis to which this time is compared. Defaults to now. */
  base?: DateTime;
  locale?: string;
  style?: Intl.RelativeTimeFormatStyle;
  /** If omitted, the method will pick the unit. */
  unit?: Intl.RelativeTimeFormatUnit;
  /** Defaults to `true`. */
  round?: boolean;
  /**
   * Padding in milliseconds. This allows you to round up the result if it fits inside the threshold.
   * Don't use in combination with {round: false} because the decimal output will include the padding.
   * Defaults to 0.
   */
  padding?: number;
  /** The Intl system may choose not to honor this */
  numberingSystem?: NumberingSystem;
}

export type ToRelativeCalendarUnit = "years" | "quarters" | "months" | "weeks" | "days";

export interface ToRelativeCalendarOptions {
  /** The DateTime to use as the basis to which this time is compared. Defaults to now. */
  base?: DateTime;
  locale?: string;
  /** If omitted, the method will pick the unit. */
  unit?: ToRelativeCalendarUnit;
  /** The Intl system may choose not to honor this. */
  numberingSystem?: NumberingSystem;
}

export interface ToSQLOptions {
  includeOffset?: boolean;
  includeZone?: boolean;
}

export type ToISOFormat = "basic" | "extended";

export interface ToISOTimeOptions {
  format?: ToISOFormat;
  includeOffset?: boolean;
  includePrefix?: boolean;
  suppressMilliseconds?: boolean;
  suppressSeconds?: boolean;
}

export interface DateTimeOptions extends LocaleOptions {
  zone?: string | Zone;
}

export interface DateTimeWithZoneOptions extends DateTimeOptions {
  setZone?: boolean;
}

interface BaseObject {
  [key: string]: any;
}

export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface GregorianDateTime extends TimeObject {
  year: number;
  month: number;
  day: number;
}

export interface WeekDateTime extends TimeObject {
  weekYear: number;
  weekNumber: number;
  weekday: number;
}

export interface OrdinalDateTime extends TimeObject {
  year: number;
  ordinal: number;
}

export type GenericDateTime = Partial<GregorianDateTime & WeekDateTime & OrdinalDateTime & DateTimeOptions>;

export interface ExplainedFormat {
  input: string;
  tokens: FormatToken[];
  regex?: RegExp;
  rawMatches?: RegExpMatchArray | null;
  matches?: Record<string, string | number>;
  result?: GenericDateTime | null;
  zone?: Zone | null;
  invalidReason?: string;
}

export interface DefaultUnitValues extends BaseObject {
  year: 0 | 1;
  month: 0 | 1;
  day: 0 | 1;
  hour: 0 | 1;
  minute: 0 | 1;
  second: 0 | 1;
  millisecond: 0 | 1;
}

export interface DefaultWeekUnitValues extends BaseObject {
  weekNumber: 0 | 1;
  weekday: 0 | 1;
  hour: 0 | 1;
  minute: 0 | 1;
  second: 0 | 1;
  millisecond: 0 | 1;
}

export interface DefaultOrdinalUnitValues extends BaseObject {
  ordinal: 0 | 1;
  hour: 0 | 1;
  minute: 0 | 1;
  second: 0 | 1;
  millisecond: 0 | 1;
}

export interface InnerBuildObjectConfig {
  containsGregor: boolean;
  loc: Locale;
  useWeekData: number | boolean;
  containsOrdinal: boolean;
  normalized: { [key: string]: number; };
  obj: Partial<GregorianDateTime & WeekDateTime & OrdinalDateTime>;
  offsetProvis: number;
  zoneToUse: Zone;
}

// PLURALS - TODO: UNDERSTAND IF NEEDED

export interface TimeObjectPlurals {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface GregorianDateTimePlurals extends TimeObjectPlurals {
  years: number;
  months: number;
  days: number;
}

export interface WeekDateTimePlurals extends TimeObjectPlurals {
  weekYears: number;
  weeksNumber: number;
  weekdays: number;
}

export interface OrdinalDateTimePlurals extends TimeObjectPlurals {
  years: number;
  ordinal: number;
}

export type GenericDateTimePlurals = Partial<GregorianDateTimePlurals & WeekDateTimePlurals & OrdinalDateTimePlurals & DateTimeOptions>;
