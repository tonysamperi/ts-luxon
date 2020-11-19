import Zone from "../zone";
import { ZoneOffsetFormat, ZoneOffsetOptions } from "../types/zone";
/**
 * Represents the system's local zone for this Javascript environment.
 * @implements {Zone}
 */
export default class SystemZone extends Zone {
    /**
     * Get a singleton instance of the system's local zone
     * @return {SystemZone}
     */
    static get instance(): SystemZone;
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
