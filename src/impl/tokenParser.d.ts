import Locale from "./locale";
import { GenericDateTime, ExplainedFormat } from "../types/datetime";
import Zone from "../zone";
/**
 * @private
 */
export declare function explainFromTokens(locale: Locale, input: string, format: string): ExplainedFormat;
export declare function parseFromTokens(locale: Locale, input: string, format: string): [GenericDateTime | null | undefined, Zone | null | undefined, string | undefined];
