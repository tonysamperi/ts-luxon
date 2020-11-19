import Locale from "./locale";
import DateTime from "../datetime";
import Duration from "../duration";
import { ZoneOffsetFormat } from "../types/zone";
export interface FormatToken {
    literal: boolean;
    val: string;
}
interface FormatterOptions extends Intl.DateTimeFormatOptions {
    allowZ?: boolean;
    forceSimple?: boolean;
    format?: ZoneOffsetFormat;
    padTo?: number;
    floor?: boolean;
}
/**
 * @private
 */
export default class Formatter {
    private options;
    private loc;
    private systemLoc?;
    static create(locale: Locale, options?: FormatterOptions): Formatter;
    static parseFormat(format: string): FormatToken[];
    static macroTokenToFormatOpts(token: string): Intl.DateTimeFormatOptions;
    constructor(locale: Locale, formatOptions: FormatterOptions);
    formatWithSystemDefault(dt: DateTime, options: Intl.DateTimeFormatOptions): string;
    formatDateTime(dt: DateTime): string;
    formatDateTimeParts(dt: DateTime): Intl.DateTimeFormatPart[];
    resolvedOptions(dt: DateTime): Intl.ResolvedDateTimeFormatOptions;
    num(n: number, p?: number): string;
    formatDateTimeFromString(dt: DateTime, format: string): string;
    formatDurationFromString(dur: Duration, format: string): string;
}
export {};
