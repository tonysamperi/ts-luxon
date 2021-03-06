import { IANAZone } from "./zones/IANAZone";
import { Locale } from "./impl/locale";

import { normalizeZone } from "./impl/zoneUtil";
import { NumberingSystem, CalendarSystem } from "./types/locale";
import { LocalZone } from "./zones/localZone";
import { Zone } from "./zone";

let now = () => Date.now(),
  defaultZone: Zone | null,
  defaultLocale: string | undefined,
  defaultNumberingSystem: NumberingSystem | undefined,
  defaultOutputCalendar: CalendarSystem | undefined,
  throwOnInvalid: boolean = !1;

/**
 * Settings contains static getters and setters that control TsLuxon's overall behavior.
 * TsLuxon is a simple library with few options, but the ones it does have live here.
 */
export class Settings {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return now;
  }

  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(n) {
    now = n;
  }

  /**
   * Get the default time zone object to create DateTimes in. Does not affect existing instances.
   * @type {Zone}
   */
  static get defaultZone(): Zone {
    return defaultZone || LocalZone.instance;
  }


  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * @type {string}
   */
  static set defaultZoneName(z: string | null) {
    if (!z) {
      defaultZone = null;
    }
    else {
      // @ts-ignore
      defaultZone = normalizeZone(z);
    }
  }

  /**
   * Get the default time zone to create DateTimes in.
   * @type {string}
   */
  static get defaultZoneName() {
    return Settings.defaultZone.name;
  }

  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return defaultLocale;
  }

  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(locale: string | undefined) {
    defaultLocale = locale;
  }

  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return defaultNumberingSystem;
  }

  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(numberingSystem: NumberingSystem | undefined) {
    defaultNumberingSystem = numberingSystem;
  }

  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return defaultOutputCalendar;
  }

  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(outputCalendar: CalendarSystem | undefined) {
    defaultOutputCalendar = outputCalendar;
  }

  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return throwOnInvalid;
  }

  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(t) {
    throwOnInvalid = t;
  }

  // Methods

  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    Locale.resetCache();
    IANAZone.resetCache();
  }

}
