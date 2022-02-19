/**
 * @private
 */

import { Zone } from "../zone";
import { IANAZone } from "../zones/IANAZone";
import { FixedOffsetZone } from "../zones/fixedOffsetZone";
import { isUndefined, isString, isNumber } from "./util";
import { ZoneLike } from "../types/zone";
import { InvalidZone } from "../zones/invalidZone";

export const normalizeZone = (input: ZoneLike, defaultZone: Zone): Zone => {
    if (isUndefined(input) || input === null) {
        return defaultZone;
    }
    else if (input instanceof Zone) {
        return input;
    }
    else if (isString(input)) {
        const lowered = input.toLowerCase();
        if (lowered === "local" || lowered === "system") {
            return defaultZone;
        }
        else if (lowered === "utc" || lowered === "gmt") {
            return FixedOffsetZone.utcInstance;
        }
        else {
            return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
        }
    }
    else if (isNumber(input)) {
        return FixedOffsetZone.instance(input);
    }
    else if (typeof input === "object" && input["offset"] && typeof input["offset"] === "number") {
        // This is dumb, but the instanceof check above doesn't seem to really work
        // so we're duck checking it
        return input;
    }
    else {
        return new InvalidZone(input);
    }
};
