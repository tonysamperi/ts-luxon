import { DateTime } from "../../src";

const dateTime = DateTime.fromJSDate(new Date(1982, 4, 25, 9, 23, 54, 123)).setLocale("en-US");

// ------
// #toObject
// -------
test("DateTime#toObject returns the object", () => {
  expect(dateTime.toObject()).toEqual({
    year: 1982,
    month: 5,
    day: 25,
    hour: 9,
    minute: 23,
    second: 54,
    millisecond: 123
  });
});

test("DateTime#toObject accepts a flag to return config", () => {
  expect(dateTime.toObject({ includeConfig: true })).toEqual({
    year: 1982,
    month: 5,
    day: 25,
    hour: 9,
    minute: 23,
    second: 54,
    millisecond: 123,
    locale: "en-US",
    numberingSystem: void 0,
    outputCalendar: void 0
  });
});

test("DateTime#toObject returns an empty object for invalid DateTimes", () => {
  expect(DateTime.invalid("because").toObject()).toEqual({});
});
