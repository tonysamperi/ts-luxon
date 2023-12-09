import { DateTime } from "../../src/datetime";

const staticKeys: (keyof typeof DateTime)[] = [
    "DATETIME_FULL",
    "DATETIME_FULL_WITH_SECONDS",
    "DATETIME_HUGE",
    "DATETIME_HUGE_WITH_SECONDS",
    "DATETIME_MED",
    "DATETIME_MED_WITH_SECONDS",
    "DATETIME_MED_WITH_WEEKDAY",
    "DATETIME_SHORT",
    "DATETIME_SHORT_WITH_SECONDS",
    "DATE_FULL",
    "DATE_HUGE",
    "DATE_MED",
    "DATE_MED_WITH_WEEKDAY",
    "DATE_SHORT",
    "TIME_24_SIMPLE",
    "TIME_24_WITH_LONG_OFFSET",
    "TIME_24_WITH_SECONDS",
    "TIME_24_WITH_SHORT_OFFSET",
    "TIME_SIMPLE",
    "TIME_WITH_LONG_OFFSET",
    "TIME_WITH_SECONDS",
    "TIME_WITH_SHORT_OFFSET"
];

test("Static members are defined", () => {
    staticKeys.forEach((k) => {
        expect(DateTime[k as keyof typeof DateTime]).toBeTruthy();
    });
});