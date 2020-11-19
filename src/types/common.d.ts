export declare type ConversionAccuracy = "casual" | "longterm";
export declare type HourCycle = "h11" | "h12" | "h23" | "h24";
export declare type StringUnitLength = "narrow" | "short" | "long";
export declare type NumberUnitLength = "numeric" | "2-digit";
export declare type UnitLength = StringUnitLength | NumberUnitLength;
export interface ThrowOnInvalid {
    nullOnInvalid?: false;
}
