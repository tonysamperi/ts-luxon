import { formatOffset, signedOffset } from "../impl/util";
import { Zone } from "../zone";
import { ZoneOffsetFormat } from "../types/zone";

let singleton: FixedOffsetZone | null = null;

/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */
export class FixedOffsetZone extends Zone {

    /**
     * Get a singleton instance of UTC
     * @return {FixedOffsetZone}
     */
    static get utcInstance() {
        if (singleton === null) {
            singleton = new FixedOffsetZone(0);
        }
        return singleton;
    }

    /** @override **/
    get isValid() {
        return true;
    }

    get ianaName() {
        return this._fixed === 0
            ? "Etc/UTC"
            : `Etc/GMT${formatOffset(-this._fixed, "narrow")}`;

    }

    /** @override **/
    get name() {
        return this._fixed === 0 ? "UTC" : `UTC${formatOffset(this._fixed, "narrow")}`;
    }

    /** @override **/
    get type() {
        return "fixed";
    }

    /** @override **/
    get isUniversal() {
        return true;
    }

    private readonly _fixed: number;

    constructor(offset: number) {
        super();
        /** @private **/
        this._fixed = offset;
    }


    /**
     * Get an instance with a specified offset
     * @param {number} offset - The offset in minutes
     * @return {FixedOffsetZone}
     */
    static instance(offset: number) {
        return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
    }

    /**
     * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
     * @param {string} s - The offset string to parse
     * @example FixedOffsetZone.parseSpecifier("UTC+6")
     * @example FixedOffsetZone.parseSpecifier("UTC+06")
     * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
     * @return {FixedOffsetZone}
     */
    static parseSpecifier(s: string) {
        if (s) {
            const r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
            if (r) {
                return new FixedOffsetZone(signedOffset(r[1], r[2]));
            }
        }
        return null;
    }

    /** @override **/
    offsetName() {
        return this.name;
    }

    /** @override **/
    formatOffset(_ts_: number, format: ZoneOffsetFormat) {
        return formatOffset(this._fixed, format);
    }

    /** @override **/
    offset() {
        return this._fixed;
    }

    /** @override **/
    equals(otherZone: FixedOffsetZone) {
        return otherZone.type === "fixed" && otherZone._fixed === this._fixed;
    }


}
