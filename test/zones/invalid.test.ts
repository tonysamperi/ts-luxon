/* global test expect */
import { InvalidZone } from "../../src";

test("InvalidZone", () => {
  const zone = new InvalidZone("foo");

  expect(zone.type).toBe("invalid");
  expect(zone.name).toBe("foo");
  expect(zone.offsetName()).toBe(null); // the abstract class states this returns a string, yet InvalidZones return null :(
  // @ts-expect-error
  expect(zone.formatOffset(0, "short")).toBe("");
  expect(zone.universal).toBe(false);
  expect(zone.offset()).toBe(NaN);
  expect(zone.isValid).toBe(false);
  // @ts-expect-error
  expect(zone.equals(zone)).toBe(false); // always false even if it has the same name
});
