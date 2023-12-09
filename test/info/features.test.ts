import { Info } from "../../src";
import { Helpers } from "../helpers";

test("Info.features shows this environment supports all the features", () => {
    expect(Info.features().relative).toBe(true);
});

Helpers.withoutRTF("Info.features shows no support", () => {
    expect(Info.features().relative).toBe(false);
});

Helpers.withoutLocaleWeekInfo("Info.features shows no support", () => {
    expect(Info.features().localeWeek).toBe(false);
});
