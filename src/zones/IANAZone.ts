import {formatOffset, parseZoneInfo, isUndefined, objToLocalTS} from "../impl/util";
import {Zone} from "../zone";
import {ZoneOffsetOptions, ZoneOffsetFormat} from "../types/zone";
import {InvalidZoneError} from "../errors";

let dtfCache: Record<string, Intl.DateTimeFormat> = {};

function makeDTF(zone: string) {
    if (!dtfCache[zone]) {
        try {
            dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
                hour12: !1,
                timeZone: zone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                era: "short"
            });
        }
        catch {
            throw new InvalidZoneError(zone);
        }
    }
    return dtfCache[zone];
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
    for (let i = 0; i < formatted.length; i++) {
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

let ianaZoneCache: Record<string, IANAZone> = {};

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
        /** @private **/
        this._zoneName = name;
        /** @private **/
        this._valid = IANAZone.isValidZone(name);
    }


    /**
     * @param {string} name - Zone name
     * @return {IANAZone}
     */
    static create(name: string) {
        // Recreate invalid IanaZones
        if (!ianaZoneCache[name]) {
            ianaZoneCache[name] = new IANAZone(name);
        }
        return ianaZoneCache[name];
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
    static isValidZone(zone: string): boolean {
        if (!zone) {
            return false;
        }
        try {
            new Intl.DateTimeFormat("en-US", {timeZone: zone}).format();
            return true;
        }
        catch (e) {
            return false;
        }
    }

    /**
     * Reset local caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    static resetCache() {
        ianaZoneCache = {};
        dtfCache = {};
    }

    /** @override **/
    equals(other: Zone) {
        return other.type === "iana" && other.name === this.name;
    }

    /** @override **/
    formatOffset(ts: number, format: ZoneOffsetFormat) {
        return formatOffset(this.offset(ts), format);
    }

    /** @override **/
    offset(ts: number) {
        const date = new Date(ts);
        if (isNaN(+date)) {
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
