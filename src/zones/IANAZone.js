import { __extends } from "tslib";
import { formatOffset, parseZoneInfo, isUndefined, ianaRegex, objToLocalTS } from "../impl/util";
import Zone from "../zone";
import { InvalidZoneError } from "../errors";
var matchingRegex = RegExp("^" + ianaRegex.source + "$");
var dtfCache = {};
function makeDTF(zone) {
    if (!dtfCache[zone]) {
        try {
            dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
                hour12: false,
                timeZone: zone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
        catch (_a) {
            throw new InvalidZoneError(zone);
        }
    }
    return dtfCache[zone];
}
var typeToPos = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4,
    second: 5
};
function hackyOffset(dtf, date) {
    var formatted = dtf.format(date).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(formatted);
    if (parsed !== null) {
        var month = parsed[1], day = parsed[2], year = parsed[3], hour = parsed[4], minute = parsed[5], second = parsed[6];
        return [
            parseInt(year, 10),
            parseInt(month, 10),
            parseInt(day, 10),
            parseInt(hour, 10),
            parseInt(minute, 10),
            parseInt(second, 10)
        ];
    }
    return [0, 0, 0, 0, 0, 0];
}
function partsOffset(dtf, date) {
    var formatted = dtf.formatToParts(date), filled = [];
    for (var i = 0; i < formatted.length; i++) {
        var _a = formatted[i], type = _a.type, value = _a.value, pos = typeToPos[type];
        if (!isUndefined(pos)) {
            filled[pos] = parseInt(value, 10);
        }
    }
    return filled;
}
var ianaZoneCache = {};
/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */
var IANAZone = /** @class */ (function (_super) {
    __extends(IANAZone, _super);
    function IANAZone(name) {
        var _this = _super.call(this) || this;
        /** @private **/
        _this.zoneName = name;
        /** @private **/
        _this.valid = IANAZone.isValidZone(name);
        return _this;
    }
    /**
     * @param {string} name - Zone name
     * @return {IANAZone}
     */
    IANAZone.create = function (name) {
        if (!ianaZoneCache[name]) {
            ianaZoneCache[name] = new IANAZone(name);
        }
        return ianaZoneCache[name];
    };
    /**
     * Reset local caches. Should only be necessary in testing scenarios.
     * @return {void}
     */
    IANAZone.resetCache = function () {
        ianaZoneCache = {};
        dtfCache = {};
    };
    /**
     * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
     * @param {string} s - The string to check validity on
     * @example IANAZone.isValidSpecifier("America/New_York") //=> true
     * @example IANAZone.isValidSpecifier("Fantasia/Castle") //=> true
     * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
     * @return {boolean}
     */
    IANAZone.isValidSpecifier = function (s) {
        return !!(s && matchingRegex.exec(s) !== null);
    };
    /**
     * Returns whether the provided string identifies a real zone
     * @param {string} zone - The string to check
     * @example IANAZone.isValidZone("America/New_York") //=> true
     * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
     * @example IANAZone.isValidZone("Sport~~blorp") //=> false
     * @return {boolean}
     */
    IANAZone.isValidZone = function (zone) {
        try {
            new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
            return true;
        }
        catch (e) {
            return false;
        }
    };
    // Etc/GMT+8 -> -480
    /** @ignore */
    IANAZone.parseGMTOffset = function (specifier) {
        if (specifier) {
            var regexp = /^Etc\/GMT([+-]\d{1,2})$/i;
            var match = regexp.exec(specifier);
            if (match !== null) {
                return -60 * parseInt(match[1]);
            }
        }
        return null;
    };
    Object.defineProperty(IANAZone.prototype, "type", {
        /** @override **/
        get: function () {
            return "iana";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IANAZone.prototype, "name", {
        /** @override **/
        get: function () {
            return this.zoneName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IANAZone.prototype, "isUniversal", {
        /** @override **/
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    /** @override **/
    IANAZone.prototype.offsetName = function (ts, _a) {
        var _b = _a === void 0 ? {} : _a, format = _b.format, locale = _b.locale;
        return parseZoneInfo(ts, format, locale, this.name);
    };
    /** @override **/
    IANAZone.prototype.formatOffset = function (ts, format) {
        return formatOffset(this.offset(ts), format);
    };
    /** @override **/
    IANAZone.prototype.offset = function (ts) {
        var date = new Date(ts), dtf = makeDTF(this.name), _a = dtf.formatToParts === undefined ? hackyOffset(dtf, date) : partsOffset(dtf, date), year = _a[0], month = _a[1], day = _a[2], hour = _a[3], minute = _a[4], second = _a[5], 
        // work around https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
        adjustedHour = hour === 24 ? 0 : hour;
        var asUTC = objToLocalTS({
            year: year,
            month: month,
            day: day,
            hour: adjustedHour,
            minute: minute,
            second: second,
            millisecond: 0
        });
        var asTS = date.valueOf();
        var over = asTS % 1000;
        asTS -= over >= 0 ? over : 1000 + over;
        return (asUTC - asTS) / (60 * 1000);
    };
    /** @override **/
    IANAZone.prototype.equals = function (other) {
        return other.type === "iana" && other.name === this.name;
    };
    Object.defineProperty(IANAZone.prototype, "isValid", {
        /** @override **/
        get: function () {
            return this.valid;
        },
        enumerable: false,
        configurable: true
    });
    return IANAZone;
}(Zone));
export default IANAZone;
//# sourceMappingURL=IANAZone.js.map