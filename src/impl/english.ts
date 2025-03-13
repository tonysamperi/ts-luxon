import * as Formats from "./formats.js";
import { pick } from "./util.js";
import { UnitLength, StringUnitLength } from "../types/common.js";
import { DateTime } from "../datetime.js";
import { Duration } from "../duration.js";

function stringify(obj: Record<string, unknown>) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * @private
 */

// tslint:disable-next-line:naming-convention
export const monthsLong = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

// tslint:disable-next-line:naming-convention
export const monthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

// tslint:disable-next-line:naming-convention
export const monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function months(length: UnitLength): string[] {
    switch (length) {
        case "narrow":
            return [...monthsNarrow];
        case "short":
            return [...monthsShort];
        case "long":
            return [...monthsLong];
        case "numeric":
            return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        case "2-digit":
            return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    }
}

// tslint:disable-next-line:naming-convention
export const weekdaysLong = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

// tslint:disable-next-line:naming-convention
export const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// tslint:disable-next-line:naming-convention
export const weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];

export function weekdays(length: StringUnitLength | "numeric"): string[] {
    switch (length) {
        case "narrow":
            return [...weekdaysNarrow];
        case "short":
            return [...weekdaysShort];
        case "long":
            return [...weekdaysLong];
        case "numeric":
            return ["1", "2", "3", "4", "5", "6", "7"];
        default:
            return null;
    }
}

// tslint:disable-next-line:naming-convention
export const meridiems = ["AM", "PM"];

// tslint:disable-next-line:naming-convention
export const erasLong = ["Before Christ", "Anno Domini"];

// tslint:disable-next-line:naming-convention
export const erasShort = ["BC", "AD"];

// tslint:disable-next-line:naming-convention
export const erasNarrow = ["B", "A"];

export function eras(length: StringUnitLength): string[] {
    switch (length) {
        case "narrow":
            return [...erasNarrow];
        case "short":
            return [...erasShort];
        case "long":
            return [...erasLong];
        default:
            return null;
    }
}

export function meridiemForDateTime(dt: DateTime): string {
    return meridiems[dt.hour < 12 ? 0 : 1];
}

export function weekdayForDateTime(dt: DateTime, length: StringUnitLength) {
    return weekdays(length)[dt.weekday - 1];
}

export function monthForDateTime(dt: DateTime, length: UnitLength) {
    return months(length)[dt.month - 1];
}

export function eraForDateTime(dt: DateTime, length: StringUnitLength) {
    return eras(length)[dt.year < 0 ? 0 : 1];
}

export function formatRelativeTime(
    unit: Intl.RelativeTimeFormatUnit,
    count: number,
    numeric: Intl.RelativeTimeFormatNumeric = "always",
    narrow = false
): string {
    const units = {
        years: ["year", "yr."],
        quarters: ["quarter", "qtr."],
        months: ["month", "mo."],
        weeks: ["week", "wk."],
        days: ["day", "day", "days"],
        hours: ["hour", "hr."],
        minutes: ["minute", "min."],
        seconds: ["second", "sec."],
        milliseconds: [] as string[] // never used
    };

    const normalizedUnit = Duration.normalizeUnit(unit),
        unitTexts = units[normalizedUnit],
        lastable = ["hours", "minutes", "seconds"].indexOf(normalizedUnit) === -1;

    if (numeric === "auto" && lastable) {
        const isDay = normalizedUnit === "days";
        switch (count) {
            case 1:
                return isDay ? "tomorrow" : `next ${unitTexts[0]}`;
            case -1:
                return isDay ? "yesterday" : `last ${unitTexts[0]}`;
            case 0:
                return isDay ? "today" : `this ${unitTexts[0]}`;
            default: // fall through
        }
    }

    const isInPast = Object.is(count, -0) || count < 0,
        formatValue = Math.abs(count),
        singular = formatValue === 1,
        formatUnit = narrow
            ? singular
                ? unitTexts[1]
                : unitTexts[2] || unitTexts[1]
            : singular
                ? unitTexts[0]
                : normalizedUnit;
    return isInPast ? `${formatValue} ${formatUnit} ago` : `in ${formatValue} ${formatUnit}`;
}

export function formatString(knownFormat: Intl.DateTimeFormatOptions) {
    // these all have the offsets removed because we don't have access to them
    // without all the intl stuff this is backfilling
    const filtered = pick(knownFormat, [
            "weekday",
            "era",
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "timeZoneName",
            "hourCycle"
        ]),
        key = stringify(filtered),
        dateTimeHuge = "EEEE, LLLL d, yyyy, h:mm a";
    switch (key) {
        case stringify(Formats.DATE_SHORT):
            return "M/d/yyyy";
        case stringify(Formats.DATE_MED):
            return "LLL d, yyyy";
        case stringify(Formats.DATE_MED_WITH_WEEKDAY):
            return "EEE, LLL d, yyyy";
        case stringify(Formats.DATE_FULL):
            return "LLLL d, yyyy";
        case stringify(Formats.DATE_HUGE):
            return "EEEE, LLLL d, yyyy";
        case stringify(Formats.TIME_SIMPLE):
            return "h:mm a";
        case stringify(Formats.TIME_WITH_SECONDS):
            return "h:mm:ss a";
        case stringify(Formats.TIME_WITH_SHORT_OFFSET):
            return "h:mm a";
        case stringify(Formats.TIME_WITH_LONG_OFFSET):
            return "h:mm a";
        case stringify(Formats.TIME_24_SIMPLE):
            return "HH:mm";
        case stringify(Formats.TIME_24_WITH_SECONDS):
            return "HH:mm:ss";
        case stringify(Formats.TIME_24_WITH_SHORT_OFFSET):
            return "HH:mm";
        case stringify(Formats.TIME_24_WITH_LONG_OFFSET):
            return "HH:mm";
        case stringify(Formats.DATETIME_SHORT):
            return "M/d/yyyy, h:mm a";
        case stringify(Formats.DATETIME_MED):
            return "LLL d, yyyy, h:mm a";
        case stringify(Formats.DATETIME_FULL):
            return "LLLL d, yyyy, h:mm a";
        case stringify(Formats.DATETIME_HUGE):
            return dateTimeHuge;
        case stringify(Formats.DATETIME_SHORT_WITH_SECONDS):
            return "M/d/yyyy, h:mm:ss a";
        case stringify(Formats.DATETIME_MED_WITH_SECONDS):
            return "LLL d, yyyy, h:mm:ss a";
        case stringify(Formats.DATETIME_MED_WITH_WEEKDAY):
            return "EEE, d LLL yyyy, h:mm a";
        case stringify(Formats.DATETIME_FULL_WITH_SECONDS):
            return "LLLL d, yyyy, h:mm:ss a";
        case stringify(Formats.DATETIME_HUGE_WITH_SECONDS):
            return "EEEE, LLLL d, yyyy, h:mm:ss a";
        default:
            return dateTimeHuge;
    }
}
