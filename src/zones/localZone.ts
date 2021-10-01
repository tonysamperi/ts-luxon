import { formatOffset, parseZoneInfo} from "../impl/util";
import { Zone } from "../zone";
import { ZoneOffsetFormat, ZoneOffsetOptions } from "../types/zone";

let singleton: LocalZone | null = null;

/**
 * Represents the local zone for this JavaScript environment.
 * @implements {Zone}
 */
export class LocalZone extends Zone {
  /**
   * Get a singleton instance of the local zone
   * @return {LocalZone}
   */
  static get instance() {
    if (singleton === null) {
      singleton = new LocalZone();
    }
    return singleton;
  }

  /** @override **/
  get type() {
    return "local";
  }

  /** @override **/
  get name(): string {
      return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /** @override **/
  get universal() {
    return false;
  }

  /** @override **/
  offsetName(ts: number, { format, locale }: ZoneOffsetOptions): string | null {
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
    return otherZone.type === "local";
  }

  /** @override **/
  get isValid() {
    return true;
  }
}
