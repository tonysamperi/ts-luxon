import { UnitLength, StringUnitLength } from "../types/common";
import DateTime from "../datetime";
/**
 * @private
 */
export declare const monthsLong: string[];
export declare const monthsShort: string[];
export declare const monthsNarrow: string[];
export declare function months(length: UnitLength): string[];
export declare const weekdaysLong: string[];
export declare const weekdaysShort: string[];
export declare const weekdaysNarrow: string[];
export declare function weekdays(length: StringUnitLength): string[];
export declare const meridiems: string[];
export declare const erasLong: string[];
export declare const erasShort: string[];
export declare const erasNarrow: string[];
export declare function eras(length: StringUnitLength): string[];
export declare function meridiemForDateTime(dt: DateTime): string;
export declare function weekdayForDateTime(dt: DateTime, length: StringUnitLength): string;
export declare function monthForDateTime(dt: DateTime, length: UnitLength): string;
export declare function eraForDateTime(dt: DateTime, length: StringUnitLength): string;
export declare function formatRelativeTime(unit: Intl.RelativeTimeFormatUnit, count: number, numeric?: Intl.RelativeTimeFormatNumeric, narrow?: boolean): string;
export declare function formatString(knownFormat: Intl.DateTimeFormatOptions): "EEEE, LLLL d, yyyy, h:mm a" | "M/d/yyyy" | "LLL d, yyyy" | "EEE, LLL d, yyyy" | "LLLL d, yyyy" | "EEEE, LLLL d, yyyy" | "h:mm a" | "h:mm:ss a" | "HH:mm" | "HH:mm:ss" | "M/d/yyyy, h:mm a" | "LLL d, yyyy, h:mm a" | "LLLL d, yyyy, h:mm a" | "M/d/yyyy, h:mm:ss a" | "LLL d, yyyy, h:mm:ss a" | "EEE, d LLL yyyy, h:mm a" | "LLLL d, yyyy, h:mm:ss a" | "EEEE, LLLL d, yyyy, h:mm:ss a";
