import {formatOffset, parseZoneInfo} from "../impl/util.js";
import {Zone} from "../zone.js";
import {ZoneOffsetFormat, ZoneOffsetOptions} from "../types/zone.js";

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
    get isUniversal() {
        return false;
    }

    /** @override **/
    get isValid() {
        return true;
    }

    /** @override **/
    get name(): string {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /** @override **/
    get type(): "system" {
        return "system";
    }

    /** @override **/
    equals(otherZone: Zone) {
        return otherZone.type === "system";
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
    offsetName(ts: number, {format, locale}: ZoneOffsetOptions) {
        return parseZoneInfo(ts, format, locale);
    }

}
