import {
    DateTime,
    Settings,
    NumberingSystem,
    CalendarSystem,
    Duration
}
// @ts-ignore
    from "../src";

export class Helpers {

    static readonly days_EN = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    static readonly days_IT = [
        "lunedì",
        "martedì",
        "mercoledì",
        "giovedì",
        "venerdì",
        "sabato",
        "domenica"
    ];

    static readonly months_EN = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    static readonly months_IT = [
        "gennaio",
        "febbraio",
        "marzo",
        "aprile",
        "maggio",
        "giugno",
        "luglio",
        "agosto",
        "settembre",
        "ottobre",
        "novembre",
        "dicembre"
    ];

    static atHour(hour: number) {
        return DateTime.fromObject({ year: 2017, month: 5, day: 25 }).startOf("day").set({ hour });
    };

    static conversionAccuracy(duration: Duration) {
        const fourWeeks = {
            years: 0,
            quarters: 0,
            months: 0,
            weeks: 4,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        };

        return duration.set(fourWeeks).normalize().months === 1 ? "casual" : "longterm";
    };

    static getCldrMajorVersion() {
        try {
            const cldr = process?.versions?.cldr;
            if (cldr) {
                const match = cldr.match(/^(\d+)\./);
                if (match) {
                    return parseInt(match[1]);
                }
            }
            return null;
        }
        catch {
            return null;
        }
    };

    static nullify(x: number): number | null {
        if (x) {
            return x;
        }

        return null;
    }

    static setUnset<T extends keyof typeof Settings>(prop: T): (value: unknown, f: () => void) => void {
        return (value: unknown, f) => {
            const existing = Settings[prop];
            try {
                // @ts-ignore
                Settings[prop] = value;
                f();
            }
            finally {
                Settings[prop] = existing;
            }
        };
    }

    // WITH

    static withDefaultLocale(locale: string | undefined, f: Function) {
        const previousDefaultLocale = Settings.defaultLocale;
        try {
            Settings.defaultLocale = locale;
            f();
        }
        finally {
            Settings.defaultLocale = previousDefaultLocale;
        }
    }

    static withDefaultNumberingSystem(numberingSystem: NumberingSystem | undefined, f: Function) {
        const previousNumberingSystem = Settings.defaultNumberingSystem;
        try {
            Settings.defaultNumberingSystem = numberingSystem;
            f();
        }
        finally {
            Settings.defaultNumberingSystem = previousNumberingSystem;
        }
    }

    static withDefaultOutputCalendar(outputCalendar: CalendarSystem | undefined, f: Function) {
        const previousOutputCalendar = Settings.defaultOutputCalendar;
        try {
            Settings.defaultOutputCalendar = outputCalendar;
            f();
        }
        finally {
            Settings.defaultOutputCalendar = previousOutputCalendar;
        }
    }

    static withDefaultZone(zone: string, f: Function) {
        try {
            Settings.defaultZoneLike = zone;
            f();
        }
        finally {
            Settings.defaultZoneLike = null;
        }
    }

    static withNow(name: string, dt: DateTime, f: Function) {
        test(name, () => {
            const previousNow = Settings.now;

            try {
                Settings.now = () => dt.valueOf();
                f();
            }
            finally {
                Settings.now = previousNow;
            }
        });
    }

    static withoutLocaleWeekInfo = function(name: string, f: () => void) {
        const fullName = `With no Intl.Locale.weekInfo support, ${name}`;
        test(fullName, () => {
            const l = Intl.Locale;
            try {
                // @ts-ignore
                Intl.Locale = undefined;
                Settings.resetCaches();
                f();
            }
            finally {
                // @ts-ignore
                Intl.Locale = l;
            }
        });
    };

    static withThrowOnInvalid(value: boolean, callback: Function) {
        const existing = Settings.throwOnInvalid;
        try {
            Settings.throwOnInvalid = value;
            callback();
        }
        finally {
            Settings.throwOnInvalid = existing;
        }
    }

    // WITHOUT

    static withoutRTF(name: string, f: Function) {
        const fullName = `With no RelativeTimeFormat support, ${name}`;
        test(fullName, () => {
            const rtf = Intl.RelativeTimeFormat;
            try {
                // @ts-expect-error no other way to override
                Intl.RelativeTimeFormat = undefined;
                Settings.resetCaches();
                f();
            }
            finally {
                // @ts-expect-error no other way to override
                Intl.RelativeTimeFormat = rtf;
            }
        });
    }

}
