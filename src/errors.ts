// these aren't really private, but nor are they really useful to document
import { Invalid } from "./types/invalid";

/**
 * @private
 */
class TsLuxonError extends Error {}

/**
 * @private
 */
export class UnitOutOfRangeError extends TsLuxonError {
  constructor(unit: string, value: unknown) {
    super(`you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);

    // See https://github.com/facebook/jest/issues/8279#issuecomment-539775425
    Object.setPrototypeOf(this, UnitOutOfRangeError.prototype);
  }
}


/**
 * @private
 */
export class InvalidDateTimeError extends TsLuxonError {
  constructor(reason: Invalid) {
    super(`Invalid DateTime: ${reason.toMessage()}`);
  }
}

/**
 * @private
 */
export class InvalidDurationError extends TsLuxonError {
  constructor(reason: Invalid) {
    super(`Invalid Duration: ${reason.toMessage()}`);
  }
}


/**
 * @private
 */
export class InvalidUnitError extends TsLuxonError {
  constructor(unit: string) {
    super(`Invalid unit ${unit}`);
    Object.setPrototypeOf(this, InvalidUnitError.prototype);
  }
}

/**
 * @private
 */
export class InvalidZoneError extends TsLuxonError {
  constructor(zoneName: string) {
    super(`${zoneName} is an invalid or unknown zone specifier`);
    Object.setPrototypeOf(this, InvalidZoneError.prototype);
  }
}

/**
 * @private
 */
export class MissingPlatformFeatureError extends TsLuxonError {
  constructor(feature: string) {
    super(`missing ${feature} support`);
    Object.setPrototypeOf(this, MissingPlatformFeatureError.prototype);
  }
}

/**
 * @private
 */
export class MismatchedWeekdayError extends TsLuxonError {
  constructor(weekday: number, date: string) {
    super(`you can't specify both a weekday of ${weekday} and a date of ${date}`);
    Object.setPrototypeOf(this, MismatchedWeekdayError.prototype);
  }
}

/**
 * @private
 */
export class UnparsableStringError extends TsLuxonError {
  constructor(format: string, text: string) {
    super(`can't parse ${text} into format ${format}`);
    Object.setPrototypeOf(this, UnparsableStringError.prototype);
  }
}

/**
 * @private
 */
export class ConflictingSpecificationError extends TsLuxonError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConflictingSpecificationError.prototype);
  }
}

/**
 * @private
 */
export class InvalidArgumentError extends TsLuxonError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidArgumentError.prototype);
  }
}

/**
 * @private
 */
export class ZoneIsAbstractError extends TsLuxonError {
  constructor() {
    super("Zone is an abstract class");
    Object.setPrototypeOf(this, ZoneIsAbstractError.prototype);
  }
}
