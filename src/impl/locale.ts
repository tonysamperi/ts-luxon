import { hasFormatToParts, hasIntl, padStart, roundTo, hasRelative } from "./util";
import * as English from "./english";
import { Settings } from "../settings";
import { DateTime } from "../datetime";
import { Formatter } from "./formatter";
import { IANAZone } from "../zones/IANAZone";
import Intl from "../types/intl-2020";

import { StringUnitLength, UnitLength, WeekUnitLengths } from "../types/common";
import { LocaleOptions, NumberingSystem, CalendarSystem } from "../types/locale";

let intlDTCache: Record<string, Intl.DateTimeFormat> = {};

function getCachedDTF(locString: string, options: Intl.DateTimeFormatOptions = {}) {
    const key = JSON.stringify([locString, options]);
    let dtf = intlDTCache[key];
    if (!dtf) {
        dtf = new Intl.DateTimeFormat(locString, options);
        intlDTCache[key] = dtf;
    }
    return dtf;
}

let intlNumCache: Record<string, Intl.NumberFormat> = {};

function getCachedINF(locString: string, options: Intl.NumberFormatOptions) {
    const key = JSON.stringify([locString, options]);
    let inf = intlNumCache[key];
    if (!inf) {
        inf = new Intl.NumberFormat(locString, options);
        intlNumCache[key] = inf;
    }
    return inf;
}

let intlRelCache: Record<string, Intl.RelativeTimeFormat> = {};

function getCachedRTF(locale: Intl.BCP47LanguageTag, options: Intl.RelativeTimeFormatOptions = {}) {
    const key = JSON.stringify([locale, options]);
    let inf = intlRelCache[key];
    if (!inf) {
        inf = new Intl.RelativeTimeFormat(locale, options);
        intlRelCache[key] = inf;
    }
    return inf;
}

let sysLocaleCache: string | undefined;

function systemLocale() {
    if (sysLocaleCache) {
        return sysLocaleCache;
    }
    else if (hasIntl()) {
        const computedSys = new Intl.DateTimeFormat().resolvedOptions().locale;
        // node sometimes defaults to "und". Override that because that is dumb
        sysLocaleCache = !computedSys || computedSys === "und" ? "en-US" : computedSys;
        return sysLocaleCache;
    }
    else {
        sysLocaleCache = "en-US";
        return sysLocaleCache;
    }
}

function parseLocaleString(localeStr: string): [string, NumberingSystem?, CalendarSystem?] {
    // I really want to avoid writing a BCP 47 parser
    // see, e.g. https://github.com/wooorm/bcp-47
    // Instead, we'll do this:

    // a) if the string has no -u extensions, just leave it alone
    // b) if it does, use Intl to resolve everything
    // c) if Intl fails, try again without the -u

    const uIndex = localeStr.indexOf("-u-");
    if (uIndex === -1) {
        return [localeStr];
    }
    else {
        let options: Intl.ResolvedDateTimeFormatOptions;
        const smaller = localeStr.substring(0, uIndex);
        try {
            options = getCachedDTF(localeStr).resolvedOptions();
        } catch (e) {
            options = getCachedDTF(smaller).resolvedOptions();
        }

        const { numberingSystem, calendar } = options;
        // return the smaller one so that we can append the calendar and numbering overrides to it
        return [smaller, numberingSystem as NumberingSystem, calendar as CalendarSystem];
    }
}

function intlConfigString(
    localeStr: string,
    numberingSystem?: NumberingSystem,
    outputCalendar?: CalendarSystem
) {
    if (hasIntl()) {
        if (outputCalendar || numberingSystem) {
            localeStr += "-u";

            if (outputCalendar) {
                localeStr += `-ca-${outputCalendar}`;
            }

            if (numberingSystem) {
                localeStr += `-nu-${numberingSystem}`;
            }
            return localeStr;
        }
        else {
            return localeStr;
        }
    }
    else {
        // arbitrary value, should never be used, all subsequent uses of this.intl are protected by an hasIntl check
        return "";
    }
}

function mapMonths<T>(f: (d: DateTime) => T): T[] {
    const ms = [];
    for (let i = 1; i <= 12; i++) {
        const dt = DateTime.utc(2016, i, 1);
        ms.push(f(dt));
    }
    return ms;
}

function mapWeekdays<T>(f: (d: DateTime) => T): T[] {
    const ms = [];
    for (let i = 1; i <= 7; i++) {
        const dt = DateTime.utc(2016, 11, 13 + i);
        ms.push(f(dt));
    }
    return ms;
}

function listStuff<T extends UnitLength>(
    loc: Locale,
    length: T,
    defaultOK: boolean,
    englishFn: (length: T) => string[],
    intlFn: (length: T) => string[]
) {
    const mode = loc.listingMode(defaultOK);

    if (mode === "error") {
        return [];
    }
    else if (mode === "en") {
        return englishFn(length);
    }
    else {
        return intlFn(length);
    }
}

/**
 * @private
 */
interface NumberFormatterOptions {
    padTo?: number;
    floor?: boolean;
}

class PolyNumberFormatter {
    private readonly _padTo: number;
    private readonly _floor: boolean;
    private _inf?: Readonly<Intl.NumberFormat>;

    constructor(intl: string, forceSimple: boolean, options: NumberFormatterOptions) {
        this._padTo = options.padTo || 0;
        this._floor = options.floor || false;

        if (!forceSimple && hasIntl()) {
            const intlOpts: Intl.NumberFormatOptions = { useGrouping: false };
            if (this._padTo > 0) {
                intlOpts.minimumIntegerDigits = this._padTo;
            }
            this._inf = getCachedINF(intl, intlOpts);
        }
    }

    format(i: number) {
        if (this._inf) {
            const fixed = this._floor ? Math.floor(i) : i;
            return this._inf.format(fixed);
        }
        else {
            // to match the browser's numberformatter defaults
            const fixed = this._floor ? Math.floor(i) : roundTo(i, 3);
            return padStart(fixed, this._padTo);
        }
    }
}

/**
 * @private
 */

class PolyDateFormatter {
    private _opts: Readonly<Intl.DateTimeFormatOptions>;
    private _dt: DateTime;
    private _dtf?: Readonly<Intl.DateTimeFormat>;
    private _hasIntl: boolean;

    constructor(dt: DateTime, intl: string, opts: Intl.DateTimeFormatOptions) {
        this._opts = opts;
        this._hasIntl = hasIntl();

        let z;
        if (dt.zone.universal && this._hasIntl) {
            // UTC-8 or Etc/UTC-8 are not part of tzdata, only Etc/GMT+8 and the like.
            // That is why fixed-offset TZ is set to that unless it is:
            // 1. Representing offset 0 when UTC is used to maintain previous behavior and does not become GMT.
            // 2. Unsupported by the browser:
            //    - some do not support Etc/
            //    - < Etc/GMT-14, > Etc/GMT+12, and 30-minute or 45-minute offsets are not part of tzdata
            const gmtOffset = -1 * (dt.offset / 60);
            const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
            const isOffsetZoneSupported = IANAZone.isValidZone(offsetZ);
            if (dt.offset !== 0 && isOffsetZoneSupported) {
                z = offsetZ;
                this._dt = dt;
            }
            else {
                // Not all fixed-offset zones like Etc/+4:30 are present in tzdata.
                // So we have to make do. Two cases:
                // 1. The format options tell us to show the zone. We can't do that, so the best
                // we can do is format the date in UTC.
                // 2. The format options don't tell us to show the zone. Then we can adjust them
                // the time and tell the formatter to show it to us in UTC, so that the time is right
                // and the bad zone doesn't show up.
                z = "UTC";
                if (opts.timeZoneName) {
                    this._dt = dt;
                }
                else {
                    this._dt = dt.offset === 0 ? dt : DateTime.fromMillis(dt.ts + dt.offset * 60 * 1000);
                }
            }
        }
        else if (dt.zone.type === "local") {
            this._dt = dt;
        }
        else {
            this._dt = dt;
            z = dt.zone.name;
        }

        if (this._hasIntl) {
            const intlOpts = Object.assign({ timeZone: z }, this._opts);

            this._dtf = getCachedDTF(intl, intlOpts);
        }
    }

    format() {
        if (this._dtf) {
            return this._dtf.format(this._dt.toJSDate());
        }
        else {
            const tokenFormat = English.formatString(this._opts),
                loc = Locale.create("en-US");
            return Formatter.create(loc).formatDateTimeFromString(this._dt, tokenFormat);
        }
    }

    formatToParts() {
        if (this._dtf && hasFormatToParts()) {
            return this._dtf.formatToParts(this._dt.toJSDate());
        }
        else {
            // This is kind of a cop out. We actually could do this for English. However, we couldn't do it for intl strings
            // and IMO it's too weird to have an uncanny valley like that
            return [];
        }
    }

    resolvedOptions() {
        if (this._dtf) {
            return this._dtf.resolvedOptions();
        }
        else {
            return {
                locale: "en-US",
                numberingSystem: "latn",
                calendar: "gregory",
                timeZone: "UTC"
            };
        }
    }
}

/**
 * @private
 */
class PolyRelFormatter {
    private _options: Readonly<Intl.RelativeTimeFormatOptions>;
    private _rtf?: Readonly<Intl.RelativeTimeFormat>;

    constructor(locale: Intl.BCP47LanguageTag, isEnglish: boolean, options: Intl.RelativeTimeFormatOptions) {
        this._options = Object.assign({ style: "long" }, options);
        if (!isEnglish && hasRelative()) {
            this._rtf = getCachedRTF(locale, options);
        }
    }

    format(count: number, unit: Intl.RelativeTimeFormatUnit) {
        if (this._rtf) {
            return this._rtf.format(count, unit);
        }
        else {
            return English.formatRelativeTime(
                unit,
                count,
                this._options.numeric,
                this._options.style !== "long"
            );
        }
    }

    formatToParts(count: number, unit: Intl.RelativeTimeFormatUnit) {
        if (this._rtf) {
            return this._rtf.formatToParts(count, unit);
        }
        else {
            return [];
        }
    }
}

interface MonthCache {
    format: Partial<Record<UnitLength, string[]>>;
    standalone: Partial<Record<UnitLength, string[]>>;
}

interface WeekDaysCache {
    format: Partial<Record<WeekUnitLengths, string[]>>;
    standalone: Partial<Record<WeekUnitLengths, string[]>>;
}

type EraCache = Partial<Record<StringUnitLength, string[]>>;

/**
 * @private
 */
export class Locale {

    private constructor(
        locale: string,
        numberingSystem?: NumberingSystem,
        outputCalendar?: CalendarSystem,
        specifiedLocale?: string
    ) {
        const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);

        this.locale = parsedLocale;
        this.numberingSystem = numberingSystem || parsedNumberingSystem;
        this.outputCalendar = outputCalendar || parsedOutputCalendar;
        this._intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);

        this._weekdaysCache = { format: {}, standalone: {} };
        this._monthsCache = { format: {}, standalone: {} };
        this._meridiemCache = undefined;
        this._eraCache = {};

        this._specifiedLocale = specifiedLocale;
        this._fastNumbersCached = undefined;
    }

    get fastNumbers() {
        if (this._fastNumbersCached === undefined) {
            this._fastNumbersCached = this._supportsFastNumbers();
        }

        return this._fastNumbersCached;
    }

    public readonly locale: string;
    public numberingSystem?: Readonly<NumberingSystem>;
    public outputCalendar?: Readonly<CalendarSystem>;

    private readonly _intl: string;

    private _weekdaysCache: Readonly<WeekDaysCache>;
    private _monthsCache: Readonly<MonthCache>;
    private _meridiemCache?: Readonly<string[]>;
    private _eraCache: EraCache;

    private readonly _specifiedLocale?: string;
    private _fastNumbersCached?: boolean;

    static fromOpts(opts: LocaleOptions) {
        return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.defaultToEN);
    }

    static create(locale?: string, numberingSystem?: NumberingSystem, outputCalendar?: CalendarSystem, defaultToEN = !1) {
        const specifiedLocale = locale || Settings.defaultLocale,
            // the system locale is useful for human readable strings but annoying for parsing/formatting known formats
            localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale()),
            numberingSystemR = numberingSystem || Settings.defaultNumberingSystem,
            outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;

        return new Locale(localeR, numberingSystemR, outputCalendarR, specifiedLocale);
    }

    static resetCache() {
        sysLocaleCache = undefined;
        intlDTCache = {};
        intlNumCache = {};
        intlRelCache = {};
    }

    static fromObject({ locale, numberingSystem, outputCalendar }: LocaleOptions = {}) {
        return Locale.create(locale, numberingSystem, outputCalendar);
    }

    listingMode(defaultOK = true) {
        const intl = hasIntl(),
            hasFTP = intl && hasFormatToParts(),
            isActuallyEn = this.isEnglish(),
            hasNoWeirdness =
                (this.numberingSystem === undefined || this.numberingSystem === "latn") &&
                (this.outputCalendar === undefined || this.outputCalendar === "gregory");

        if (!hasFTP && !(isActuallyEn && hasNoWeirdness) && !defaultOK) {
            return "error";
        }
        else if (!hasFTP || (isActuallyEn && hasNoWeirdness)) {
            return "en";
        }
        else {
            return "intl";
        }
    }

    clone(alts: LocaleOptions): Locale {
        if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
            return this;
        }
        else {
            return Locale.create(
                alts.locale || this._specifiedLocale,
                alts.numberingSystem || this.numberingSystem,
                alts.outputCalendar || this.outputCalendar,
                alts.defaultToEN || false
            );
        }
    }

    redefaultToEN(alts: LocaleOptions = {}) {
        return this.clone(Object.assign({}, alts, { defaultToEN: true }));
    }

    redefaultToSystem(alts: LocaleOptions = {}) {
        return this.clone(Object.assign({}, alts, { defaultToEN: false }));
    }

    months(length: UnitLength, format = false, defaultOK = true) {
        return listStuff(this, length, defaultOK, English.months, len => {
            const intl = format ? { month: len, day: "numeric" } : { month: len },
                formatStr = format ? "format" : "standalone";
            if (!this._monthsCache[formatStr][len]) {
                this._monthsCache[formatStr][len] = mapMonths(dt => this.extract(dt, intl, "month"));
            }
            return this._monthsCache[formatStr][len] as string[];
        });
    }

    weekdays(length: WeekUnitLengths, format = false, defaultOK = true) {
        return listStuff(this, length, defaultOK, English.weekdays, len => {
            const intl = format
                ? { weekday: len, year: "numeric", month: "long", day: "numeric" }
                : { weekday: len },
                formatStr = format ? "format" : "standalone";
            if (!this._weekdaysCache[formatStr][len]) {
                this._weekdaysCache[formatStr][len] = mapWeekdays(dt => this.extract(dt, intl, "weekday"));
            }
            return this._weekdaysCache[formatStr][len] as string[];
        });
    }

    meridiems(defaultOK = true) {
        return listStuff(
            this,
            "long", // arbitrary unused value
            defaultOK,
            () => English.meridiems,
            () => {
                // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
                // for AM and PM. This is probably wrong, but it makes parsing way easier.
                if (this._meridiemCache === undefined) {
                    const intl = { hour: "numeric", hour12: true };
                    this._meridiemCache = [
                        DateTime.utc(2016, 11, 13, 9),
                        DateTime.utc(2016, 11, 13, 19)
                    ].map(dt => this.extract(dt, intl, "dayPeriod"));
                }

                return this._meridiemCache as string[];
            }
        );
    }

    eras(length: StringUnitLength, defaultOK = true) {
        return listStuff(this, length, defaultOK, English.eras, len => {
            const intl = { era: len };

            // This is utter bullshit. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
            // to definitely enumerate them.
            if (!this._eraCache[len]) {
                this._eraCache[len] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(dt =>
                    this.extract(dt, intl, "era")
                );
            }

            return this._eraCache[len] as string[];
        });
    }

    extract(
        dt: DateTime,
        intlOptions: Intl.DateTimeFormatOptions,
        field: Intl.DateTimeFormatPartTypes
    ) {
        const df = this.dtFormatter(dt, intlOptions),
            results = df.formatToParts(),
            matching = results.find(
                (m: Intl.DateTimeFormatPart) => m.type.toLowerCase() === field.toLowerCase()
            );

        if (!matching) {
            throw new Error(`Invalid extract field ${field}`);
        }
        return matching.value;
    }

    numberFormatter(options: NumberFormatterOptions = {}) {
        return new PolyNumberFormatter(this._intl, this.fastNumbers, options);
    }

    dtFormatter(dt: DateTime, intlOptions: Intl.DateTimeFormatOptions = {}) {
        return new PolyDateFormatter(dt, this._intl, intlOptions);
    }

    relFormatter(options: Intl.RelativeTimeFormatOptions = {}) {
        return new PolyRelFormatter(this._intl, this.isEnglish(), options);
    }

    isEnglish() {
        return (
            this.locale === "en" ||
            this.locale.toLowerCase() === "en-us" ||
            (hasIntl() && new Intl.DateTimeFormat(this._intl).resolvedOptions().locale.startsWith("en-us"))
        );
    }

    equals(other: Locale) {
        return (
            this.locale === other.locale &&
            this.numberingSystem === other.numberingSystem &&
            this.outputCalendar === other.outputCalendar
        );
    }

    private _supportsFastNumbers() {
        if (this.numberingSystem && this.numberingSystem !== "latn") {
            return false;
        }
        else {
            return (
                this.numberingSystem === "latn" ||
                !this.locale ||
                this.locale.startsWith("en") ||
                (hasIntl() && Intl.DateTimeFormat(this._intl).resolvedOptions().numberingSystem === "latn")
            );
        }
    }
}
