import { SystemZone } from "../../src";
import {Helpers} from "../helpers";

test("SystemZone.instance returns a singleton", () => {
  expect(SystemZone.instance).toBe(SystemZone.instance);
});

test("SystemZone.instance provides valid ...", () => {
  expect(SystemZone.instance.type).toBe("system");
  expect(SystemZone.instance.isUniversal).toBe(false);
  expect(SystemZone.instance.isValid).toBe(true);
  expect(SystemZone.instance.equals(SystemZone.instance)).toBe(true);

  // todo: figure out how to test these without inadvertently testing IANAZone
  expect(SystemZone.instance.name).toBe("Europe/Rome"); // "America/New_York"
  // expect(SystemZone.instance.offsetName()).toBe("UTC");
  // expect(SystemZone.instance.formatOffset(0, "short")).toBe("+00:00");
  // expect(SystemZone.instance.offset()).toBe(0);
});

Helpers.withoutIntl("SystemZone.name simply returns 'system'", () => {
  expect(SystemZone.instance.name).toBe("system");
});
