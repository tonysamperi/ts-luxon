import Intl from "../types/intl-next";

/**
 * @private
 */

const n = "numeric" as const,
    s = "short" as const,
    l = "long" as const;

export const DATE_SHORT: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day"> = {
    year: n,
    month: n,
    day: n
};

export const DATE_MED: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day"> = {
    year: n,
    month: s,
    day: n
};

export const DATE_MED_WITH_WEEKDAY: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "weekday"> = {
    year: n,
    month: s,
    day: n,
    weekday: s
};

export const DATE_FULL: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day"> = {
    year: n,
    month: l,
    day: n
};

export const DATE_HUGE: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "weekday"> = {
    year: n,
    month: l,
    day: n,
    weekday: l
};

export const TIME_SIMPLE: Pick<Intl.DateTimeFormatOptions, "hour" | "minute"> = {
    hour: n,
    minute: n
};

export const TIME_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second"> = {
    hour: n,
    minute: n,
    second: n
};

export const TIME_WITH_SHORT_OFFSET: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second" | "timeZoneName"> = {
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};

export const TIME_WITH_LONG_OFFSET: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second" | "timeZoneName"> = {
    hour: n,
    minute: n,
    second: n,
    timeZoneName: l
};

export const TIME_24_SIMPLE: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "hourCycle"> = {
    hour: n,
    minute: n,
    hourCycle: "h23"
};

export const TIME_24_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second" | "hourCycle"> = {
    hour: n,
    minute: n,
    second: n,
    hourCycle: "h23"
};

export const TIME_24_WITH_SHORT_OFFSET: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second" | "hourCycle" | "timeZoneName"> = {
    hour: n,
    minute: n,
    second: n,
    hourCycle: "h23",
    timeZoneName: s
};

export const TIME_24_WITH_LONG_OFFSET: Pick<Intl.DateTimeFormatOptions, "hour" | "minute" | "second" | "hourCycle" | "timeZoneName"> = {
    hour: n,
    minute: n,
    second: n,
    hourCycle: "h23",
    timeZoneName: l
};

export const DATETIME_SHORT: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute"> = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n
};

export const DATETIME_SHORT_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute" | "second"> = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n,
    second: n
};

export const DATETIME_MED: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute"> = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n
};

export const DATETIME_MED_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute" | "second"> = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n,
    second: n
};

export const DATETIME_MED_WITH_WEEKDAY: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "weekday" | "hour" | "minute"> = {
    year: n,
    month: s,
    day: n,
    weekday: s,
    hour: n,
    minute: n
};

export const DATETIME_FULL: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute" | "timeZoneName"> = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    timeZoneName: s
};

export const DATETIME_FULL_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "hour" | "minute" | "second" | "timeZoneName"> = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};

export const DATETIME_HUGE: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "weekday" | "hour" | "minute" | "timeZoneName"> = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    timeZoneName: l
};

export const DATETIME_HUGE_WITH_SECONDS: Pick<Intl.DateTimeFormatOptions, "year" | "month" | "day" | "weekday" | "hour" | "minute" | "second" | "timeZoneName"> = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: l
};
