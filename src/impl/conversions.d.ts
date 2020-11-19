import { TimeObject, WeekDateTime, GregorianDateTime, OrdinalDateTime } from "../types/datetime";
/**
 * @private
 */
export declare function gregorianToWeek(gregObj: GregorianDateTime): WeekDateTime;
export declare function weekToGregorian(weekData: WeekDateTime): {
    year: number;
    month: number;
    day: number;
} & TimeObject;
export declare function gregorianToOrdinal(gregData: GregorianDateTime): OrdinalDateTime;
export declare function ordinalToGregorian(ordinalData: OrdinalDateTime): {
    year: number;
    month: number;
    day: number;
} & TimeObject;
export declare type UnitError = [string, number] | null;
export declare function hasInvalidWeekData(obj: WeekDateTime): UnitError;
export declare function hasInvalidOrdinalData(obj: OrdinalDateTime): UnitError;
export declare function hasInvalidGregorianData(obj: GregorianDateTime): UnitError;
export declare function hasInvalidTimeData(obj: TimeObject): UnitError;
