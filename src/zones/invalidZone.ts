import {Zone} from "../zone.js";

/**
 * A zone that failed to parse. You should never need to instantiate this.
 * @implements {Zone}
 */
export class InvalidZone extends Zone {

    /** @override **/
    get isUniversal(): boolean {
        return false;
    }


    /** @override **/
    get isValid(): false {
        return false;
    }


    /** @override **/
    get name(): string {
        return this._zoneName;
    }

    /** @override **/
    get type(): "invalid" {
        return "invalid";
    }

    constructor(private _zoneName: string) {
        super();
        Object.setPrototypeOf(this, InvalidZone.prototype);
    }

    /** @override **/
    equals(): false {
        return false;
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
    offsetName(): null {
        return null;
    }

}
