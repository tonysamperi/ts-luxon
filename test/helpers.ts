import {
  DateTime,
  Settings,
  Duration,
  NumberingSystem,
  CalendarSystem
} from "../src";

export const withoutIntl = (name: string, f: Function) => {
  const fullName = `With no Intl support, ${name}`;
  test(fullName, () => {
    const intl = Intl;
    try {
      // @ts-expect-error
      Intl = undefined;
      Settings.resetCaches();
      f();
    } finally {
      Settings.resetCaches();
      // @ts-expect-error
      Intl = intl;
    }
  });
};

const withoutFTP = (name: string, f: Function) => {
  const fullName = `With no FormatToParts support, ${name}`;
  test(fullName, () => {
    const { formatToParts } = Intl.DateTimeFormat.prototype;
    try {
      Intl.DateTimeFormat.prototype.formatToParts = undefined;
      Settings.resetCaches();
      f();
    } finally {
      Intl.DateTimeFormat.prototype.formatToParts = formatToParts;
    }
  });
};

const withoutRTF = (name: string, f: Function) => {
  const fullName = `With no RelativeTimeFormat support, ${name}`;
  test(fullName, () => {
    // @ts-ignore
    const rtf = Intl.RelativeTimeFormat;
    try {
      // @ts-expect-error
      Intl.RelativeTimeFormat = undefined;
      Settings.resetCaches();
      f();
    } finally {
      // @ts-ignore
      Intl.RelativeTimeFormat = rtf;
    }
  });
};

const withoutZones = (name: string, f: Function) => {
  const fullName = `With no time zone support, ${name}`;
  test(fullName, () => {
    const { DateTimeFormat } = Intl;
    try {
      // @ts-expect-error
      Intl.DateTimeFormat = (locale, options = {}) => {
        if (options.timeZone) {
          // tslint:disable-next-line:no-string-throw
          throw `Unsupported time zone specified ${options.timeZone}`;
        }
        return DateTimeFormat(locale, options);
      };

      Intl.DateTimeFormat.prototype = DateTimeFormat.prototype;

      Settings.resetCaches();
      f();
    } finally {
      Intl.DateTimeFormat = DateTimeFormat;
    }
  });
};

const withNow = (name: string, dt: DateTime, f: Function) => {
  test(name, () => {
    const previousNow = Settings.now;

    try {
      Settings.now = () => dt.valueOf();
      f();
    } finally {
      Settings.now = previousNow;
    }
  });
};

export const withDefaultZone = (zone: string, f: Function) => {
  try {
    Settings.defaultZoneName = zone;
    f();
  } finally {
    Settings.defaultZoneName = null;
  }
};

export const withDefaultLocale = (locale: string | undefined, f: Function) => {
  const previousDefaultLocale = Settings.defaultLocale;
  try {
    Settings.defaultLocale = locale;
    f();
  } finally {
    Settings.defaultLocale = previousDefaultLocale;
  }
};

export const withDefaultNumberingSystem = (numberingSystem: NumberingSystem | undefined, f: Function) => {
  const previousNumberingSystem = Settings.defaultNumberingSystem;
  try {
    Settings.defaultNumberingSystem = numberingSystem;
    f();
  } finally {
    Settings.defaultNumberingSystem = previousNumberingSystem;
  }
};

export const withDefaultOutputCalendar = (outputCalendar: CalendarSystem | undefined, f: Function) => {
  const previousOutputCalendar = Settings.defaultOutputCalendar;
  try {
    Settings.defaultOutputCalendar = outputCalendar;
    f();
  } finally {
    Settings.defaultOutputCalendar = previousOutputCalendar;
  }
};

const atHour = (hour: number) => {
  return DateTime.fromObject({ year: 2017, month: 5, day: 25 }).startOf("day").set({ hour });
};

const conversionAccuracy = (duration: Duration) => {
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

export const months_IT = [
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

export const months_EN = [
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

export const days_IT = [
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
  "domenica"
];

export const days_EN = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export const withThrowOnInvalid = (value: boolean, callback: Function) => {
    const existing = Settings.throwOnInvalid;
    try {
      Settings.throwOnInvalid = value;
      callback();
    } finally {
      Settings.throwOnInvalid = existing;
    }
};

export const Helpers = {
  atHour,
  withDefaultZone,
  withDefaultLocale,
  withDefaultNumberingSystem,
  withDefaultOutputCalendar,
  withNow,
  withoutFTP,
  withoutIntl,
  withoutRTF,
  withoutZones,
  withThrowOnInvalid,
  conversionAccuracy
};
