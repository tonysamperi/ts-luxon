import Intl from "../types/intl-next";

/**
 * @private
 */

const n: "numeric" = "numeric",
    s: "short" = "short",
    l: "long" = "long";

export const DATE_SHORT = {
    year: n,
    month: n,
    day: n
};

export const DATE_MED = {
    year: n,
    month: s,
    day: n
};

export const DATE_MED_WITH_WEEKDAY = {
    year: n,
    month: s,
    day: n,
    weekday: s
};

export const DATE_FULL = {
    year: n,
    month: l,
    day: n
};

export const DATE_HUGE = {
    year: n,
    month: l,
    day: n,
    weekday: l
};

export const TIME_SIMPLE = {
    hour: n,
    minute: n
};

export const TIME_WITH_SECONDS = {
    hour: n,
    minute: n,
    second: n
};

export const TIME_WITH_SHORT_OFFSET = {
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};

export const TIME_WITH_LONG_OFFSET = {
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

export const DATETIME_SHORT = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n
};

export const DATETIME_SHORT_WITH_SECONDS = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n,
    second: n
};

export const DATETIME_MED = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n
};

export const DATETIME_MED_WITH_SECONDS = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n,
    second: n
};

export const DATETIME_MED_WITH_WEEKDAY = {
    year: n,
    month: s,
    day: n,
    weekday: s,
    hour: n,
    minute: n
};

export const DATETIME_FULL = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    timeZoneName: s
};

export const DATETIME_FULL_WITH_SECONDS = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};

export const DATETIME_HUGE = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    timeZoneName: l
};

export const DATETIME_HUGE_WITH_SECONDS = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: l
};
