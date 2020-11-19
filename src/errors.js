// these aren't really private, but nor are they really useful to document
import { __extends } from "tslib";
/**
 * @private
 */
var LuxonError = /** @class */ (function (_super) {
    __extends(LuxonError, _super);
    function LuxonError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LuxonError;
}(Error));
/**
 * @private
 */
var UnitOutOfRangeError = /** @class */ (function (_super) {
    __extends(UnitOutOfRangeError, _super);
    function UnitOutOfRangeError(unit, value) {
        var _this = _super.call(this, "you specified " + value + " (of type " + typeof value + ") as a " + unit + ", which is invalid") || this;
        // See https://github.com/facebook/jest/issues/8279#issuecomment-539775425
        Object.setPrototypeOf(_this, UnitOutOfRangeError.prototype);
        return _this;
    }
    return UnitOutOfRangeError;
}(LuxonError));
export { UnitOutOfRangeError };
/**
 * @private
 */
var InvalidUnitError = /** @class */ (function (_super) {
    __extends(InvalidUnitError, _super);
    function InvalidUnitError(unit) {
        var _this = _super.call(this, "Invalid unit " + unit) || this;
        Object.setPrototypeOf(_this, InvalidUnitError.prototype);
        return _this;
    }
    return InvalidUnitError;
}(LuxonError));
export { InvalidUnitError };
/**
 * @private
 */
var InvalidZoneError = /** @class */ (function (_super) {
    __extends(InvalidZoneError, _super);
    function InvalidZoneError(zoneName) {
        var _this = _super.call(this, zoneName + " is an invalid or unknown zone specifier") || this;
        Object.setPrototypeOf(_this, InvalidZoneError.prototype);
        return _this;
    }
    return InvalidZoneError;
}(LuxonError));
export { InvalidZoneError };
/**
 * @private
 */
var MissingPlatformFeatureError = /** @class */ (function (_super) {
    __extends(MissingPlatformFeatureError, _super);
    function MissingPlatformFeatureError(feature) {
        var _this = _super.call(this, "missing " + feature + " support") || this;
        Object.setPrototypeOf(_this, MissingPlatformFeatureError.prototype);
        return _this;
    }
    return MissingPlatformFeatureError;
}(LuxonError));
export { MissingPlatformFeatureError };
/**
 * @private
 */
var MismatchedWeekdayError = /** @class */ (function (_super) {
    __extends(MismatchedWeekdayError, _super);
    function MismatchedWeekdayError(weekday, date) {
        var _this = _super.call(this, "you can't specify both a weekday of " + weekday + " and a date of " + date) || this;
        Object.setPrototypeOf(_this, MismatchedWeekdayError.prototype);
        return _this;
    }
    return MismatchedWeekdayError;
}(LuxonError));
export { MismatchedWeekdayError };
/**
 * @private
 */
var UnparsableStringError = /** @class */ (function (_super) {
    __extends(UnparsableStringError, _super);
    function UnparsableStringError(format, text) {
        var _this = _super.call(this, "can't parse " + text + " into format " + format) || this;
        Object.setPrototypeOf(_this, UnparsableStringError.prototype);
        return _this;
    }
    return UnparsableStringError;
}(LuxonError));
export { UnparsableStringError };
/**
 * @private
 */
var ConflictingSpecificationError = /** @class */ (function (_super) {
    __extends(ConflictingSpecificationError, _super);
    function ConflictingSpecificationError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, ConflictingSpecificationError.prototype);
        return _this;
    }
    return ConflictingSpecificationError;
}(LuxonError));
export { ConflictingSpecificationError };
/**
 * @private
 */
var InvalidArgumentError = /** @class */ (function (_super) {
    __extends(InvalidArgumentError, _super);
    function InvalidArgumentError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, InvalidArgumentError.prototype);
        return _this;
    }
    return InvalidArgumentError;
}(LuxonError));
export { InvalidArgumentError };
/**
 * @private
 */
var ZoneIsAbstractError = /** @class */ (function (_super) {
    __extends(ZoneIsAbstractError, _super);
    function ZoneIsAbstractError() {
        var _this = _super.call(this, "Zone is an abstract class") || this;
        Object.setPrototypeOf(_this, ZoneIsAbstractError.prototype);
        return _this;
    }
    return ZoneIsAbstractError;
}(LuxonError));
export { ZoneIsAbstractError };
//# sourceMappingURL=errors.js.map