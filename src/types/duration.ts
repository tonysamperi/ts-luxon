import { ConversionAccuracy } from "./common";
import { NumberingSystem } from "./locale";
import { Locale } from "../impl/locale";
import { Invalid } from "./invalid";
import Intl from "./intl-next";
import { LocalWeekDateTime, LocalWeekDateTimePlurals } from "./datetime";

export type ConversionMatrixUnit = Exclude<NormalizedDurationUnit, "milliseconds" | keyof LocalWeekDateTime>;
export type ConversionMatrix = Readonly<{ [keya in ConversionMatrixUnit]: { [keyb in NormalizedDurationUnit]?: number } }>;

export interface DurationOptions {
    conversionAccuracy?: ConversionAccuracy;
    locale?: string;
    matrix?: ConversionMatrix;
    numberingSystem?: NumberingSystem;
}

export type DurationObject = {
    day?: number;
    days?: number;
    hour?: number;
    hours?: number;
    millisecond?: number;
    milliseconds?: number;
    minute?: number;
    minutes?: number;
    month?: number;
    months?: number;
    quarter?: number;
    quarters?: number;
    second?: number;
    seconds?: number;
    week?: number;
    weeks?: number;
    year?: number;
    years?: number;
} & Partial<LocalWeekDateTime> & Partial<LocalWeekDateTimePlurals>;

export type UnparsedDurationObject = Partial<Record<keyof DurationObject, string | number>>;

export type DurationUnit = keyof DurationObject;

export interface DurationToFormatOptions {
    floor?: boolean;
    round?: boolean;
}

export interface NormalizedDurationObject {
    days?: number;
    hours?: number;
    milliseconds?: number;
    minutes?: number;
    months?: number;
    quarters?: number;
    seconds?: number;
    weeks?: number;
    years?: number;
}

export type NormalizedDurationUnit = keyof NormalizedDurationObject;
export type NormalizedHumanDurationUnit = Exclude<NormalizedDurationUnit, "quarters" | "weeks">;

export interface DurationToHumanOptions {
    listStyle?: Intl.ListFormatOptions["style"];
    onlyHumanUnits?: boolean;
}

export interface DurationConfig {
    conversionAccuracy?: ConversionAccuracy;
    invalid?: Invalid;
    loc?: Locale;
    matrix?: ConversionMatrix;
    values?: NormalizedDurationObject;
}
