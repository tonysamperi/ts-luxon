import { Zone } from "../zone";

/**
 * A zone that failed to parse. You should never need to instantiate this.
 * @implements {Zone}
 */
export class InvalidZone extends Zone {

  constructor(private _zoneName: string) {
    super();
    Object.setPrototypeOf(this, InvalidZone.prototype);
  }

  /** @override **/
  get type(): "invalid" {
    return "invalid";
  }

  /** @override **/
  get name(): string {
    return this._zoneName;
  }

  /** @override **/
  get isUniversal(): boolean {
    return false;
  }

  /** @override **/
  offsetName(): null {
    return null;
  }

  /** @override **/
  formatOffset(): "" {
    return "";
  }

  /** @override **/
  offset(): number {
    return NaN;
  }

  /** @override **/
  equals(): false {
    return false;
  }

  /** @override **/
  get isValid(): false {
    return false;
  }
}
