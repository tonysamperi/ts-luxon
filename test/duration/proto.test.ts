/* global test expect */
/* eslint no-proto: "off" */
import { Duration } from "../../src";

test("Duration prototype properties should not throw when addressed", () => {
  const d = Duration.fromObject({ hours: 1 });
  expect(() =>
    // @ts-ignore
    Object.getOwnPropertyNames(d.__proto__).forEach(name => d.__proto__[name])
  ).not.toThrow();
});
