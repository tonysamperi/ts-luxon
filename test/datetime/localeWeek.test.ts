import {DateTime} from "../../src/datetime";
import {Info} from "../../src/info";
import {Helpers} from "../helpers";

const withDefaultWeekSettings = Helpers.setUnset("defaultWeekSettings");

//------
// .startOf() with useLocaleWeeks
//------
test("startOf(week) with useLocaleWeeks adheres to the locale", () => {
    const dt = DateTime.fromISO("2023-06-14T13:00:00Z", {setZone: true});
    expect(
        dt.reconfigure({locale: "de-DE"}).startOf("week", {useLocaleWeeks: true}).toISO()
    ).toBe("2023-06-12T00:00:00.000Z");
    expect(
        dt.reconfigure({locale: "en-US"}).startOf("week", {useLocaleWeeks: true}).toISO()
    ).toBe("2023-06-11T00:00:00.000Z");
});

test("startOf(week) with useLocaleWeeks handles crossing into the previous year", () => {
    const dt = DateTime.fromISO("2023-01-01T13:00:00Z", {setZone: true});
    expect(
        dt.reconfigure({locale: "de-DE"}).startOf("week", {useLocaleWeeks: true}).toISO()
    ).toBe("2022-12-26T00:00:00.000Z");
});

//------
// .endOf() with useLocaleWeeks
//------
test("endOf(week) with useLocaleWeeks adheres to the locale", () => {
    const dt = DateTime.fromISO("2023-06-14T13:00:00Z", {setZone: true});
    expect(dt.reconfigure({locale: "de-DE"}).endOf("week", {useLocaleWeeks: true}).toISO()).toBe(
        "2023-06-18T23:59:59.999Z"
    );
    expect(dt.reconfigure({locale: "en-US"}).endOf("week", {useLocaleWeeks: true}).toISO()).toBe(
        "2023-06-17T23:59:59.999Z"
    );
});

test("endOf(week) with useLocaleWeeks handles crossing into the next year", () => {
    const dt = DateTime.fromISO("2022-12-31T13:00:00Z", {setZone: true});
    expect(dt.reconfigure({locale: "de-DE"}).endOf("week", {useLocaleWeeks: true}).toISO()).toBe(
        "2023-01-01T23:59:59.999Z"
    );
});

//------
// .hasSame() with useLocaleWeeks
//------
test("hasSame(week) with useLocaleWeeks adheres to the locale", () => {
    const dt1 = DateTime.fromISO("2023-06-11T03:00:00Z", {setZone: true, locale: "en-US"});
    const dt2 = DateTime.fromISO("2023-06-14T03:00:00Z", {setZone: true, locale: "en-US"});
    expect(dt1.hasSame(dt2, "week", {useLocaleWeeks: true})).toBe(true);

    const dt3 = DateTime.fromISO("2023-06-14T03:00:00Z", {setZone: true, locale: "en-US"});
    const dt4 = DateTime.fromISO("2023-06-18T03:00:00Z", {setZone: true, locale: "en-US"});
    expect(dt3.hasSame(dt4, "week", {useLocaleWeeks: true})).toBe(false);
});

test("hasSame(week) with useLocaleWeeks ignores the locale of otherDateTime", () => {
    const dt1 = DateTime.fromISO("2023-06-11T03:00:00Z", {setZone: true, locale: "en-US"});
    const dt2 = DateTime.fromISO("2023-06-14T03:00:00Z", {setZone: true, locale: "de-DE"});
    expect(dt1.hasSame(dt2, "week", {useLocaleWeeks: true})).toBe(true);
    expect(dt2.hasSame(dt1, "week", {useLocaleWeeks: true})).toBe(false);
});

//------
// .isWeekend
//------

const week = [
    "2023-07-31T00:00:00Z", // Monday
    "2023-08-01T00:00:00Z",
    "2023-08-02T00:00:00Z",
    "2023-08-03T00:00:00Z",
    "2023-08-04T00:00:00Z",
    "2023-08-05T00:00:00Z",
    "2023-08-06T00:00:00Z" // Sunday
];
test("isWeekend in locale en-US reports Saturday and Sunday as weekend", () => {
    const dates = week.map(
        (iso) => DateTime.fromISO(iso, {setZone: true, locale: "en-US"}).isWeekend
    );
    expect(dates).toStrictEqual([false, false, false, false, false, true, true]);
});

test("isWeekend in locale he reports Friday and Saturday as weekend", () => {
    const dates = week.map((iso) => DateTime.fromISO(iso, {setZone: true, locale: "he"}).isWeekend);
    expect(dates).toStrictEqual([false, false, false, false, true, true, false]);
});

//------
// .localWeekNumber / .localWeekYear
//------
describe("localWeekNumber in locale de-DE", () => {
    test("Jan  1 2012 should be week 52, year 2011", () => {
        const dt = DateTime.fromISO("2012-01-01", {locale: "de-DE"});
        expect(dt.localWeekNumber).toBe(52);
        expect(dt.localWeekYear).toBe(2011);
    });
    test("Jan  2 2012 should be week 1, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-02", {locale: "de-DE"});
        expect(dt.localWeekNumber).toBe(1);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan  8 2012 should be week 1, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-08", {locale: "de-DE"});
        expect(dt.localWeekNumber).toBe(1);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan 9 2012 should be week 2, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-09", {locale: "de-DE"});
        expect(dt.localWeekNumber).toBe(2);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan 15 2012 should be week 2, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-15", {locale: "de-DE"});
        expect(dt.localWeekNumber).toBe(2);
        expect(dt.localWeekYear).toBe(2012);
    });
});

describe("localWeekNumber in locale en-US", () => {
    test("Jan  1 2012 should be week 1, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-01", {locale: "en-US"});
        expect(dt.localWeekNumber).toBe(1);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan  7 2012 should be week 1, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-07", {locale: "en-US"});
        expect(dt.localWeekNumber).toBe(1);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan  8 2012 should be week 2, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-08", {locale: "en-US"});
        expect(dt.localWeekNumber).toBe(2);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan  14 2012 should be week 2, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-14", {locale: "en-US"});
        expect(dt.localWeekNumber).toBe(2);
        expect(dt.localWeekYear).toBe(2012);
    });
    test("Jan  15 2012 should be week 3, year 2012", () => {
        const dt = DateTime.fromISO("2012-01-15", {locale: "en-US"});
        expect(dt.localWeekNumber).toBe(3);
        expect(dt.localWeekYear).toBe(2012);
    });
});

//------
// .localWeekday
//------
describe("localWeekday in locale en-US", () => {
    test("Sunday should be reported as the 1st day of the week", () => {
        const dt = DateTime.fromISO("2023-08-06", {locale: "en-US"});
        expect(dt.localWeekday).toBe(1);
    });
    test("Monday should be reported as the 2nd day of the week", () => {
        const dt = DateTime.fromISO("2023-08-07", {locale: "en-US"});
        expect(dt.localWeekday).toBe(2);
    });
    test("Tuesday should be reported as the 3rd day of the week", () => {
        const dt = DateTime.fromISO("2023-08-08", {locale: "en-US"});
        expect(dt.localWeekday).toBe(3);
    });
    test("Wednesday should be reported as the 4th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-09", {locale: "en-US"});
        expect(dt.localWeekday).toBe(4);
    });
    test("Thursday should be reported as the 5th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-10", {locale: "en-US"});
        expect(dt.localWeekday).toBe(5);
    });
    test("Friday should be reported as the 6th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-11", {locale: "en-US"});
        expect(dt.localWeekday).toBe(6);
    });
    test("Saturday should be reported as the 7th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-12", {locale: "en-US"});
        expect(dt.localWeekday).toBe(7);
    });
});

describe("localWeekday in locale de-DE", () => {
    test("Monday should be reported as the 1st day of the week", () => {
        const dt = DateTime.fromISO("2023-08-07", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(1);
    });
    test("Tuesday should be reported as the 2nd day of the week", () => {
        const dt = DateTime.fromISO("2023-08-08", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(2);
    });
    test("Wednesday should be reported as the 3rd day of the week", () => {
        const dt = DateTime.fromISO("2023-08-09", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(3);
    });
    test("Thursday should be reported as the 4th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-10", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(4);
    });
    test("Friday should be reported as the 5th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-11", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(5);
    });
    test("Saturday should be reported as the 6th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-12", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(6);
    });
    test("Sunday should be reported as the 7th day of the week", () => {
        const dt = DateTime.fromISO("2023-08-13", {locale: "de-DE"});
        expect(dt.localWeekday).toBe(7);
    });
});

describe("weeksInLocalWeekYear", () => {
    test("2018 should have 53 weeks in en-US", () => {
        expect(DateTime.local(2018, 6, 1, {locale: "en-US"}).weeksInLocalWeekYear).toBe(52);
    });
    test("2022 should have 53 weeks in en-US", () => {
        expect(DateTime.local(2022, 6, 1, {locale: "en-US"}).weeksInLocalWeekYear).toBe(Helpers.supportsMinDaysInFirstWeek() ? 53 : 52);
    });
    test("2022 should have 52 weeks in de-DE", () => {
        expect(DateTime.local(2022, 6, 1, {locale: "de-DE"}).weeksInLocalWeekYear).toBe(52);
    });
    test("2020 should have 53 weeks in de-DE", () => {
        expect(DateTime.local(2020, 6, 1, {locale: "de-DE"}).weeksInLocalWeekYear).toBe(53);
    });
    test("2018 should have 52 weeks with minDays 1, start 7", () => {
        withDefaultWeekSettings(
            {
                minimalDays: 1,
                firstDay: 7,
                weekend: [6, 7]
            },
            () => {
                expect(DateTime.local(2018, 6, 1).weeksInLocalWeekYear).toBe(52);
            }
        );
    });
    test("2022 should have 53 weeks with minDays 1, start 7", () => {
        withDefaultWeekSettings(
            {
                minimalDays: 1,
                firstDay: 7,
                weekend: [6, 7]
            },
            () => {
                expect(DateTime.local(2022, 6, 1).weeksInLocalWeekYear).toBe(53);
            }
        );
    });
});

describe("Week settings can be overridden", () => {
    test("Overridden week info should be reported by Info", () => {
        withDefaultWeekSettings({firstDay: 3, minimalDays: 5, weekend: [4, 6]}, () => {
            expect(Info.getStartOfWeek()).toBe(3);
            expect(Info.getMinimumDaysInFirstWeek()).toBe(5);
            expect(Info.getWeekendWeekdays()).toEqual([4, 6]);
        });
    });

    test("Overridden week info should be reported by DateTime#isWeekend", () => {
        withDefaultWeekSettings({firstDay: 7, minimalDays: 1, weekend: [1, 3]}, () => {
            expect(DateTime.local(2022, 1, 31).isWeekend).toBe(true);
            expect(DateTime.local(2022, 2, 1).isWeekend).toBe(false);
            expect(DateTime.local(2022, 2, 2).isWeekend).toBe(true);
            expect(DateTime.local(2022, 2, 3).isWeekend).toBe(false);
            expect(DateTime.local(2022, 2, 4).isWeekend).toBe(false);
            expect(DateTime.local(2022, 2, 5).isWeekend).toBe(false);
            expect(DateTime.local(2022, 2, 6).isWeekend).toBe(false);
        });
    });
    test("Overridden week info should be respected by DateTime accessors", () => {
        withDefaultWeekSettings({firstDay: 7, minimalDays: 1, weekend: [6, 7]}, () => {
            const dt = DateTime.local(2022, 1, 1, {locale: "de-DE"});
            expect(dt.localWeekday).toBe(7);
            expect(dt.localWeekNumber).toBe(1);
            expect(dt.localWeekYear).toBe(2022);
        });
    });
    test("Overridden week info should be respected by DateTime#set", () => {
        withDefaultWeekSettings({firstDay: 7, minimalDays: 1, weekend: [6, 7]}, () => {
            const dt = DateTime.local(2022, 1, 1, {locale: "de-DE"});
            const modified = dt.set({localWeekday: 1});
            expect(modified.year).toBe(2021);
            expect(modified.month).toBe(12);
            expect(modified.day).toBe(26);
        });
    });
});
