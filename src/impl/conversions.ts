import {
    integerBetween,
    isLeapYear,
    timeObject,
    daysInYear,
    daysInMonth,
    weeksInWeekYear,
    isInteger,
    isDefined, FALLBACK_WEEK_SETTINGS
} from "./util";
import {
    TimeObject,
    WeekDateTime,
    GregorianDateTime,
    OrdinalDateTime,
    GenericDateTimeExtended
} from "../types/datetime";
import { Invalid } from "../types/invalid";
import { ConflictingSpecificationError } from "../errors";
import { Locale } from "./locale";

const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

function unitOutOfRange(unit: string, value: number | string): Invalid {
    return new Invalid(
      "unit out of range",
      `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`
    );
}

function computeOrdinal(year: number, month: number, day: number): number {
    return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}

function uncomputeOrdinal(year: number, ordinal: number): { month: number, day: number } {
    const table = isLeapYear(year) ? leapLadder : nonLeapLadder;
    const month0 = table.findIndex(i => i < ordinal);
    const day = ordinal - table[month0];

    return { month: month0 + 1, day };
}

export function dayOfWeek(year: number, month: number, day: number): number {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (year < 100 && year >= 0) {
        d.setUTCFullYear(d.getUTCFullYear() - 1900);
    }
    const js = d.getUTCDay();

    return js === 0 ? 7 : js;
}

export function gregorianToWeek(gregObj: GregorianDateTime,
                                minDaysInFirstWeek: number = FALLBACK_WEEK_SETTINGS.minimalDays,
                                startOfWeek: number = FALLBACK_WEEK_SETTINGS.firstDay): WeekDateTime {
    const { year, month, day } = gregObj;
    const ordinal = computeOrdinal(year, month, day);
    const weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);

    let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7),
      weekYear;

    if (weekNumber < 1) {
        weekYear = year - 1;
        weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
    }
    else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
        weekYear = year + 1;
        weekNumber = 1;
    }
    else {
        weekYear = year;
    }

    return { weekYear, weekNumber, weekday, ...timeObject(gregObj) };
}

export function weekToGregorian(weekData: WeekDateTime, minDaysInFirstWeek: number = FALLBACK_WEEK_SETTINGS.minimalDays, startOfWeek: number = FALLBACK_WEEK_SETTINGS.firstDay): GregorianDateTime {
    const { weekYear, weekNumber, weekday } = weekData;
    const weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek);
    const yearInDays = daysInYear(weekYear);

    let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek,
      year;

    if (ordinal < 1) {
        year = weekYear - 1;
        ordinal += daysInYear(year);
    }
    else if (ordinal > yearInDays) {
        year = weekYear + 1;
        ordinal -= daysInYear(weekYear);
    }
    else {
        year = weekYear;
    }

    const { month, day } = uncomputeOrdinal(year, ordinal);

    return { year, month, day, ...timeObject(weekData) };
}

export function gregorianToOrdinal(gregData: GregorianDateTime): OrdinalDateTime {
    const { year, month, day } = gregData;
    const ordinal = computeOrdinal(year, month, day);

    return { year, ordinal, ...timeObject(gregData) };
}

export function ordinalToGregorian(ordinalData: OrdinalDateTime): GregorianDateTime {
    const { year, ordinal } = ordinalData;
    const { month, day } = uncomputeOrdinal(year, ordinal);

    return { year, month, day, ...timeObject(ordinalData) };
}

export function hasInvalidWeekData(obj: WeekDateTime, minDaysInFirstWeek: number = 4, startOfWeek: number = 1): Invalid | false {
    const validYear = isInteger(obj.weekYear),
      validWeek = integerBetween(
        obj.weekNumber,
        1,
        weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)
      ),
      validWeekday = integerBetween(obj.weekday, 1, 7);

    if (!validYear) {
        return unitOutOfRange("weekYear", obj.weekYear);
    }
    else if (!validWeek) {
        return unitOutOfRange("week", obj.weekNumber);
    }
    else if (!validWeekday) {
        return unitOutOfRange("weekday", obj.weekday);
    }

    return false;
}

export function hasInvalidOrdinalData(obj: OrdinalDateTime): Invalid | false {
    const validYear = isInteger(obj.year),
      validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));

    if (!validYear) {
        return unitOutOfRange("year", obj.year);
    }
    else if (!validOrdinal) {
        return unitOutOfRange("ordinal", obj.ordinal);
    }

    return false;
}

export function hasInvalidGregorianData(obj: GregorianDateTime): Invalid | false {
    const validYear = isInteger(obj.year),
      validMonth = integerBetween(obj.month, 1, 12),
      validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));

    if (!validYear) {
        return unitOutOfRange("year", obj.year);
    }
    else if (!validMonth) {
        return unitOutOfRange("month", obj.month);
    }
    else if (!validDay) {
        return unitOutOfRange("day", obj.day);
    }

    return false;
}

export function hasInvalidTimeData(obj: TimeObject): Invalid | false {
    const { hour, minute, second, millisecond } = obj;
    const validHour =
        integerBetween(hour, 0, 23) ||
        (hour === 24 && minute === 0 && second === 0 && millisecond === 0),
      validMinute = integerBetween(minute, 0, 59),
      validSecond = integerBetween(second, 0, 59),
      validMillisecond = integerBetween(millisecond, 0, 999);

    if (!validHour) {
        return unitOutOfRange("hour", hour);
    }
    else if (!validMinute) {
        return unitOutOfRange("minute", minute);
    }
    else if (!validSecond) {
        return unitOutOfRange("second", second);
    }
    else if (!validMillisecond) {
        return unitOutOfRange("millisecond", millisecond);
    }

    return false;
}

export function isoWeekdayToLocal(isoWeekday: number, startOfWeek: number): number {
    return ((isoWeekday - startOfWeek + 7) % 7) + 1;
}

/**
 * Check if local week units like localWeekday are used in obj.
 * If so, validates that they are not mixed with ISO week units and then copies them to the normal week unit properties.
 * Modifies obj in-place!
 * @param obj the object values
 * @param loc
 */
export function usesLocalWeekValues(obj: GenericDateTimeExtended, loc: Locale): { minDaysInFirstWeek: number; startOfWeek: number } {
    const hasLocaleWeekData =
      isDefined(obj.localWeekday) ||
      isDefined(obj.localWeekNumber) ||
      isDefined(obj.localWeekYear);
    if (hasLocaleWeekData) {
        const hasIsoWeekData =
          isDefined(obj.weekday) || isDefined(obj.weekNumber) || isDefined(obj.weekYear);

        if (hasIsoWeekData) {
            throw new ConflictingSpecificationError(
              "Cannot mix locale-based week fields with ISO-based week fields"
            );
        }
        if (isDefined(obj.localWeekday)) {
            obj.weekday = obj.localWeekday;
        }
        if (isDefined(obj.localWeekNumber)) {
            obj.weekNumber = obj.localWeekNumber;
        }
        if (isDefined(obj.localWeekYear)) {
            obj.weekYear = obj.localWeekYear;
        }
        delete obj.localWeekday;
        delete obj.localWeekNumber;
        delete obj.localWeekYear;
        return {
            minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
            startOfWeek: loc.getStartOfWeek()
        };
    }
    else {
        return { minDaysInFirstWeek: FALLBACK_WEEK_SETTINGS.minimalDays, startOfWeek: FALLBACK_WEEK_SETTINGS.firstDay };
    }
}
