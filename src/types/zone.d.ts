import Zone from "../zone";
export interface ZoneOffsetOptions {
    format?: "short" | "long";
    locale?: string;
}
export declare type ZoneOffsetFormat = "narrow" | "short" | "techie";
export declare type ZoneLike = Zone | number | string | null | undefined;
