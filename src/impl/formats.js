/**
 * @private
 */
var n = "numeric", s = "short", l = "long";
export var DATE_SHORT = {
    year: n,
    month: n,
    day: n
};
export var DATE_MED = {
    year: n,
    month: s,
    day: n
};
export var DATE_MED_WITH_WEEKDAY = {
    year: n,
    month: s,
    day: n,
    weekday: s
};
export var DATE_FULL = {
    year: n,
    month: l,
    day: n
};
export var DATE_HUGE = {
    year: n,
    month: l,
    day: n,
    weekday: l
};
export var TIME_SIMPLE = {
    hour: n,
    minute: n
};
export var TIME_WITH_SECONDS = {
    hour: n,
    minute: n,
    second: n
};
export var TIME_WITH_SHORT_OFFSET = {
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};
export var TIME_WITH_LONG_OFFSET = {
    hour: n,
    minute: n,
    second: n,
    timeZoneName: l
};
export var TIME_24_SIMPLE = {
    hour: n,
    minute: n,
    hour12: false
};
export var TIME_24_WITH_SECONDS = {
    hour: n,
    minute: n,
    second: n,
    hour12: false
};
export var TIME_24_WITH_SHORT_OFFSET = {
    hour: n,
    minute: n,
    second: n,
    hour12: false,
    timeZoneName: s
};
export var TIME_24_WITH_LONG_OFFSET = {
    hour: n,
    minute: n,
    second: n,
    hour12: false,
    timeZoneName: l
};
export var DATETIME_SHORT = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n
};
export var DATETIME_SHORT_WITH_SECONDS = {
    year: n,
    month: n,
    day: n,
    hour: n,
    minute: n,
    second: n
};
export var DATETIME_MED = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n
};
export var DATETIME_MED_WITH_SECONDS = {
    year: n,
    month: s,
    day: n,
    hour: n,
    minute: n,
    second: n
};
export var DATETIME_MED_WITH_WEEKDAY = {
    year: n,
    month: s,
    day: n,
    weekday: s,
    hour: n,
    minute: n
};
export var DATETIME_FULL = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    timeZoneName: s
};
export var DATETIME_FULL_WITH_SECONDS = {
    year: n,
    month: l,
    day: n,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: s
};
export var DATETIME_HUGE = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    timeZoneName: l
};
export var DATETIME_HUGE_WITH_SECONDS = {
    year: n,
    month: l,
    day: n,
    weekday: l,
    hour: n,
    minute: n,
    second: n,
    timeZoneName: l
};
//# sourceMappingURL=formats.js.map