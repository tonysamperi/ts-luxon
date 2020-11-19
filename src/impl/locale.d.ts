import DateTime from "../datetime";
import { StringUnitLength, UnitLength } from "../types/common";
import { LocaleOptions, NumberingSystem, CalendarSystem } from "../types/locale";
/**
 * @private
 */
interface NumberFormatterOptions {
    padTo?: number;
    floor?: boolean;
}
declare class PolyNumberFormatter {
    private readonly padTo;
    private readonly floor;
    private inf?;
    constructor(intl: string, forceSimple: boolean, options: NumberFormatterOptions);
    format(i: number): string;
}
/**
 * @private
 */
declare class PolyDateFormatter {
    private options;
    private dt;
    private dtf?;
    constructor(dt: DateTime, intl: string, options: Intl.DateTimeFormatOptions);
    format(): string;
    formatToParts(): Intl.DateTimeFormatPart[];
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions;
}
/**
 * @private
 */
declare class PolyRelFormatter {
    private options;
    private rtf?;
    constructor(locale: Intl.BCP47LanguageTag, isEnglish: boolean, options: Intl.RelativeTimeFormatOptions);
    format(count: number, unit: Intl.RelativeTimeFormatUnit): string;
    formatToParts(count: number, unit: Intl.RelativeTimeFormatUnit): string[];
}
/**
 * @private
 */
export default class Locale {
    readonly locale: string;
    numberingSystem?: Readonly<NumberingSystem>;
    outputCalendar?: Readonly<CalendarSystem>;
    private readonly intl;
    private weekdaysCache;
    private monthsCache;
    private meridiemCache?;
    private eraCache;
    private readonly specifiedLocale?;
    private fastNumbersCached?;
    static create(locale?: string, numberingSystem?: NumberingSystem, outputCalendar?: CalendarSystem, defaultToEN?: boolean): Locale;
    static resetCache(): void;
    static fromObject({ locale, numberingSystem, outputCalendar }?: LocaleOptions): Locale;
    private constructor();
    private supportsFastNumbers;
    get fastNumbers(): boolean;
    listingMode(defaultOK?: boolean): "error" | "en" | "intl";
    clone(alts: LocaleOptions, defaultToEN?: boolean): Locale;
    redefaultToEN(alts?: LocaleOptions): Locale;
    redefaultToSystem(alts?: LocaleOptions): Locale;
    months(length: UnitLength, format?: boolean, defaultOK?: boolean): string[];
    weekdays(length: StringUnitLength, format?: boolean, defaultOK?: boolean): string[];
    meridiems(defaultOK?: boolean): string[];
    eras(length: StringUnitLength, defaultOK?: boolean): string[];
    extract(dt: DateTime, intlOptions: Intl.DateTimeFormatOptions, field: Intl.DateTimeFormatPartTypes): string;
    numberFormatter(options?: NumberFormatterOptions): PolyNumberFormatter;
    dtFormatter(dt: DateTime, intlOptions?: Intl.DateTimeFormatOptions): PolyDateFormatter;
    relFormatter(options?: Intl.RelativeTimeFormatOptions): PolyRelFormatter;
    isEnglish(): boolean;
    equals(other: Locale): boolean;
}
export {};
