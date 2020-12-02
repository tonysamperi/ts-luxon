import { formatOffset, signedOffset } from "../impl/util";
import { Zone} from "../zone";
import { ZoneOffsetFormat, ZoneOffsetOptions } from "../types/zone";

let singleton: FixedOffsetZone | undefined;

/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */
export class FixedOffsetZone extends Zone {
  private readonly _fixed: number;

  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    if (singleton === undefined) {
      singleton = new FixedOffsetZone(0);
    }
    return singleton;
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
   * @return {FixedOffsetZone | null}
   */
  static parseSpecifier(s: string) {
    if (s) {
      const regexp = /^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i;
      const r = regexp.exec(s);
      if (r !== null) {
        return new FixedOffsetZone(signedOffset(r[1], r[2]));
      }
    }
    return null;
  }

  constructor(offset: number) {
    super();
    /** @private **/
    this._fixed = offset;
  }

  /** @override **/
  get type() {
    return "fixed";
  }

  /** @override **/
  get name() {
    return this._fixed === 0 ? "UTC" : `UTC${formatOffset(this._fixed, "narrow")}`;
  }

  /** @override **/
  offsetName(_ts_?: number, _options_?: ZoneOffsetOptions) {
    return this.name;
  }

  /** @override **/
  formatOffset(_ts_: number, format: ZoneOffsetFormat) {
    return formatOffset(this._fixed, format);
  }

  /** @override **/
  get isUniversal() {
    return true;
  }

  /** @override **/
  offset(_ts_?: number) {
    return this._fixed;
  }

  /** @override **/
  equals(other: Zone): boolean {
    return other.type === "fixed" && (other as FixedOffsetZone)._fixed === this._fixed;
  }

  /** @override **/
  get isValid() {
    return true;
  }
}
