// these aren't really private, but nor are they really useful to document
import { Invalid } from "./types/invalid";

/**
 * @private
 */
class TsLuxonError extends Error {
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
export class InvalidIntervalError extends TsLuxonError {
  constructor(reason: Invalid) {
    super(`Invalid Interval: ${reason.toMessage()}`);
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
