import { DateTime, ToRelativeCalendarUnit } from "../../src";

import { Helpers } from "../helpers";

const sharedBase = DateTime.fromObject({ year: 1983, month: 10, day: 14 }).setLocale("en-US");
const baseUtc = sharedBase.toUTC();
// ------
// #toRelative()
// -------

test("DateTime#toRelative works down through the units", () => {
    const base = sharedBase;
    expect(base.plus({ minutes: 1 }).toRelative({ base })).toBe("in 1 minute");
    expect(base.plus({ minutes: 5 }).toRelative({ base })).toBe("in 5 minutes");
    expect(base.plus({ minutes: 65 }).toRelative({ base })).toBe("in 1 hour");
    expect(base.plus({ minutes: 165 }).toRelative({ base })).toBe("in 2 hours");
    expect(base.plus({ hours: 24 }).toRelative({ base })).toBe("in 1 day");
    expect(base.plus({ days: 3 }).toRelative({ base })).toBe("in 3 days");
    expect(base.plus({ months: 5 }).toRelative({ base })).toBe("in 5 months");
    expect(base.plus({ months: 15 }).toRelative({ base })).toBe("in 1 year");

    expect(base.minus({ minutes: 1 }).toRelative({ base })).toBe("1 minute ago");
    expect(base.minus({ minutes: 5 }).toRelative({ base })).toBe("5 minutes ago");
    expect(base.minus({ minutes: 65 }).toRelative({ base })).toBe("1 hour ago");
    expect(base.minus({ minutes: 165 }).toRelative({ base })).toBe("2 hours ago");
    expect(base.minus({ hours: 24 }).toRelative({ base })).toBe("1 day ago");
    expect(base.minus({ days: 3 }).toRelative({ base })).toBe("3 days ago");
    expect(base.minus({ months: 5 }).toRelative({ base })).toBe("5 months ago");
    expect(base.minus({ months: 15 }).toRelative({ base })).toBe("1 year ago");
});

test("DateTime#toRelative allows padding", () => {
    const base = sharedBase;
    expect(base.endOf("day").toRelative({ base, padding: 10 })).toBe("in 1 day");
    expect(base.minus({ days: 1, milliseconds: -1 }).toRelative({ base, padding: 10 })).toBe(
        "1 day ago"
    );
});

test("DateTime#toRelative takes a round argument", () => {
    const base = sharedBase;
    expect(base.plus({ months: 15 }).toRelative({ base, round: false })).toBe("in 1.25 years");
    expect(base.minus({ months: 15 }).toRelative({ base, round: false })).toBe("1.25 years ago");
});

test("DateTime#toRelative takes a rounding argument", () => {
    const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 }, { locale: "en-US" });
    expect(base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "expand" })).toBe(
        "in 2 hours"
    );
    expect(base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "expand" })).toBe(
        "in 3 hours"
    );
    expect(base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "expand" })).toBe(
        "2 hours ago"
    );
    expect(base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "expand" })).toBe(
        "3 hours ago"
    );

    expect(base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "trunc" })).toBe(
        "in 1 hour"
    );
    expect(base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "trunc" })).toBe(
        "in 2 hours"
    );
    expect(base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "trunc" })).toBe(
        "1 hour ago"
    );
    expect(base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "trunc" })).toBe(
        "2 hours ago"
    );

    expect(base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "round" })).toBe(
        "in 2 hours"
    );
    expect(base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "round" })).toBe(
        "in 2 hours"
    );
    expect(base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "round" })).toBe(
        "2 hours ago"
    );
    expect(base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "round" })).toBe(
        "2 hours ago"
    );

    expect(base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "floor" })).toBe(
        "in 1 hour"
    );
    expect(base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "floor" })).toBe(
        "in 2 hours"
    );
    expect(base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "floor" })).toBe(
        "2 hours ago"
    );
    expect(base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "floor" })).toBe(
        "3 hours ago"
    );

    expect(base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "ceil" })).toBe(
        "in 2 hours"
    );
    expect(base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "ceil" })).toBe(
        "in 3 hours"
    );
    expect(base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, rounding: "ceil" })).toBe(
        "1 hour ago"
    );
    expect(base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, rounding: "ceil" })).toBe(
        "2 hours ago"
    );
});

test("DateTime#toRelative takes a round and a rounding argument", () => {
    const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 }, { locale: "en-US" });
    expect(
        base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "expand" })
    ).toBe("in 2 hours");
    expect(
        base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "expand" })
    ).toBe("in 2.01 hours");
    expect(
        base
            .minus({ hours: 2, milliseconds: -1 })
            .toRelative({ base, round: false, rounding: "expand" })
    ).toBe("2 hours ago");
    expect(
        base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "expand" })
    ).toBe("2.01 hours ago");

    expect(
        base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "trunc" })
    ).toBe("in 1.99 hours");
    expect(
        base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "trunc" })
    ).toBe("in 2 hours");
    expect(
        base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "trunc" })
    ).toBe("1.99 hours ago");
    expect(
        base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "trunc" })
    ).toBe("2 hours ago");

    expect(
        base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "round" })
    ).toBe("in 2 hours");
    expect(
        base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "round" })
    ).toBe("in 2 hours");
    expect(
        base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "round" })
    ).toBe("2 hours ago");
    expect(
        base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "round" })
    ).toBe("2 hours ago");

    expect(
        base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "floor" })
    ).toBe("in 1.99 hours");
    expect(
        base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "floor" })
    ).toBe("in 2 hours");
    expect(
        base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "floor" })
    ).toBe("2 hours ago");
    expect(
        base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "floor" })
    ).toBe("2.01 hours ago");

    expect(
        base.plus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "ceil" })
    ).toBe("in 2 hours");
    expect(
        base.plus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "ceil" })
    ).toBe("in 2.01 hours");
    expect(
        base.minus({ hours: 2, milliseconds: -1 }).toRelative({ base, round: false, rounding: "ceil" })
    ).toBe("1.99 hours ago");
    expect(
        base.minus({ hours: 2, milliseconds: 1 }).toRelative({ base, round: false, rounding: "ceil" })
    ).toBe("2 hours ago");
});

test("DateTime#toRelative takes a unit argument", () => {
    const base = sharedBase;
    expect(baseUtc.plus({ months: 15 }).toRelative({ base: baseUtc, unit: "months" })).toBe("in 15 months");
    expect(baseUtc.minus({ months: 15 }).toRelative({ base: baseUtc, unit: "months" })).toBe("15 months ago");
    expect(baseUtc.plus({ months: 3 }).toRelative({ base: baseUtc, unit: "years", round: false })).toBe(
        "in 0.25 years"
    );
    expect(base.minus({ months: 3 }).toRelative({ base, unit: "years", round: false })).toBe(
        "0.25 years ago"
    );
});

test("DateTime#toRelative always rounds toward 0", () => {
    const base = sharedBase;
    expect(base.endOf("day").toRelative({ base })).toBe("in 23 hours");
    expect(base.minus({ days: 1, milliseconds: -1 }).toRelative({ base })).toBe("23 hours ago");
});

test("DateTime#toRelative uses the absolute time", () => {
    const base2 = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 23, minute: 59 }).setLocale("en-US");
    const end = DateTime.fromObject({ year: 1983, month: 10, day: 15, hour: 0, minute: 3 }).setLocale("en-US");
    expect(end.toRelative({ base: base2 })).toBe("in 4 minutes");
    expect(base2.toRelative({ base: end })).toBe("4 minutes ago");
});

Helpers.withoutRTF("DateTime#toRelative works without RTF", () => {
    const base = DateTime.fromObject({ year: 2019, month: 12, day: 25 });

    expect(base.plus({ months: 1 }).toRelative({ base })).toBe("in 1 month");
    expect(base.plus({ months: 1 }).toRelative({ base, style: "narrow" })).toBe("in 1 mo.");
    expect(base.plus({ months: 1 }).toRelative({ base, unit: "days" })).toBe("in 31 days");
    expect(base.plus({ months: 1 }).toRelative({ base, style: "short", unit: "days" })).toBe("in 31 days");
    expect(base.plus({ months: 1, days: 2 }).toRelative({ base, round: false })).toBe("in 1.06 months");
});

Helpers.withoutRTF("DateTime#toRelative falls back to English", () => {
    const base = DateTime.fromObject({ year: 2019, month: 12, day: 25 }).setLocale("en-US");
    expect(base.setLocale("fr").plus({ months: 1 }).toRelative({ base })).toBe("in 1 month");
});

test("DateTime#toRelative returns null when used on an invalid date", () => {
    expect(DateTime.invalid("not valid").toRelative()).toBe(null);
});

// ------
// #toRelativeCalendar()
// -------

test("DateTime#toRelativeCalendar uses the calendar", () => {
    const end = DateTime.fromObject({ year: 1983, month: 10, day: 15, hour: 0, minute: 3 }).setLocale("en-US");
    expect(end.toRelativeCalendar({
        base: DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 23, minute: 59 }).setLocale("en-US")
    })).toBe("tomorrow");
});

Helpers.withNow(
    "DateTime#toRelativeCalendar picks the correct unit with no options",
    DateTime.fromObject({ year: 1983, month: 10, day: 14 }),
    () => {
        const now = DateTime.now().setLocale("en-GB");
        expect(now.plus({ days: 1 }).toRelativeCalendar()).toBe("tomorrow");
    }
);

Helpers.withNow(
    "DateTime#toRelativeCalendar picks the correct unit with no options at last day of month",
    DateTime.fromObject({ year: 1983, month: 10, day: 31 }),
    () => {
        const now = DateTime.now().setLocale("en-GB");
        expect(now.plus({ days: 1 }).toRelativeCalendar()).toBe("next month");
    }
);

Helpers.withNow(
    "DateTime#toRelativeCalendar picks the correct unit with no options at least day of year",
    DateTime.fromObject({ year: 1983, month: 12, day: 31 }),
    () => {
        const now = DateTime.now().setLocale("en-GB");
        expect(now.plus({ days: 1 }).toRelativeCalendar()).toBe("next year");
    }
);

test("DateTime#toRelativeCalendar returns null when used on an invalid date", () => {
    expect(DateTime.invalid("not valid").toRelativeCalendar()).toBe(null);
});

test("DateTime#toRelativeCalendar works down through the units", () => {
    const base = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 12 }).setLocale("en-US");
    expect(base.plus({ minutes: 1 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.plus({ minutes: 5 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.plus({ minutes: 65 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.plus({ hours: 13 }).toRelativeCalendar({ base })).toBe("tomorrow");
    expect(base.plus({ days: 3 }).toRelativeCalendar({ base })).toBe("in 3 days");
    expect(base.plus({ months: 1 }).toRelativeCalendar({ base })).toBe("next month");
    expect(base.plus({ months: 5 }).toRelativeCalendar({ base })).toBe("next year");
    expect(base.plus({ months: 15 }).toRelativeCalendar({ base })).toBe("in 2 years");
    expect(base.minus({ minutes: 1 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.minus({ minutes: 5 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.minus({ minutes: 65 }).toRelativeCalendar({ base })).toBe("today");
    expect(base.minus({ hours: 24 }).toRelativeCalendar({ base })).toBe("yesterday");
    expect(base.minus({ days: 3 }).toRelativeCalendar({ base })).toBe("3 days ago");
    expect(base.minus({ months: 1 }).toRelativeCalendar({ base })).toBe("last month");
    expect(base.minus({ months: 5 }).toRelativeCalendar({ base })).toBe("5 months ago");
    expect(base.minus({ months: 15 }).toRelativeCalendar({ base })).toBe("last year");
});

test("DateTime#toRelativeCalendar takes a unit argument", () => {
    const base6 = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 12 }).setLocale("en-US"),
        target = base6.plus({ months: 3 });
    expect(target.toRelativeCalendar({ base: base6, unit: "months" })).toBe("in 3 months");
});

Helpers.withoutRTF("DateTime#toRelativeCalendar works without RTF", () => {
    const base = DateTime.fromObject({ year: 2019, month: 10, day: 25 }).setLocale("en-US");
    expect(base.plus({ months: 1 }).toRelativeCalendar({ base })).toBe("next month");
});

Helpers.withoutRTF("DateTime#toRelativeCalendar falls back to English", () => {
    const base8 = DateTime.fromObject({ year: 2019, month: 12, day: 25 }).setLocale("en-US");
    expect(
        base8
            .setLocale("fr")
            .plus({ months: 1 })
            .toRelativeCalendar({ base: base8 })
    ).toBe("next year");
});

test("DateTime#toRelativeCalendar works down through the units for different zone than local", () => {
    const target = DateTime.now().setZone(`UTC+3`).setLocale("en-US"),
        target1 = target.plus({ days: 1 }),
        target2 = target1.plus({ days: 1 }),
        target3 = target2.plus({ days: 1 }),
        options = { unit: "days" as ToRelativeCalendarUnit };

    expect(target.toRelativeCalendar(options)).toBe("today");
    expect(target1.toRelativeCalendar(options)).toBe("tomorrow");
    expect(target2.toRelativeCalendar(options)).toBe("in 2 days");
    expect(target3.toRelativeCalendar(options)).toBe("in 3 days");
});

test("DateTime#toRelative works down through the units for diffrent zone than local", () => {
    const base = DateTime.now().setZone(`UTC+3`).setLocale("en-US");

    expect(base.plus({ minutes: 65 }).toRelative()).toBe("in 1 hour");
    expect(base.plus({ minutes: 165 }).toRelative()).toBe("in 2 hours");
    expect(base.plus({ hours: 25 }).toRelative()).toBe("in 1 day");
    expect(base.plus({ months: 15 }).toRelative()).toBe("in 1 year");
    expect(base.minus({ minutes: 65 }).toRelative()).toBe("1 hour ago");
    expect(base.minus({ minutes: 165 }).toRelative()).toBe("2 hours ago");
    expect(base.minus({ hours: 25 }).toRelative()).toBe("1 day ago");
    expect(base.minus({ months: 15 }).toRelative()).toBe("1 year ago");
});
