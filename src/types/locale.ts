import { DayOfWeek } from "./common";

export type NumberingSystem =
  | "arab"
  | "arabext"
  | "bali"
  | "beng"
  | "deva"
  | "fullwide"
  | "gujr"
  | "hanidec"
  | "khmr"
  | "knda"
  | "laoo"
  | "latn"
  | "limb"
  | "mlym"
  | "mong"
  | "mymr"
  | "orya"
  | "tamldec"
  | "telu"
  | "thai"
  | "tibt";

export type CalendarSystem =
  | "buddhist"
  | "chinese"
  | "coptic"
  | "ethioaa"
  | "ethiopic"
  | "gregory"
  | "hebrew"
  | "indian"
  | "islamic"
  | "islamicc"
  | "iso8601"
  | "japanese"
  | "persian"
  | "roc";

export interface WeekSettings {
    firstDay: number;
    minimalDays: DayOfWeek;
    weekend: [DayOfWeek, DayOfWeek];
}

export interface LocaleOptions {
    defaultToEN?: boolean;
    locale?: string;
    numberingSystem?: NumberingSystem;
    outputCalendar?: CalendarSystem;
    weekSettings?: WeekSettings;
}
