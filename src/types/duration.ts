import { ConversionAccuracy } from "./common";
import { NumberingSystem } from "./locale";
import Intl from "./intl-next";

export interface DurationOptions {
    locale?: string;
    numberingSystem?: NumberingSystem;
    conversionAccuracy?: ConversionAccuracy;
}

export interface DurationObject {
    years?: number;
    year?: number;
    quarters?: number;
    quarter?: number;
    months?: number;
    month?: number;
    weeks?: number;
    week?: number;
    days?: number;
    day?: number;
    hours?: number;
    hour?: number;
    minutes?: number;
    minute?: number;
    seconds?: number;
    second?: number;
    milliseconds?: number;
    millisecond?: number;
}

export interface UnparsedDurationObject {
    years?: string | number;
    year?: string | number;
    quarters?: string | number;
    quarter?: string | number;
    months?: string | number;
    month?: string | number;
    weeks?: string | number;
    week?: string | number;
    days?: string | number;
    day?: string | number;
    hours?: string | number;
    hour?: string | number;
    minutes?: string | number;
    minute?: string | number;
    seconds?: string | number;
    second?: string | number;
    milliseconds?: string | number;
    millisecond?: string | number;
}

export type DurationUnit = keyof DurationObject;

export interface DurationToFormatOptions {
    floor?: boolean;
    round?: boolean;
}

export interface NormalizedDurationObject {
    years?: number;
    quarters?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

export type NormalizedDurationUnit = keyof NormalizedDurationObject;
export type NormalizedHumanDurationUnit = Exclude<NormalizedDurationUnit, "quarters" | "weeks">;

export interface DurationToHumanOptions {
    listStyle?: Intl.ListFormatOptions["style"];
    onlyHumanUnits?: boolean;
}
