import { Interval, DateTime } from "../../src";
import { Helpers } from "../helpers";

const todayFrom = (h1: number, h2: number) =>
  Interval.fromDateTimes(Helpers.atHour(h1), Helpers.atHour(h2));
const invalid = Interval.invalid("because");

test("Interval.start gets the start", () => {
  const d = todayFrom(3, 5).start as DateTime;
  expect(d.hour).toBe(3);
});

test("Interval.start returns null for invalid intervals", () => {
  expect(invalid.start).toBe(null);
});

test("Interval.end gets the end", () => {
  const d = todayFrom(3, 5).end as DateTime;
  expect(d.hour).toBe(5);
});

test("Interval.end returns null for invalid intervals", () => {
  expect(invalid.end).toBe(null);
});
