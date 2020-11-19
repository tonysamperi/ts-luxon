import Zone from "../zone";
import { ZoneOffsetOptions, ZoneOffsetFormat } from "../types/zone";
/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */
export default class IANAZone extends Zone {
    private readonly zoneName;
    private readonly valid;
    /**
     * @param {string} name - Zone name
     * @return {IANAZone}
     */
    static create(name: string): IANAZone;
    /**
     * Reset local caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    static resetCache(): void;
    /**
     * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
     * @param {string} s - The string to check validity on
     * @example IANAZone.isValidSpecifier("America/New_York") //=> true
     * @example IANAZone.isValidSpecifier("Fantasia/Castle") //=> true
     * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
     * @return {boolean}
     */
    static isValidSpecifier(s: string): boolean;
    /**
     * Returns whether the provided string identifies a real zone
     * @param {string} zone - The string to check
     * @example IANAZone.isValidZone("America/New_York") //=> true
     * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
     * @example IANAZone.isValidZone("Sport~~blorp") //=> false
     * @return {boolean}
     */
    static isValidZone(zone: string): boolean;
    /** @ignore */
    static parseGMTOffset(specifier: string): number | null;
    private constructor();
    /** @override **/
    get type(): string;
    /** @override **/
    get name(): string;
    /** @override **/
    get isUniversal(): boolean;
    /** @override **/
    offsetName(ts: number, { format, locale }?: ZoneOffsetOptions): string | null;
    /** @override **/
    formatOffset(ts: number, format: ZoneOffsetFormat): string;
    /** @override **/
    offset(ts: number): number;
    /** @override **/
    equals(other: Zone): boolean;
    /** @override **/
    get isValid(): boolean;
}
