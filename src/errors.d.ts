/**
 * @private
 */
declare class LuxonError extends Error {
}
/**
 * @private
 */
export declare class UnitOutOfRangeError extends LuxonError {
    constructor(unit: string, value: unknown);
}
/**
 * @private
 */
export declare class InvalidUnitError extends LuxonError {
    constructor(unit: string);
}
/**
 * @private
 */
export declare class InvalidZoneError extends LuxonError {
    constructor(zoneName: string);
}
/**
 * @private
 */
export declare class MissingPlatformFeatureError extends LuxonError {
    constructor(feature: string);
}
/**
 * @private
 */
export declare class MismatchedWeekdayError extends LuxonError {
    constructor(weekday: number, date: string);
}
/**
 * @private
 */
export declare class UnparsableStringError extends LuxonError {
    constructor(format: string, text: string);
}
/**
 * @private
 */
export declare class ConflictingSpecificationError extends LuxonError {
    constructor(message: string);
}
/**
 * @private
 */
export declare class InvalidArgumentError extends LuxonError {
    constructor(message: string);
}
/**
 * @private
 */
export declare class ZoneIsAbstractError extends LuxonError {
    constructor();
}
export {};
