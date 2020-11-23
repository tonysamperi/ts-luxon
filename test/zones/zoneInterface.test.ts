/* global test expect */
import { Zone } from "ts-luxon";

test("You can instantiate Zone directly", () => {
  // @ts-expect-error
  expect(() => new Zone().isValid).toThrow();
});
