import { __extends } from "tslib";
import { formatOffset, parseZoneInfo, hasIntl } from "../impl/util";
import Zone from "../zone";
var singleton = null;
/**
 * Represents the system's local zone for this Javascript environment.
 * @implements {Zone}
 */
var SystemZone = /** @class */ (function (_super) {
    __extends(SystemZone, _super);
    function SystemZone() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SystemZone, "instance", {
        /**
         * Get a singleton instance of the system's local zone
         * @return {SystemZone}
         */
        get: function () {
            if (singleton === null) {
                singleton = new SystemZone();
            }
            return singleton;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SystemZone.prototype, "type", {
        /** @override **/
        get: function () {
            return "system";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SystemZone.prototype, "name", {
        /** @override **/
        get: function () {
            if (hasIntl()) {
                return new Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
            else
                return "system";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SystemZone.prototype, "isUniversal", {
        /** @override **/
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    /** @override **/
    SystemZone.prototype.offsetName = function (ts, _a) {
        var _b = _a === void 0 ? {} : _a, format = _b.format, locale = _b.locale;
        return parseZoneInfo(ts, format, locale);
    };
    /** @override **/
    SystemZone.prototype.formatOffset = function (ts, format) {
        return formatOffset(this.offset(ts), format);
    };
    /** @override **/
    SystemZone.prototype.offset = function (ts) {
        return -new Date(ts).getTimezoneOffset();
    };
    /** @override **/
    SystemZone.prototype.equals = function (other) {
        return other.type === "system";
    };
    Object.defineProperty(SystemZone.prototype, "isValid", {
        /** @override **/
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    return SystemZone;
}(Zone));
export default SystemZone;
//# sourceMappingURL=systemZone.js.map