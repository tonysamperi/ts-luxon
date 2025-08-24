import {formatOffset, parseZoneInfo, isUndefined, objToLocalTS} from "../impl/util.js";
import {Zone} from "../zone.js";
import {ZoneOffsetOptions, ZoneOffsetFormat} from "../types/zone.js";
import {InvalidZoneError} from "../errors.js";

const dtfCache: Map<string, Intl.DateTimeFormat> = new Map();

function makeDTF(zoneName: string) {
    if (!dtfCache.has(zoneName)) {
        try {
            dtfCache.set(zoneName, new Intl.DateTimeFormat("en-US", {
                hour12: !1,
                timeZone: zoneName,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                era: "short"
            }));
        }
        catch {
            throw new InvalidZoneError(zoneName);
        }
    }
    return dtfCache.get(zoneName);
}

const typeToPos: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {
    year: 0,
    month: 1,
    day: 2,
    era: 3,
    hour: 4,
    minute: 5,
    second: 6
};

function hackyOffset(dtf: Intl.DateTimeFormat, date: Date) {
    const formatted = dtf.format(date).replace(/\u200E/g, "");
    const parsed: RegExpExecArray = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted) as RegExpExecArray;
    const [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;

    return [fYear, fMonth, fDay, fadOrBc, fHour, fMinute, fSecond];
}

function partsOffset(dtf: Intl.DateTimeFormat, date: Date) {
    const formatted = dtf.formatToParts(date);
    const filled = [];
    for (let i = 0;
         i < formatted.length;
         i++) {
        const {type, value} = formatted[i];
        const pos = typeToPos[type] as number;

        if (type === "era") {
            filled[pos] = value;
        }
        else if (!isUndefined(pos)) {
            filled[pos] = parseInt(value, 10);
        }
    }
    return filled;
}

const ianaZoneCache: Map<string, IANAZone> = new Map();

/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */
export class IANAZone extends Zone {

    /** @override **/
    get isUniversal() {
        return false;
    }

    /** @override **/
    get isValid() {
        return this._valid;
    }

    /** @override **/
    get name() {
        return this._zoneName;
    }

    /** @override **/
    get type() {
        return "iana";
    }

    private readonly _valid: boolean;
    private readonly _zoneName: string;

    private constructor(name: string) {
        super();
        const normalizedName = IANAZone.normalizeZone(name);
        /** @private **/
        this._valid = normalizedName != null;
        // For backwards compatibility we only normalize in casing, otherwise would also normalize something like
        // EST5EDT to America/New_York.
        /** @private **/
        this._zoneName = normalizedName && normalizedName.toLowerCase() === name.toLowerCase() ? normalizedName : name;
    }


    /**
     * @param {string} name - Zone name
     * @return {IANAZone}
     */
    static create(name: string) {
        // Recreate invalid IanaZones
        if (!ianaZoneCache.has(name)) {
            ianaZoneCache.set(name, new IANAZone(name));
        }

        return ianaZoneCache.get(name);
    }

    /**
     * Returns whether the provided string is a valid specifier.
     * This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
     * @param {string} s - The string to check validity on
     * @example IANAZone.isValidSpecifier("America/New_York") //=> true
     * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
     * @deprecated This method returns false for some valid IANA names. Use isValidZone instead.
     * @return {boolean}
     */
    static isValidSpecifier(s: string) {
        return this.isValidZone(s);
    }

    /**
     * Returns whether the provided string identifies a real zone
     * @param {string} zone - The string to check
     * @example IANAZone.isValidZone("America/New_York") //=> true
     * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
     * @example IANAZone.isValidZone("Sport~~blorp") //=> false
     * @return {boolean}
     */
    static isValidZone(zone: string) {
        return IANAZone.normalizeZone(zone) != null;
    }

    /**
     * Normalize the name of the provided IANA zone or return null
     * if it is not a valid IANA zone.
     * @param {string} zone - The string to normalize
     * @example IANAZone.normalizeZone("America/New_York") //=> "America/New_York"
     * @example IANAZone.normalizeZone("america/NEw_York") //=> "America/New_York"
     * @example IANAZone.normalizeZone("EST5EDT") //=> "America/New_York"
     * @example IANAZone.normalizeZone("Fantasia/Castle") //=> null
     * @example IANAZone.normalizeZone("Sport~~blorp") //=> null
     * @return {string|null}
     */
    static normalizeZone(zone: string) {
        if (!zone) {
            return null;
        }
        try {
            return new Intl.DateTimeFormat("en-US", {timeZone: zone}).resolvedOptions().timeZone;
        }
        catch (e) {
            return null;
        }
    }

    /**
     * Reset local caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    static resetCache() {
        ianaZoneCache.clear();
        dtfCache.clear();
    }

    /** @override **/
    equals(other: Zone) {
        return other.type === "iana" && other.name === this.name;
    }

    /** @override **/
    formatOffset(ts: number, format: ZoneOffsetFormat) {
        return formatOffset(this.offset(ts), format);
    }

    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     * @override
     * @param {number} ts - Epoch milliseconds for which to compute the offset
     * @return {number}
     */
    offset(ts: number) {
        const date = new Date(ts);
        if (!this._valid || isNaN(+date)) {
            return NaN;
        }
        const dtf = makeDTF(this.name);
        let yearAlt;
        const [year, month, day, adOrBc, hour, minute, second] = typeof dtf.formatToParts === typeof isNaN
            ? partsOffset(dtf, date)
            : hackyOffset(dtf, date);

        if (adOrBc === "BC") {
            yearAlt = -Math.abs(+year) + 1;
        }

        // because we're using hour12 and https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
        const adjustedHour = hour === 24 ? 0 : hour;

        const asUTC = objToLocalTS({
            year: yearAlt || +year,
            month: +month,
            day: +day,
            hour: +adjustedHour,
            minute: +minute,
            second: +second,
            millisecond: 0
        });

        let asTS = +date;
        const over = asTS % 1000;
        asTS -= over >= 0 ? over : 1000 + over;
        return (asUTC - asTS) / (60 * 1000);
    }

    /** @override **/
    offsetName(ts: number, {format, locale}: ZoneOffsetOptions = {}) {
        return parseZoneInfo(ts, format, locale, this.name);
    }

}
