/* eslint import/no-extraneous-dependencies: off */
/* eslint no-console: off */
import Benchmark from "benchmark";
import { DateTime, Settings } from "../src";

function runDateTimeSuite() {
    return new Promise((resolve, reject) => {
        const suite = new Benchmark.Suite();

        const dt = DateTime.now();
        const formatParser = DateTime.buildFormatParser("yyyy/MM/dd HH:mm:ss.SSS");

        suite
            .add("DateTime.now", () => {
                DateTime.now();
            })
            .add("DateTime.fromObject with locale", () => {
                DateTime.fromObject({}, { locale: "fr" });
            })
            .add("DateTime.local with numbers", () => {
                DateTime.local(2017, 5, 15);
            })
            .add("DateTime.local with numbers and zone", () => {
                DateTime.local(2017, 5, 15, 11, 7, 35, { zone: "America/New_York" });
            })
            .add("DateTime.fromISO", () => {
                DateTime.fromISO("1982-05-25T09:10:11.445Z");
            })
            .add("DateTime.fromSQL", () => {
                DateTime.fromSQL("2016-05-14 10:23:54.2346");
            })
            .add("DateTime.fromFormat", () => {
                DateTime.fromFormat("1982/05/25 09:10:11.445", "yyyy/MM/dd HH:mm:ss.SSS");
            })
            .add("DateTime.fromFormat with zone", () => {
                DateTime.fromFormat("1982/05/25 09:10:11.445", "yyyy/MM/dd HH:mm:ss.SSS", {
                    zone: "America/Los_Angeles"
                });
            })
            .add("DateTime.fromFormatParser", () => {
                DateTime.fromFormatParser("1982/05/25 09:10:11.445", formatParser);
            })
            .add("DateTime.fromFormatParser with zone", () => {
                DateTime.fromFormatParser("1982/05/25 09:10:11.445", formatParser, {
                    zone: "America/Los_Angeles"
                });
            })
            .add("DateTime#setZone", () => {
                dt.setZone("America/Los_Angeles");
            })
            .add("DateTime#toFormat", () => {
                dt.toFormat("yyyy-MM-dd");
            })
            .add("DateTime#toFormat with macro", () => {
                dt.toFormat("T");
            })
            .add("DateTime#toFormat with macro no cache", () => {
                dt.toFormat("T");
                Settings.resetCaches();
            })
            .add("DateTime#format in german", () => {
                dt.setLocale("de-De").toFormat("d. LLL. HH:mm");
            })
            .add("DateTime#format in german and no-cache", () => {
                dt.setLocale("de-De").toFormat("d. LLL. HH:mm");
                Settings.resetCaches();
            })
            .add("DateTime#add", () => {
                dt.plus({ milliseconds: 3434 });
            })
            .add("DateTime#toISO", () => {
                dt.toISO();
            })
            .add("DateTime#toLocaleString", () => {
                dt.toLocaleString();
            })
            .add("DateTime#toLocaleString in utc", () => {
                dt.toUTC().toLocaleString();
            })
            .add("DateTime#toRelativeCalendar", () => {
                dt.toRelativeCalendar({ base: DateTime.now(), locale: "fi" });
            })
            .on("cycle", (event: any) => {
                console.log(String(event.target));
            })
            // eslint-disable-next-line func-names
            .on("complete", function() {
                // @ts-ignore
                console.log("Fastest is " + this.filter("fastest").map("name"));
                resolve(void 0);
            })
            .on("error", function() {
                // @ts-ignore
                reject(this.error);
            })
            .run();
    });
}

export const ALL_SUITES = [runDateTimeSuite];
export default ALL_SUITES;
