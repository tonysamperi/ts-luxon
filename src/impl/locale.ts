import { padStart, roundTo, hasRelative } from "./util";
import * as English from "./english";
import { Settings } from "../settings";
import { DateTime } from "../datetime";
import { IANAZone } from "../zones/IANAZone";
import Intl from "../types/intl-next";
import { StringUnitLength, UnitLength, WeekUnitLengths } from "../types/common";
import { LocaleOptions, NumberingSystem, CalendarSystem } from "../types/locale";

// todo - remap caching

let intlLFCache: Record<string, Intl.ListFormat> = {};

function getCachedLF(locString: string, opts: Intl.ListFormatOptions = {}) {
    const key = JSON.stringify([locString, opts]);
    let dtf = intlLFCache[key];
    if (!dtf) {
        dtf = new Intl.ListFormat(locString, opts);
        intlLFCache[key] = dtf;
    }
    return dtf;
}

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

function getCachedRTF(locale: Intl.UnicodeBCP47LocaleIdentifier, options: Intl.RelativeTimeFormatOptions = {}) {
    const key = JSON.stringify([locale, options]);
    let inf = intlRelCache[key];
    if (!inf) {
        inf = new Intl.RelativeTimeFormat(locale, options);
        intlRelCache[key] = inf;
    }
    return inf;
}

let sysLocaleCache: string | void;

function systemLocale() {
    if (!sysLocaleCache) {
        sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
    }

    return sysLocaleCache;
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

function intlConfigString(localeStr: string, numberingSystem?: NumberingSystem, outputCalendar?: CalendarSystem) {
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
    englishFn: (length: T) => string[],
    intlFn: (length: T) => string[]
) {
    const mode = loc.listingMode();

    // In Luxon a check on mode === "error" was kept, but could never be true
    if (mode === "en") {
        return englishFn(length);
    }
    else {
        return intlFn(length);
    }
}

/**
 * @private
 */

class PolyNumberFormatter {
    private readonly _padTo: number;
    private readonly _floor: boolean;
    private _inf?: Readonly<Intl.NumberFormat>;

    constructor(intl: string, forceSimple: boolean, opts: Intl.NumberFormatOptions) {
        this._padTo = opts.padTo || 0;
        this._floor = opts.floor || false;
        const { padTo, floor, ...otherOpts } = opts;

        if (!forceSimple || Object.keys(otherOpts).length > 0) {
            const intlOpts: Intl.NumberFormatOptions = { useGrouping: false, ...opts };
            if (this._padTo > 0) {
                intlOpts.minimumIntegerDigits = opts.padTo;
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

    get dtf(): Intl.DateTimeFormat {
        return this._dtf;
    }

    private _opts: Readonly<Intl.DateTimeFormatOptions>;
    private _dt: DateTime;
    private _dtf: Readonly<Intl.DateTimeFormat>;

    constructor(dt: DateTime, intl: string, opts: Intl.DateTimeFormatOptions) {
        this._opts = opts;

        let z;
        if (dt.zone.isUniversal) {
            // UTC-8 or Etc/UTC-8 are not part of tzdata, only Etc/GMT+8 and the like.
            // That is why fixed-offset TZ is set to that unless it is:
            // 1. Representing offset 0 when UTC is used to maintain previous behavior and does not become GMT.
            // 2. Unsupported by the browser:
            //    - some do not support Etc/
            //    - < Etc/GMT-14, > Etc/GMT+12, and 30-minute or 45-minute offsets are not part of tzdata
            const gmtOffset = -1 * (dt.offset / 60);
            const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
            if (dt.offset !== 0 && IANAZone.create(offsetZ).isValid) {
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
        else if (dt.zone.type === "system") {
            this._dt = dt;
        }
        else {
            this._dt = dt;
            z = dt.zone.name;
        }
        const intlOpts = { ...this._opts };
        if (z) {
            intlOpts.timeZone = z;
        }
        this._dtf = getCachedDTF(intl, intlOpts);
    }

    format() {
        return this._dtf.format(this._dt.toJSDate());
    }

    formatToParts() {
        return this._dtf.formatToParts(this._dt.toJSDate());
    }

    resolvedOptions() {
        return this._dtf.resolvedOptions();
    }
}

/**
 * @private
 */
class PolyRelFormatter {
    private _opts: Readonly<Intl.RelativeTimeFormatOptions>;
    private _rtf?: Readonly<Intl.RelativeTimeFormat>;

    constructor(locale: Intl.UnicodeBCP47LocaleIdentifier, isEnglish: boolean, opts: Intl.RelativeTimeFormatOptions) {
        this._opts = { style: "long", ...opts };
        if (!isEnglish && hasRelative()) {
            this._rtf = getCachedRTF(locale, opts);
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
                this._opts.numeric,
                this._opts.style !== "long"
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
        specifiedLocale?: string) {

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
        intlLFCache = {};
        intlDTCache = {};
        intlNumCache = {};
        intlRelCache = {};
    }

    static fromObject({ locale, numberingSystem, outputCalendar }: LocaleOptions = {}) {
        return Locale.create(locale, numberingSystem, outputCalendar);
    }

    // In Luxon boolean param "defaultOK" was still there, although unused
    listingMode() {
        const isActuallyEn = this.isEnglish();
        const hasNoWeirdness =
            (this.numberingSystem === null || this.numberingSystem === "latn") &&
            (this.outputCalendar === null || this.outputCalendar === "gregory");
        return isActuallyEn && hasNoWeirdness ? "en" : "intl";
    }

    clone(alts?: LocaleOptions): Locale {
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
        return this.clone({ ...alts, defaultToEN: true });
    }

    redefaultToSystem(alts: LocaleOptions = {}): Locale {
        return this.clone({ ...alts, defaultToEN: false });
    }

    months(length: UnitLength, format: boolean = false): string[] {
        return listStuff(this, length, English.months, len => {
            const intl: Intl.DateTimeFormatOptions = format ? { month: len, day: "numeric" } : { month: len },
                formatStr = format ? "format" : "standalone";
            if (!this._monthsCache[formatStr][len]) {
                this._monthsCache[formatStr][len] = mapMonths(dt => this.extract(dt, intl, "month"));
            }
            return this._monthsCache[formatStr][len] as string[];
        });
    }

    weekdays(length: WeekUnitLengths, format: boolean = false): string[] {
        return listStuff(this, length, English.weekdays, len => {
            const intl: Intl.DateTimeFormatOptions = format
                ? { weekday: len, year: "numeric", month: "long", day: "numeric" }
                : { weekday: len };
            const formatStr = format ? "format" : "standalone";
            if (!this._weekdaysCache[formatStr][len]) {
                this._weekdaysCache[formatStr][len] = mapWeekdays(dt => this.extract(dt, intl, "weekday"));
            }
            return this._weekdaysCache[formatStr][len] as string[];
        });
    }

    meridiems() {
        return listStuff(
            this,
            "long", // arbitrary unused value
            () => English.meridiems,
            () => {
                // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
                // for AM and PM. This is probably wrong, but it makes parsing way easier.
                if (this._meridiemCache === undefined) {
                    this._meridiemCache = [
                        DateTime.utc(2016, 11, 13, 9),
                        DateTime.utc(2016, 11, 13, 19)
                    ].map(dt => this.extract(dt, { hour: "numeric", hourCycle: "h12" }, "dayPeriod"));
                }

                return this._meridiemCache as string[];
            }
        );
    }

    eras(length: StringUnitLength) {
        return listStuff(this, length, English.eras, len => {
            const intl = { era: len };

            // This is problematic. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
            // to definitely enumerate them.
            if (!this._eraCache[len]) {
                this._eraCache[len] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(dt =>
                    this.extract(dt, intl, "era")
                );
            }

            return this._eraCache[len] as string[];
        });
    }

    extract(dt: DateTime, intlOptions: Intl.DateTimeFormatOptions, field: Intl.DateTimeFormatPartTypes): string {
        const df = this.dtFormatter(dt, intlOptions),
            results = df.formatToParts(),
            matching = results.find((m: Intl.DateTimeFormatPart) => m.type.toLowerCase() === field.toLowerCase());
        if (!matching) {
            throw new Error(`Invalid extract field ${field}`);
        }

        return matching.value;
    }

    numberFormatter(options: Intl.NumberFormatOptions = {}): PolyNumberFormatter {
        return new PolyNumberFormatter(this._intl, this.fastNumbers, options);
    }

    dtFormatter(dt: DateTime, intlOptions: Intl.DateTimeFormatOptions = {}): PolyDateFormatter {
        return new PolyDateFormatter(dt, this._intl, intlOptions);
    }

    relFormatter(options: Intl.RelativeTimeFormatOptions = {}): PolyRelFormatter {
        return new PolyRelFormatter(this._intl, this.isEnglish(), options);
    }

    listFormatter(opts: Intl.ListFormatOptions = {}) {
        return getCachedLF(this._intl, opts);
    }

    isEnglish(): boolean {
        return (
            // tslint:disable-next-line:no-bitwise
            !!~["en", "en-us"].indexOf(this.locale.toLowerCase()) ||
            new Intl.DateTimeFormat(this._intl).resolvedOptions().locale.startsWith("en-us")
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
                Intl.DateTimeFormat(this._intl).resolvedOptions().numberingSystem === "latn"
            );
        }
    }
}
