import { Duration } from "../../src";
import { InvalidArgumentError, InvalidUnitError } from "../../src/errors";
import { Helpers } from "../helpers";

// ------
// .fromObject()
// -------
test("Duration.fromObject sets all the values", () => {
    const dur = Duration.fromObject({
        years: 1,
        months: 2,
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
        milliseconds: 7
    });
    expect(dur.years).toBe(1);
    expect(dur.months).toBe(2);
    expect(dur.days).toBe(3);
    expect(dur.hours).toBe(4);
    expect(dur.minutes).toBe(5);
    expect(dur.seconds).toBe(6);
    expect(dur.milliseconds).toBe(7);
});

test("Duration.fromObject sets all the fractional values", () => {
    const dur = Duration.fromObject({
        years: 1,
        months: 2,
        days: 3,
        hours: 4.5,
    });
    expect(dur.years).toBe(1);
    expect(dur.months).toBe(2);
    expect(dur.days).toBe(3);
    expect(dur.hours).toBe(4.5);
    expect(dur.minutes).toBe(0);
    expect(dur.seconds).toBe(0);
    expect(dur.milliseconds).toBe(0);
});

test("Duration.fromObject sets all the values from the object having string type values", () => {
    const dur = Duration.fromObject({
        years: "1",
        months: "2",
        days: "3",
        hours: "4",
        minutes: "5",
        seconds: "6",
        milliseconds: "7"
    });
    expect(dur.years).toBe(1);
    expect(dur.months).toBe(2);
    expect(dur.days).toBe(3);
    expect(dur.hours).toBe(4);
    expect(dur.minutes).toBe(5);
    expect(dur.seconds).toBe(6);
    expect(dur.milliseconds).toBe(7);
});

test("Duration.fromObject accepts a conversionAccuracy", () => {
    const dur = Duration.fromObject({ days: 1 }, { conversionAccuracy: "longterm" });
    expect(Helpers.conversionAccuracy(dur)).toBe("longterm");
});

test("Duration.fromObject throws if the argument is not an object", () => {
    // @ts-expect-error
    expect(() => Duration.fromObject()).toThrow(InvalidArgumentError);

    expect(() => Duration.fromObject(null)).toThrow(InvalidArgumentError);
    // @ts-expect-error
    expect(() => Duration.fromObject("foo")).toThrow(InvalidArgumentError);
});

test("Duration.fromObject({}) constructs zero duration", () => {
    const dur = Duration.fromObject({});
    expect(dur.years).toBe(0);
    expect(dur.months).toBe(0);
    expect(dur.days).toBe(0);
    expect(dur.hours).toBe(0);
    expect(dur.minutes).toBe(0);
    expect(dur.seconds).toBe(0);
    expect(dur.milliseconds).toBe(0);
});

test("Duration.fromObject throws if the initial object has invalid keys", () => {
    // @ts-expect-error
    expect(() => Duration.fromObject({ foo: 0 })).toThrow(InvalidUnitError);
    // @ts-expect-error
    expect(() => Duration.fromObject({ years: 1, foo: 0 })).toThrow(InvalidUnitError);
});

test("Duration.fromObject throws if the initial object has invalid values", () => {
    // @ts-expect-error
    expect(() => Duration.fromObject({ years: {} })).toThrow();
    expect(() => Duration.fromObject({ months: "some" })).toThrow();
    expect(() => Duration.fromObject({ days: NaN })).toThrow();
    // @ts-expect-error
    expect(() => Duration.fromObject({ hours: true })).toThrow();
    // @ts-expect-error
    expect(() => Duration.fromObject({ minutes: false })).toThrow();
    expect(() => Duration.fromObject({ seconds: "" })).toThrow();
});

test("Duration.fromObject is valid if providing options only", () => {
    const dur = Duration.fromObject({}, { conversionAccuracy: "longterm" });
    expect(dur.years).toBe(0);
    expect(dur.months).toBe(0);
    expect(dur.days).toBe(0);
    expect(dur.hours).toBe(0);
    expect(dur.minutes).toBe(0);
    expect(dur.seconds).toBe(0);
    expect(dur.milliseconds).toBe(0);
});

// ------
// .fromDurationLike()
// -------

it("Duration.fromDurationLike returns a Duration from millis", () => {
    const dur = Duration.fromDurationLike(1000);
    expect(dur).toBeInstanceOf(Duration);
    expect(dur).toMatchInlineSnapshot(`"PT1S"`);
});

it("Duration.fromDurationLike returns a Duration from object", () => {
    const dur = Duration.fromDurationLike({ hours: 1 });
    expect(dur).toBeInstanceOf(Duration);
    expect(dur.toObject()).toStrictEqual({ hours: 1 });
});

it("Duration.fromDurationLike returns passed Duration", () => {
    const durFromObject = Duration.fromObject({ hours: 1 });
    const dur = Duration.fromDurationLike(durFromObject);
    expect(dur).toStrictEqual(durFromObject);
});

it("Duration.fromDurationLike returns passed Duration", () => {
    // @ts-expect-error
    expect(() => Duration.fromDurationLike("foo")).toThrow();
    // @ts-expect-error
    expect(() => Duration.fromDurationLike(Helpers.nullify())).toThrow();
});
