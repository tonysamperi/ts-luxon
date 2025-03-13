/**
 * @private
 */

import { Zone } from "../zone.js";
import { IANAZone } from "../zones/IANAZone.js";
import { FixedOffsetZone } from "../zones/fixedOffsetZone.js";
import { isUndefined, isString, isNumber } from "./util.js";
import { ZoneLike } from "../types/zone.js";
import { InvalidZone } from "../zones/invalidZone.js";
import { SystemZone } from "../zones/systemZone.js";

export const normalizeZone = (input: ZoneLike, defaultZone: Zone): Zone => {
    if (isUndefined(input) || input === null) {
        return defaultZone;
    }
    else if (input instanceof Zone) {
        return input;
    }
    else if (isString(input)) {
        const lowered = input.toLowerCase();
        if (lowered === "default") {
            return defaultZone;
        }
        else if (lowered === "local" || lowered === "system") {
            return SystemZone.instance;
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
    else if (typeof input === "object" && "offset" in input && typeof input["offset"] === "function") {
        // This is dumb, but the instanceof check above doesn't seem to really work, so we're duck checking it
        return input;
    }
    else {
        return new InvalidZone(input);
    }
};
