import { formatOffset, parseZoneInfo } from "../impl/util";
import { Zone } from "../zone";
import { ZoneOffsetFormat, ZoneOffsetOptions } from "../types/zone";

let singleton: SystemZone | null = null;

/**
 * Represents the local zone for this JavaScript environment.
 * @implements {Zone}
 */
export class SystemZone extends Zone {
    /**
     * Get a singleton instance of the local zone
     * @return {SystemZone}
     */
    static get instance() {
        if (singleton === null) {
            singleton = new SystemZone();
        }
        return singleton;
    }

    /** @override **/
    get type() {
        return "system";
    }

    /** @override **/
    get name() {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /** @override **/
    get isUniversal() {
        return false;
    }

    /** @override **/
    offsetName(ts: number, { format, locale }: ZoneOffsetOptions) {
        return parseZoneInfo(ts, format, locale);
    }

    /** @override **/
    formatOffset(ts: number, format: ZoneOffsetFormat) {
        return formatOffset(this.offset(ts), format);
    }

    /** @override **/
    offset(ts: number) {
        return -new Date(ts).getTimezoneOffset();
    }

    /** @override **/
    equals(otherZone: Zone) {
        return otherZone.type === "system";
    }

    /** @override **/
    get isValid() {
        return true;
    }
}
