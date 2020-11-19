import { ZoneOffsetOptions, ZoneOffsetFormat } from "./types/zone";
/**
 * An abstract Zone class
 * @interface
 */
export default abstract class Zone {
    /**
     * The type of zone
     * @abstract
     * @type {string}
     */
    get type(): string;
    /**
     * The name of this zone.
     * @abstract
     * @type {string}
     */
    get name(): string;
    /**
     * Returns whether the offset is known to be fixed for the whole year.
     * @abstract
     * @type {boolean}
     */
    get isUniversal(): boolean;
    /**
     * Returns the offset's common name (such as EST) at the specified timestamp
     * @abstract
     * @param {number} [ts] - Epoch milliseconds for which to get the name
     * @param {Object} [options] - Options to affect the format
     * @param {string} [options.format] - What style of offset to return. Accepts 'long' or 'short'.
     * @param {string} [options.locale] - What locale to return the offset name in.
     * @return {string | null}
     */
    offsetName(ts?: number, options?: ZoneOffsetOptions): string | null;
    /**
     * Returns the offset's value as a string
     * @abstract
     * @param {number} ts - Epoch milliseconds for which to get the offset
     * @param {string} format - What style of offset to return.
     *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
     * @return {string}
     */
    formatOffset(ts: number, format: ZoneOffsetFormat): string;
    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     * @abstract
     * @param {number} ts - Epoch milliseconds for which to compute the offset
     * @return {number}
     */
    offset(ts: number): number;
    /**
     * Return whether this Zone is equal to another zone
     * @abstract
     * @param {Zone} other - the zone to compare
     * @return {boolean}
     */
    equals(other: Zone): boolean;
    /**
     * Return whether this Zone is valid.
     * @abstract
     * @type {boolean}
     */
    get isValid(): boolean;
}
