import { TimeObject, GregorianDateTime } from "../types/datetime";
import { ZoneOffsetFormat } from "../types/zone";
/**
 * @private
 */
export declare function isUndefined(o: unknown): o is undefined;
export declare function isNumber(o: unknown): o is number;
export declare function isInteger(o: unknown): boolean;
export declare function isString(o: unknown): o is string;
export declare function isDate(o: unknown): o is Date;
export declare function hasIntl(): boolean;
export declare function hasFormatToParts(): boolean;
export declare function hasRelative(): boolean;
export declare function maybeArray<T>(thing: T | T[]): T[];
export declare function bestBy<T, U>(arr: T[], by: (_: T) => U, compare: (_: U, __: U) => U): T;
export declare function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function integerBetween(thing: number, bottom: number, top: number): boolean;
export declare function floorMod(x: number, n: number): number;
export declare function padStart(input: string | number, n?: number): string;
export declare function parseInteger(text: string): number | undefined;
export declare function parseMillis(fraction: string | null | undefined): number | undefined;
export declare function roundTo(value: number, digits: number, towardZero?: boolean): number;
export declare function isLeapYear(year: number): boolean;
export declare function daysInYear(year: number): 366 | 365;
export declare function daysInMonth(year: number, month: number): number;
export declare function objToLocalTS(obj: GregorianDateTime): number;
export declare function weeksInWeekYear(weekYear: number): 53 | 52;
export declare function untruncateYear(year: number): number;
export declare function parseZoneInfo(ts: number, offsetFormat?: string, locale?: string, timeZone?: string): string | null;
export declare function signedOffset(offHourStr: string, offMinuteStr: string): number;
export declare function asNumber(value: unknown): number;
export declare function normalizeObject<T extends string>(obj: Record<string, unknown>, normalizer: (key: string) => T): Partial<Record<T, number>>;
export declare function formatOffset(offset: number, format: ZoneOffsetFormat): string;
export declare function timeObject(obj: TimeObject): TimeObject;
export declare const ianaRegex: RegExp;
