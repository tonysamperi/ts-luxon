import Zone from "../zone";
import { ZoneOffsetFormat, ZoneOffsetOptions } from "../types/zone";
/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */
export default class FixedOffsetZone extends Zone {
    private readonly fixed;
    /**
     * Get a singleton instance of UTC
     * @return {FixedOffsetZone}
     */
    static get utcInstance(): FixedOffsetZone;
    /**
     * Get an instance with a specified offset
     * @param {number} offset - The offset in minutes
     * @return {FixedOffsetZone}
     */
    static instance(offset: number): FixedOffsetZone;
    /**
     * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
     * @param {string} s - The offset string to parse
     * @example FixedOffsetZone.parseSpecifier("UTC+6")
     * @example FixedOffsetZone.parseSpecifier("UTC+06")
     * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
     * @return {FixedOffsetZone | null}
     */
    static parseSpecifier(s: string): FixedOffsetZone | null;
    constructor(offset: number);
    /** @override **/
    get type(): string;
    /** @override **/
    get name(): string;
    /** @override **/
    offsetName(_ts?: number, _options?: ZoneOffsetOptions): string;
    /** @override **/
    formatOffset(_ts: number, format: ZoneOffsetFormat): string;
    /** @override **/
    get isUniversal(): boolean;
    /** @override **/
    offset(_ts?: number): number;
    /** @override **/
    equals(other: Zone): boolean;
    /** @override **/
    get isValid(): boolean;
}
