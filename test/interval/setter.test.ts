import { Interval, DateTime } from "../../src";

import {Helpers} from "../helpers";

const todayFrom = (h1: number, h2: number) =>
  Interval.fromDateTimes(Helpers.atHour(h1), Helpers.atHour(h2));

test("Interval.set can set the start", () => {
  const d = todayFrom(3, 5).set({ start: Helpers.atHour(4) }).start as DateTime;
  expect(d.hour).toBe(4);
});

test("Interval.set can set the end", () => {
  const d = todayFrom(3, 5).set({ end: Helpers.atHour(6) }).end as DateTime;
  expect(d.hour).toBe(6);
});

test("Interval.set preserves invalidity", () => {
  const invalid = Interval.invalid("because");
  expect(invalid.set({ start: Helpers.atHour(4) }).isValid).toBe(false);
});
