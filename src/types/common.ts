export type ConversionAccuracy = "casual" | "longterm";

export type StringUnitLength = "narrow" | "short" | "long";
export type WeekUnitLengths = StringUnitLength | "numeric";
export type NumberUnitLength = "numeric" | "2-digit";
export type UnitLength = StringUnitLength | NumberUnitLength;
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;
