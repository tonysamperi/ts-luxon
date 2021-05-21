/* eslint import/no-extraneous-dependencies: off */
/* eslint no-console: off */
import Benchmark from "benchmark";
import { Info} from "../src";
import { Locale } from "../src/impl/locale.js";

function runWeekdaysSuite() {
    return new Promise((resolve, reject) => {
        const locale = Locale.create();

        new Benchmark.Suite()
            .add("Info.weekdays with existing locale", () => {
                Info.weekdays("long", { locObj: locale });
            })
            .add("Info.weekdays", () => {
                Info.weekdays("long");
            })
            .on("cycle", (event: any) => {
                console.log(String(event.target));
            })
            // eslint-disable-next-line func-names
            .on("complete", function() {
                // @ts-ignore
                console.log("Fastest is " + this.filter("fastest").map("name"));
                resolve();
            })
            .on("error", function() {
                // @ts-ignore
                reject(this.error);
            })
            .run();
    });
}

function runWeekdaysFormatSuite() {
    return new Promise((resolve, reject) => {
        const locale = Locale.create();

        new Benchmark.Suite()
            .add("Info.weekdaysFormat with existing locale", () => {
                Info.weekdaysFormat("long", { locObj: locale });
            })
            .add("Info.weekdaysFormat", () => {
                Info.weekdaysFormat("long");
            })
            .on("cycle", (event: any) => {
                console.log(String(event.target));
            })
            // eslint-disable-next-line func-names
            .on("complete", function() {
                // @ts-ignore
                console.log("Fastest is " + this.filter("fastest").map("name"));
                resolve();
            })
            .on("error", function() {
                // @ts-ignore
                reject(this.error);
            })
            .run();
    });
}

function runMonthsSuite() {
    return new Promise((resolve, reject) => {
        const locale = Locale.create();
        new Benchmark.Suite()
            .add("Info.months with existing locale", () => {
                Info.months("long", { locObj: locale });
            })
            .add("Info.months", () => {
                Info.months("long");
            })
            .on("cycle", (event: any) => {
                console.log(String(event.target));
            })
            // eslint-disable-next-line func-names
            .on("complete", function() {
                // @ts-ignore
                console.log("Fastest is " + this.filter("fastest").map("name"));
                resolve();
            })
            .on("error", function() {
                // @ts-ignore
                reject(this.error);
            })
            .run();
    });
}

function runMonthsFormatSuite() {
    return new Promise((resolve, reject) => {
        const locale = Locale.create();

        new Benchmark.Suite()
            .add("Info.monthsFormat with existing locale", () => {
                Info.monthsFormat("long", { locObj: locale });
            })
            .add("Info.monthsFormat", () => {
                Info.monthsFormat("long");
            })
            .on("cycle", (event: any) => {
                console.log(String(event.target));
            })
            // eslint-disable-next-line func-names
            .on("complete", function() {
                // @ts-ignore
                console.log("Fastest is " + this.filter("fastest").map("name"));
                resolve();
            })
            .on("error", function() {
                // @ts-ignore
                reject(this.error);
            })
            .run();
    });
}

export const ALL_SUITES = [runMonthsSuite, runMonthsFormatSuite, runWeekdaysSuite, runWeekdaysFormatSuite];

export default ALL_SUITES;
