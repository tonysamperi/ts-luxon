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
    static get utcInstance(): FixedOffsetZone {
        if (singleton === null) {
            singleton = new FixedOffsetZone(0);
        }
        return singleton;
    }

    /**
     * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
     *
     * @override
     * @type {string}
     */
    get ianaName(): string {
        return this._fixed === 0
            ? "Etc/UTC"
            : `Etc/GMT${formatOffset(-this._fixed, "narrow")}`;

    }

    /**
     * Returns whether the offset is known to be fixed for the whole year:
     * Always returns true for all fixed offset zones.
     * @override
     * @type {boolean}
     */
    get isUniversal(): boolean {
        return true;
    }

    /**
     * Return whether this Zone is valid:
     * All fixed offset zones are valid.
     * @override
     * @type {boolean}
     */
    get isValid(): true {
        return true;
    }

    /**
     * The name of this zone.
     * All fixed zones' names always start with "UTC" (plus optional offset)
     * @override
     * @type {string}
     */
    get name(): string {
        return this._fixed === 0 ? "UTC" : `UTC${formatOffset(this._fixed, "narrow")}`;
    }

    /**
     * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
     * @override
     * @type {string}
     */
    get type(): "fixed" {
        return "fixed";
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
    static instance(offset: number): FixedOffsetZone {
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
    static parseSpecifier(s: string): FixedOffsetZone {
        if (s) {
            const r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
            if (r) {
                return new FixedOffsetZone(signedOffset(r[1], r[2]));
            }
        }
        return null;
    }

    /**
     * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
     * @override
     * @param {Zone} otherZone - the zone to compare
     * @return {boolean}
     */
    equals(otherZone: FixedOffsetZone): boolean {
        return otherZone.type === "fixed" && otherZone._fixed === this._fixed;
    }

    /**
     * Returns the offset's value as a string
     * @override
     * @param {number} ts - Epoch milliseconds for which to get the offset
     * @param {string} format - What style of offset to return.
     *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
     * @return {string}
     */
    formatOffset(_ts_: number, format: ZoneOffsetFormat): string {
        return formatOffset(this._fixed, format);
    }

    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     *
     * For fixed offset zones, this is constant and does not depend on a timestamp.
     * @override
     * @return {number}
     */
    offset(): number {
        return this._fixed;
    }

    /**
     * Returns the offset's common name at the specified timestamp.
     *
     * For fixed offset zones this equals to the zone name.
     * @override
     */
    offsetName(): string {
        return this.name;
    }


}
