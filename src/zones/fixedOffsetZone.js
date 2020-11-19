import { __extends } from "tslib";
import { formatOffset, signedOffset } from "../impl/util";
import Zone from "../zone";
var singleton;
/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */
var FixedOffsetZone = /** @class */ (function (_super) {
    __extends(FixedOffsetZone, _super);
    function FixedOffsetZone(offset) {
        var _this = _super.call(this) || this;
        /** @private **/
        _this.fixed = offset;
        return _this;
    }
    Object.defineProperty(FixedOffsetZone, "utcInstance", {
        /**
         * Get a singleton instance of UTC
         * @return {FixedOffsetZone}
         */
        get: function () {
            if (singleton === undefined) {
                singleton = new FixedOffsetZone(0);
            }
            return singleton;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get an instance with a specified offset
     * @param {number} offset - The offset in minutes
     * @return {FixedOffsetZone}
     */
    FixedOffsetZone.instance = function (offset) {
        return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
    };
    /**
     * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
     * @param {string} s - The offset string to parse
     * @example FixedOffsetZone.parseSpecifier("UTC+6")
     * @example FixedOffsetZone.parseSpecifier("UTC+06")
     * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
     * @return {FixedOffsetZone | null}
     */
    FixedOffsetZone.parseSpecifier = function (s) {
        if (s) {
            var regexp = /^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i;
            var r = regexp.exec(s);
            if (r !== null) {
                return new FixedOffsetZone(signedOffset(r[1], r[2]));
            }
        }
        return null;
    };
    Object.defineProperty(FixedOffsetZone.prototype, "type", {
        /** @override **/
        get: function () {
            return "fixed";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FixedOffsetZone.prototype, "name", {
        /** @override **/
        get: function () {
            return this.fixed === 0 ? "UTC" : "UTC" + formatOffset(this.fixed, "narrow");
        },
        enumerable: false,
        configurable: true
    });
    /** @override **/
    FixedOffsetZone.prototype.offsetName = function (_ts, _options) {
        return this.name;
    };
    /** @override **/
    FixedOffsetZone.prototype.formatOffset = function (_ts, format) {
        return formatOffset(this.fixed, format);
    };
    Object.defineProperty(FixedOffsetZone.prototype, "isUniversal", {
        /** @override **/
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    /** @override **/
    FixedOffsetZone.prototype.offset = function (_ts) {
        return this.fixed;
    };
    /** @override **/
    FixedOffsetZone.prototype.equals = function (other) {
        return other.type === "fixed" && other.fixed === this.fixed;
    };
    Object.defineProperty(FixedOffsetZone.prototype, "isValid", {
        /** @override **/
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    return FixedOffsetZone;
}(Zone));
export default FixedOffsetZone;
//# sourceMappingURL=fixedOffsetZone.js.map