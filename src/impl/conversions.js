import { integerBetween, isLeapYear, timeObject, daysInYear, daysInMonth, weeksInWeekYear, isInteger } from "./util";
var nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function dayOfWeek(year, month, day) {
    var js = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return js === 0 ? 7 : js;
}
function computeOrdinal(year, month, day) {
    return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
    var table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex(function (i) { return i < ordinal; }), day = ordinal - table[month0];
    return { month: month0 + 1, day: day };
}
/**
 * @private
 */
export function gregorianToWeek(gregObj) {
    var year = gregObj.year, month = gregObj.month, day = gregObj.day, ordinal = computeOrdinal(year, month, day), weekday = dayOfWeek(year, month, day);
    var weekNumber = Math.floor((ordinal - weekday + 10) / 7), weekYear;
    if (weekNumber < 1) {
        weekYear = year - 1;
        weekNumber = weeksInWeekYear(weekYear);
    }
    else if (weekNumber > weeksInWeekYear(year)) {
        weekYear = year + 1;
        weekNumber = 1;
    }
    else {
        weekYear = year;
    }
    return Object.assign({ weekYear: weekYear, weekNumber: weekNumber, weekday: weekday }, timeObject(gregObj));
}
export function weekToGregorian(weekData) {
    var weekYear = weekData.weekYear, weekNumber = weekData.weekNumber, weekday = weekData.weekday, weekdayOfJan4 = dayOfWeek(weekYear, 1, 4), yearInDays = daysInYear(weekYear);
    var ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 3, year;
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
    var _a = uncomputeOrdinal(year, ordinal), month = _a.month, day = _a.day;
    return Object.assign({ year: year, month: month, day: day }, timeObject(weekData));
}
export function gregorianToOrdinal(gregData) {
    var year = gregData.year, month = gregData.month, day = gregData.day, ordinal = computeOrdinal(year, month, day);
    return Object.assign({ year: year, ordinal: ordinal }, timeObject(gregData));
}
export function ordinalToGregorian(ordinalData) {
    var year = ordinalData.year, ordinal = ordinalData.ordinal, _a = uncomputeOrdinal(year, ordinal), month = _a.month, day = _a.day;
    return Object.assign({ year: year, month: month, day: day }, timeObject(ordinalData));
}
export function hasInvalidWeekData(obj) {
    var validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear)), validWeekday = integerBetween(obj.weekday, 1, 7);
    if (!validYear) {
        return ["weekYear", obj.weekYear];
    }
    else if (!validWeek) {
        return ["weekNumber", obj.weekNumber];
    }
    else if (!validWeekday) {
        return ["weekday", obj.weekday];
    }
    else
        return null;
}
export function hasInvalidOrdinalData(obj) {
    var validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
    if (!validYear) {
        return ["year", obj.year];
    }
    else if (!validOrdinal) {
        return ["ordinal", obj.ordinal];
    }
    else
        return null;
}
export function hasInvalidGregorianData(obj) {
    var validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
    if (!validYear) {
        return ["year", obj.year];
    }
    else if (!validMonth) {
        return ["month", obj.month];
    }
    else if (!validDay) {
        return ["day", obj.day];
    }
    else
        return null;
}
export function hasInvalidTimeData(obj) {
    var hour = obj.hour, minute = obj.minute, second = obj.second, millisecond = obj.millisecond;
    var validHour = integerBetween(hour, 0, 23) ||
        (hour === 24 && minute === 0 && second === 0 && millisecond === 0), validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
    if (!validHour) {
        return ["hour", obj.hour];
    }
    else if (!validMinute) {
        return ["minute", obj.minute];
    }
    else if (!validSecond) {
        return ["second", obj.second];
    }
    else if (!validMillisecond) {
        return ["millisecond", obj.millisecond];
    }
    else
        return null;
}
//# sourceMappingURL=conversions.js.map