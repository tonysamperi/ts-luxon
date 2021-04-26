import { DateTime} from "../../src/datetime";

import {Helpers} from "../helpers";

// ------
// #toRelative()
// -------

test("DateTime#toRelative works down through the units", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 });
  const toRelativeOpts = {
    base,
    locale: "en-US"
  };

  expect(base.plus({ minutes: 1 }).toRelative(toRelativeOpts)).toBe("in 1 minute");
  expect(base.plus({ minutes: 5 }).toRelative(toRelativeOpts)).toBe("in 5 minutes");
  expect(base.plus({ minutes: 65 }).toRelative(toRelativeOpts)).toBe("in 1 hour");
  expect(base.plus({ minutes: 165 }).toRelative(toRelativeOpts)).toBe("in 2 hours");
  expect(base.plus({ hours: 24 }).toRelative(toRelativeOpts)).toBe("in 1 day");
  expect(base.plus({ days: 3 }).toRelative(toRelativeOpts)).toBe("in 3 days");
  expect(base.plus({ months: 5 }).toRelative(toRelativeOpts)).toBe("in 5 months");
  expect(base.plus({ months: 15 }).toRelative(toRelativeOpts)).toBe("in 1 year");

  expect(base.minus({ minutes: 1 }).toRelative(toRelativeOpts)).toBe("1 minute ago");
  expect(base.minus({ minutes: 5 }).toRelative(toRelativeOpts)).toBe("5 minutes ago");
  expect(base.minus({ minutes: 65 }).toRelative(toRelativeOpts)).toBe("1 hour ago");
  expect(base.minus({ minutes: 165 }).toRelative(toRelativeOpts)).toBe("2 hours ago");
  expect(base.minus({ hours: 24 }).toRelative(toRelativeOpts)).toBe("1 day ago");
  expect(base.minus({ days: 3 }).toRelative(toRelativeOpts)).toBe("3 days ago");
  expect(base.minus({ months: 5 }).toRelative(toRelativeOpts)).toBe("5 months ago");
  expect(base.minus({ months: 15 }).toRelative(toRelativeOpts)).toBe("1 year ago");
});

test("DateTime#toRelative allows padding", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 });
  const opts = { base, padding: 10, locale: "en-US" };
  expect(base.endOf("day").toRelative(opts)).toBe("in 1 day");
  expect(base.minus({ days: 1, milliseconds: -1 }).toRelative(opts)).toBe(
    "1 day ago"
  );
});

test("DateTime#toRelative takes a round argument", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 });
  const opts = { base, round: !1, locale: "en-US" };
  expect(base.plus({ months: 15 }).toRelative(opts)).toBe("in 1.25 years");
  expect(base.minus({ months: 15 }).toRelative(opts)).toBe("1.25 years ago");
});

test("DateTime#toRelative takes a unit argument", () => {
  const base = DateTime.fromObject({ year: 2018, month: 10, day: 14, zone: "UTC", locale: "en-US" } );
  expect(base.plus({ months: 15 }).toRelative({ base, unit: "months" })).toBe("in 15 months");
  expect(base.minus({ months: 15 }).toRelative({ base, unit: "months" })).toBe("15 months ago");
  expect(base.plus({ months: 3 }).toRelative({ base, unit: "years", round: false })).toBe(
    "in 0.25 years"
  );
  expect(base.minus({ months: 3 }).toRelative({ base, unit: "years", round: false })).toBe(
    "0.25 years ago"
  );
});

test("DateTime#toRelative always rounds toward 0", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14 });
  expect(base.endOf("day").toRelative({ base, locale: "en-US" })).toBe("in 23 hours");
  expect(base.minus({ days: 1, milliseconds: -1 }).toRelative({ base, locale: "en-US" })).toBe("23 hours ago");
});

test("DateTime#toRelative uses the absolute time", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 23, minute: 59 });
  const end = DateTime.fromObject({ year: 1983, month: 10, day: 15, hour: 0, minute: 3 });
  expect(end.toRelative({ base, locale: "en-US" })).toBe("in 4 minutes");
  expect(base.toRelative({ base: end, locale: "en-US" })).toBe("4 minutes ago");
});

Helpers.withoutRTF("DateTime#toRelative works without RTF", () => {
  const base = DateTime.fromObject({ year: 2019, month: 12, day: 25 });

  expect(base.plus({ months: 1 }).toRelative({ base })).toBe("in 1 month");
  expect(base.plus({ months: 1 }).toRelative({ base, style: "narrow" })).toBe("in 1 mo.");
  expect(base.plus({ months: 1 }).toRelative({ base, unit: "days" })).toBe("in 31 days");
  expect(base.plus({ months: 1 }).toRelative({ base, style: "short", unit: "days" })).toBe(
    "in 31 days"
  );
  expect(base.plus({ months: 1, days: 2 }).toRelative({ base, round: false })).toBe(
    "in 1.06 months"
  );
});

Helpers.withoutRTF("DateTime#toRelative falls back to English", () => {
  const base = DateTime.fromObject({ year: 2019, month: 12, day: 25 });
  expect(
    base
    .setLocale("fr")
    .plus({ months: 1 })
    .toRelative({ base })
  ).toBe("in 1 month");
});

// ------
// #toRelativeCalendar()
// -------

test("DateTime#toRelativeCalendar uses the calendar", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 23, minute: 59 });
  const end = DateTime.fromObject({ year: 1983, month: 10, day: 15, hour: 0, minute: 3 });
  expect(end.toRelativeCalendar({ base, locale: "en-US" })).toBe("tomorrow");
});

test("DateTime#toRelativeCalendar picks the correct unit with no options", () => {
  const now = DateTime.now();
  const isLastDayOfMonth = now.endOf("month").day === now.day;
  expect(now.plus({ days: 1 }).toRelativeCalendar({locale: "en-US"})).toBe(
    isLastDayOfMonth ? "next month" : "tomorrow"
  );
});

test("DateTime#toRelativeCalendar works down through the units", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 12 });
  const toRelativeOpts = {
    base,
    locale: "en-US"
  };
  expect(base.plus({ minutes: 1 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.plus({ minutes: 5 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.plus({ minutes: 65 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.plus({ hours: 13 }).toRelativeCalendar(toRelativeOpts)).toBe("tomorrow");
  expect(base.plus({ days: 3 }).toRelativeCalendar(toRelativeOpts)).toBe("in 3 days");
  expect(base.plus({ months: 1 }).toRelativeCalendar(toRelativeOpts)).toBe("next month");
  expect(base.plus({ months: 5 }).toRelativeCalendar(toRelativeOpts)).toBe("next year");
  expect(base.plus({ months: 15 }).toRelativeCalendar(toRelativeOpts)).toBe("in 2 years");

  expect(base.minus({ minutes: 1 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.minus({ minutes: 5 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.minus({ minutes: 65 }).toRelativeCalendar(toRelativeOpts)).toBe("today");
  expect(base.minus({ hours: 24 }).toRelativeCalendar(toRelativeOpts)).toBe("yesterday");
  expect(base.minus({ days: 3 }).toRelativeCalendar(toRelativeOpts)).toBe("3 days ago");
  expect(base.minus({ months: 1 }).toRelativeCalendar(toRelativeOpts)).toBe("last month");
  expect(base.minus({ months: 5 }).toRelativeCalendar(toRelativeOpts)).toBe("5 months ago");
  expect(base.minus({ months: 15 }).toRelativeCalendar(toRelativeOpts)).toBe("last year");
});

test("DateTime#toRelativeCalendar takes a unit argument", () => {
  const base = DateTime.fromObject({ year: 1983, month: 10, day: 14, hour: 12 }),
    target = base.plus({ months: 3 });
  expect(target.toRelativeCalendar({ base, unit: "months", locale: "en-US" })).toBe("in 3 months");
});

Helpers.withoutRTF("DateTime#toRelativeCalendar works without RTF", () => {
  const base = DateTime.fromObject({ year: 2019, month: 10, day: 25 });
  expect(base.plus({ months: 1 }).toRelativeCalendar({ base, locale: "en-US" })).toBe("next month");
});

Helpers.withoutRTF("DateTime#toRelativeCalendar falls back to English", () => {
  const base = DateTime.fromObject({ year: 2019, month: 12, day: 25 });
  expect(
    base
    .setLocale("fr")
    .plus({ months: 1 })
    .toRelativeCalendar({ base, locale: "en-US" })
  ).toBe("next year");
});

test("DateTime#toRelativeCalendar works down through the units for different zone than default", () => {
  const target = DateTime.now().setZone(`UTC+3`),
    target1 = target.plus({ days: 1 }),
    target2 = target1.plus({ days: 1 }),
    target3 = target2.plus({ days: 1 }),
    options = { unit: "days" as const, locale: "en-US" };

  expect(target.toRelativeCalendar(options)).toBe("today");
  expect(target1.toRelativeCalendar(options)).toBe("tomorrow");
  expect(target2.toRelativeCalendar(options)).toBe("in 2 days");
  expect(target3.toRelativeCalendar(options)).toBe("in 3 days");
});

test("DateTime#toRelative works down through the units for different zone than default", () => {
  const base = DateTime.now().setZone(`UTC+3`);
  const opts = {
    locale: "en-US"
  };
  expect(base.plus({ minutes: 65 }).toRelative(opts)).toBe("in 1 hour");
  expect(base.plus({ minutes: 165 }).toRelative(opts)).toBe("in 2 hours");
  expect(base.plus({ hours: 25 }).toRelative(opts)).toBe("in 1 day");
  expect(base.plus({ months: 15 }).toRelative(opts)).toBe("in 1 year");

  expect(base.minus({ minutes: 65 }).toRelative(opts)).toBe("1 hour ago");
  expect(base.minus({ minutes: 165 }).toRelative(opts)).toBe("2 hours ago");
  expect(base.minus({ hours: 25 }).toRelative(opts)).toBe("1 day ago");
  expect(base.minus({ months: 15 }).toRelative(opts)).toBe("1 year ago");
});
