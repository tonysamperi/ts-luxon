import { Duration } from "../../src";

const dur = (vals = {
    years: 1,
    quarters: 2,
    months: 2,
    days: 3,
    hours: 4,
    minutes: 5,
    seconds: 6,
    milliseconds: 7,
    weeks: 8
}) => Duration.fromObject(vals);

// ------
// years/months/days/hours/minutes/seconds/milliseconds
// ------

test("Duration#years returns the years", () => {
    expect(dur().years).toBe(1);
});

test("Duration#quarters returns the quarters", () => {
    expect(dur().quarters).toBe(2);
});

test("Duration#months returns the (1-indexed) months", () => {
    expect(dur().months).toBe(2);
});

test("Duration#days returns the days", () => {
    expect(dur().days).toBe(3);
});

test("Duration#hours returns the hours", () => {
    expect(dur().hours).toBe(4);
});

test("Duration#hours returns the fractional hours", () => {
    expect(dur({
        years: 1,
        quarters: 2,
        months: 2,
        days: 3,
        hours: 4.5,
        minutes: 5,
        seconds: 6,
        milliseconds: 7,
        weeks: 8
    }).hours).toBe(4.5);
    expect(Duration.invalid("because i say so").hours).toBeFalsy();
});

test("Duration#minutes returns the minutes", () => {
    expect(dur().minutes).toBe(5);
});

test("Duration#seconds returns the seconds", () => {
    expect(dur().seconds).toBe(6);
});

test("Duration#milliseconds returns the milliseconds", () => {
    expect(dur().milliseconds).toBe(7);
});

test("Duration#weeks returns the weeks", () => {
    expect(dur().weeks).toBe(8);
});
