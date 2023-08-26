import { Info, WeekUnitLengths, UnitLength } from "../../src";
import { Helpers } from "../helpers";

// ------
// .months()
// ------

test("Info.months lists all the months", () => {
    expect(Info.months("long")).toEqual(Helpers.months_IT);

    expect(Info.months("short", { locale: "en" })).toEqual([
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ]);

    expect(Info.months("narrow", { locale: "en" })).toEqual([
        "J",
        "F",
        "M",
        "A",
        "M",
        "J",
        "J",
        "A",
        "S",
        "O",
        "N",
        "D"
    ]);

    expect(Info.months("numeric", { locale: "en" })).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
    ]);

    expect(Info.months("2-digit", { locale: "en" })).toEqual([
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12"
    ]);
});

test("Info.months respects the numbering system", () => {
    expect(Info.months("numeric", { locale: "en", numberingSystem: "beng" })).toEqual([
        "১",
        "২",
        "৩",
        "৪",
        "৫",
        "৬",
        "৭",
        "৮",
        "৯",
        "১০",
        "১১",
        "১২"
    ]);
});

test("Info.months respects the calendar", () => {
    expect(Info.months("long", { locale: "en", outputCalendar: "islamic" })).toEqual([
        "Muharram",
        "Safar",
        "Rabiʻ I",
        "Rabiʻ II",
        "Jumada I",
        "Jumada II",
        "Rajab",
        "Shaʻban",
        "Ramadan",
        "Shawwal",
        "Dhuʻl-Qiʻdah",
        "Dhuʻl-Hijjah",
    ]);
});

test("Info.months respects the locale", () => {
    expect(Info.months("numeric", { locale: "bn" })).toEqual([
        "১",
        "২",
        "৩",
        "৪",
        "৫",
        "৬",
        "৭",
        "৮",
        "৯",
        "১০",
        "১১",
        "১২"
    ]);

    // these should arguably be 1月, 2月, etc, but this at least documents how it works
    expect(Info.months("short", { locale: "ja-JP" })).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
    ]);

    expect(Info.monthsFormat("long", { locale: "ru" })).toEqual([
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря"
    ]);
});

test("Info.months defaults to long names", () => {
    expect(Info.months()).toEqual(Helpers.months_IT);
});

// ------
// .monthsFormat()
// ------
test("Info.monthsFormat lists all the months", () => {
    expect(Info.monthsFormat("long", { locale: "en" })).toEqual(Helpers.months_EN);

    // this passes, but is wrong. These are the same as the standalone values
    expect(Info.monthsFormat("long", { locale: "ru" })).toEqual([
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря"
    ]);

    expect(Info.monthsFormat("short", { locale: "en" })).toEqual([
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ]);

    expect(Info.monthsFormat("numeric", { locale: "en" })).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
    ]);
});

test("Info.monthsFormat defaults to long names", () => {
    expect(Info.monthsFormat(void 0, { locale: "it-IT" })).toEqual(Helpers.months_IT);
});

// ------
// .weekdays()
// ------
test("Info.weekdays lists all the weekdays", () => {
    expect(Info.weekdays("long", { locale: "en-US" })).toEqual([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ]);

    expect(Info.weekdays("short", { locale: "en-US" })).toEqual([
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ]);

    expect(Info.weekdays("narrow", { locale: "en" })).toEqual(["M", "T", "W", "T", "F", "S", "S"]);

    expect(Info.weekdays("long", { locale: "ru" })).toEqual([
        "понедельник",
        "вторник",
        "среда",
        "четверг",
        "пятница",
        "суббота",
        "воскресенье"
    ]);
});

test("Info.weekdays defaults to long names", () => {
    expect(Info.weekdays()).toEqual(Helpers.days_IT);
    // "Monday",
    // "Tuesday",
    // "Wednesday",
    // "Thursday",
    // "Friday",
    // "Saturday",
    // "Sunday"

});

// ------
// .weekdaysFormat()
// ------
test("Info.weekdaysFormat lists all the weekdays", () => {
    expect(Info.weekdaysFormat("long", { locale: "en" })).toEqual([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ]);

    expect(Info.weekdaysFormat("short", { locale: "en" })).toEqual([
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ]);
});

test("Info.weekdaysFormat defaults to long names", () => {
    expect(Info.weekdaysFormat(void 0, { locale: "it-IT" })).toEqual(Helpers.days_IT);
});

// ------
// .meridiems()
// ------
test("Info.meridiems lists the meridiems", () => {
    expect(Info.meridiems({ locale: "en" })).toEqual(["AM", "PM"]);
    expect(Info.meridiems({ locale: "my" })).toEqual(["နံနက်", "ညနေ"]);
});

test("Info.meridiems defaults to the current locale", () => {
    expect(Info.meridiems()).toEqual(["AM", "PM"]);
});

// ------
// .eras()
// ------

test("Info.eras lists both eras", () => {
    const expectedShort = [
        // "BC", "AD" // US
        "a.C.", "d.C." // IT
    ];
    expect(Info.eras()).toEqual(expectedShort);
    expect(Info.eras("short")).toEqual(expectedShort);
    expect(Info.eras("long")).toEqual([
        // "Before Christ", "Anno Domini" // US
        "avanti Cristo", "dopo Cristo" // IT
    ]);
    expect(Info.eras("short", { locale: "fr" })).toEqual(["av. J.-C.", "ap. J.-C."]);
    expect(Info.eras("long", { locale: "fr" })).toEqual(["avant Jésus-Christ", "après Jésus-Christ"]);
});

// ------
// general
// ------
test("Info English lists are not mutable", () => {
    Helpers.withDefaultLocale("en-US", () => {
        const strUnitLength: UnitLength[] = [
            "narrow", "short", "long", "numeric", "2-digit"
        ];
        const cachingMethods = [
            { method: Info.weekdays, args: strUnitLength.slice(0, 3) as WeekUnitLengths[] },
            { method: Info.months, args: strUnitLength.slice() },
            { method: Info.eras, args: strUnitLength.slice(0, 2) }
        ];

        cachingMethods.forEach((item) => {
            const fn = item.method;
            item.args.forEach((arg: UnitLength) => {
                const original = [...fn(arg)];
                fn(arg).pop(); // change result to see if original is changed as well
                const expected = fn(arg);
                expect(expected).toEqual(original);
            });
        });
    });
});
