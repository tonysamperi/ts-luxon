import { CalendarSystem, NumberingSystem } from "./locale";
import { Locale } from "../impl/locale";

export interface InfoOptions {
    locale?: string;
}

export interface InfoUnitOptions extends InfoOptions {
    locObj?: Locale;
    numberingSystem?: NumberingSystem;
}

export interface InfoCalendarOptions extends InfoUnitOptions {
    locObj?: Locale;
    outputCalendar?: CalendarSystem;
}

export interface Features {
    relative: boolean;
}
