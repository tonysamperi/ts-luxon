import { ZoneIsAbstractError } from "./errors";
// Prefixing the parameter names with a _ confuses ESDoc
function silenceUnusedWarning() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    args.length;
}
/**
 * An abstract Zone class
 * @interface
 */
var Zone = /** @class */ (function () {
    function Zone() {
    }
    Object.defineProperty(Zone.prototype, "type", {
        /**
         * The type of zone
         * @abstract
         * @type {string}
         */
        get: function () {
            throw new ZoneIsAbstractError();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Zone.prototype, "name", {
        /**
         * The name of this zone.
         * @abstract
         * @type {string}
         */
        get: function () {
            throw new ZoneIsAbstractError();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Zone.prototype, "isUniversal", {
        /**
         * Returns whether the offset is known to be fixed for the whole year.
         * @abstract
         * @type {boolean}
         */
        get: function () {
            throw new ZoneIsAbstractError();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the offset's common name (such as EST) at the specified timestamp
     * @abstract
     * @param {number} [ts] - Epoch milliseconds for which to get the name
     * @param {Object} [options] - Options to affect the format
     * @param {string} [options.format] - What style of offset to return. Accepts 'long' or 'short'.
     * @param {string} [options.locale] - What locale to return the offset name in.
     * @return {string | null}
     */
    Zone.prototype.offsetName = function (ts, options) {
        silenceUnusedWarning(ts, options);
        throw new ZoneIsAbstractError();
    };
    /**
     * Returns the offset's value as a string
     * @abstract
     * @param {number} ts - Epoch milliseconds for which to get the offset
     * @param {string} format - What style of offset to return.
     *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
     * @return {string}
     */
    Zone.prototype.formatOffset = function (ts, format) {
        silenceUnusedWarning(ts, format);
        throw new ZoneIsAbstractError();
    };
    /**
     * Return the offset in minutes for this zone at the specified timestamp.
     * @abstract
     * @param {number} ts - Epoch milliseconds for which to compute the offset
     * @return {number}
     */
    Zone.prototype.offset = function (ts) {
        silenceUnusedWarning(ts);
        throw new ZoneIsAbstractError();
    };
    /**
     * Return whether this Zone is equal to another zone
     * @abstract
     * @param {Zone} other - the zone to compare
     * @return {boolean}
     */
    Zone.prototype.equals = function (other) {
        silenceUnusedWarning(other);
        throw new ZoneIsAbstractError();
    };
    Object.defineProperty(Zone.prototype, "isValid", {
        /**
         * Return whether this Zone is valid.
         * @abstract
         * @type {boolean}
         */
        get: function () {
            throw new ZoneIsAbstractError();
        },
        enumerable: false,
        configurable: true
    });
    return Zone;
}());
export default Zone;
//# sourceMappingURL=zone.js.map