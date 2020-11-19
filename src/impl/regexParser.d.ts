import Zone from "../zone";
import { GenericDateTime } from "../types/datetime";
declare type ParseResult = [GenericDateTime | null, Zone | null];
/**
 * @private
 */
export declare function parseISODate(s: string): ParseResult | null[];
export declare function parseRFC2822Date(s: string): ParseResult | null[];
export declare function parseHTTPDate(s: string): ParseResult | null[];
export declare function parseISODuration(s: string): {
    years: number | undefined;
    months: number | undefined;
    weeks: number | undefined;
    days: number | undefined;
    hours: number | undefined;
    minutes: number | undefined;
    seconds: number | undefined;
    milliseconds: number | undefined;
} | undefined;
export declare function parseSQL(s: string): ParseResult | null[];
export {};
