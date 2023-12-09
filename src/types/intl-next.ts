/* eslint-disable @typescript-eslint/member-ordering, @typescript-eslint/no-namespace, @typescript-eslint/naming-convention */
// We keep this file to integrate modifications which aren't in ts lib intl yey

// This file can be removed once es2020.intl is part of TS
// and can be added in the 'lib' section of tsconfig.json

declare namespace Intl {
    interface CollatorOptions {
        caseFirst?: string;
        localeMatcher?: string;
        numeric?: boolean;
        usage?: string;
        sensitivity?: string;
        ignorePunctuation?: boolean;
    }

    interface ResolvedCollatorOptions {
        locale: string;
        usage: string;
        sensitivity: string;
        ignorePunctuation: boolean;
        collation: string;
        caseFirst: string;
        numeric: boolean;
    }

    interface Collator {
        compare(x: string, y: string): number;

        resolvedOptions(): ResolvedCollatorOptions;
    }

    let Collator: {
        new(locales?: string | string[], options?: CollatorOptions): Collator;
        (locales?: string | string[], options?: CollatorOptions): Collator;
        supportedLocalesOf(locales: string | string[], options?: CollatorOptions): string[];
    };

    interface NumberFormatOptions {
        localeMatcher?: string;
        style?: string;
        currency?: string;
        currencyDisplay?: string;
        useGrouping?: boolean;
        minimumIntegerDigits?: number;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        minimumSignificantDigits?: number;
        maximumSignificantDigits?: number;
        padTo?: number;
        floor?: boolean;
        unit?: string;
        unitDisplay?: "long" | "short";
    }

    interface ResolvedNumberFormatOptions {
        locale: string;
        numberingSystem: string;
        style: string;
        currency?: string;
        currencyDisplay?: string;
        minimumIntegerDigits: number;
        minimumFractionDigits: number;
        maximumFractionDigits: number;
        minimumSignificantDigits?: number;
        maximumSignificantDigits?: number;
        useGrouping: boolean;
    }

    interface NumberFormat {
        format(value: number): string;

        resolvedOptions(): ResolvedNumberFormatOptions;
    }

    // tslint:disable-next-line:naming-convention
    let NumberFormat: {
        new(locales?: string | string[], options?: NumberFormatOptions): NumberFormat;
        (locales?: string | string[], options?: NumberFormatOptions): NumberFormat;
        supportedLocalesOf(locales: string | string[], options?: NumberFormatOptions): string[];
    };

    interface DateTimeFormatOptions {
        localeMatcher?: string;
        weekday?: string;
        era?: string;
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
        timeZoneName?: string;
        formatMatcher?: string;
        hour12?: boolean;
        hourCycle?: "h11"| "h12"| "h23"| "h24";
        timeZone?: string;
        timeStyle?: "full" | "long" | "medium" | "short";
    }

    interface ResolvedDateTimeFormatOptions {
        locale: string;
        calendar: string;
        numberingSystem: string;
        timeZone: string;
        hour12?: boolean;
        weekday?: string;
        era?: string;
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
        timeZoneName?: string;
    }

    interface DateTimeFormat {
        format(date?: Date | number): string;

        /**
         * The Intl.DateTimeFormat.prototype.formatRange() formats a date range in the most concise way based on the locale and options provided when instantiating Intl.DateTimeFormat object
         * @param startDate
         * @param endDate
         */
        formatRange(startDate: Date, endDate: Date): string;
        resolvedOptions(): ResolvedDateTimeFormatOptions;
    }

    // tslint:disable-next-line:naming-convention
    let DateTimeFormat: {
        new(locales?: string | string[], options?: DateTimeFormatOptions): DateTimeFormat;
        (locales?: string | string[], options?: DateTimeFormatOptions): DateTimeFormat;
        supportedLocalesOf(locales: string | string[], options?: DateTimeFormatOptions): string[];
    };
}

declare namespace Intl {
    type DateTimeFormatPartTypes =
        "day"
        | "dayPeriod"
        | "era"
        | "hour"
        | "literal"
        | "minute"
        | "month"
        | "second"
        | "timeZoneName"
        | "weekday"
        | "year";

    interface DateTimeFormatPart {
        type: DateTimeFormatPartTypes;
        value: string;
    }

    interface DateTimeFormat {
        formatToParts(date?: Date | number): DateTimeFormatPart[];
    }
}

// From https://github.com/Microsoft/TypeScript/issues/29129
declare namespace Intl {
    type RelativeTimeFormatUnit =
        | "year"
        | "years"
        | "quarter"
        | "quarters"
        | "month"
        | "months"
        | "week"
        | "weeks"
        | "day"
        | "days"
        | "hour"
        | "hours"
        | "minute"
        | "minutes"
        | "second"
        | "seconds";

    type RelativeTimeFormatNumeric = "always" | "auto";

    type RelativeTimeFormatStyle = "long" | "short" | "narrow";

    type BCP47LanguageTag = string;

    interface RelativeTimeFormatOptions {
        localeMatcher?: "lookup" | "best fit";
        numeric?: RelativeTimeFormatNumeric;
        style?: RelativeTimeFormatStyle;
    }

    class RelativeTimeFormat {
        constructor(locale: string, options?: RelativeTimeFormatOptions);

        static supportedLocalesOf(locales: string[]): string[];

        format(value: number, unit: RelativeTimeFormatUnit): string;

        formatToParts(value: number, unit: RelativeTimeFormatUnit): string[];

        resolvedOptions(): RelativeTimeFormatOptions;
    }

}

declare namespace Intl {

    type UnicodeBCP47LocaleIdentifier = string;
}

declare namespace Intl {

    type ListType = "conjunction" | "disjunction";

    interface ListFormatOptions {
        localeMatcher?: "lookup" | "best fit";
        style?: "long" | "short" | "narrow";
        type?: ListType;
    }

    interface ListFormatPart {
        type: "element" | "literal";
        value: string;
    }

    class ListFormat {
        constructor(locales?: string | string[], options?: ListFormatOptions);

        format(values: any[]): string;

        formatToParts(values: any[]): ListFormatPart[];

        supportedLocalesOf(
            locales: string | string[],
            options?: ListFormatOptions
        ): string[];
    }

}

declare namespace Intl {
    type LocaleHourCycleKey = "h12" | "h23" | "h11" | "h24";
    type LocaleCollationCaseFirst = "upper" | "lower" | "false";

    interface LocaleOptions {
        /** A string containing the language, and the script and region if available. */
        baseName?: string;
        /** The part of the Locale that indicates the locale's calendar era. */
        calendar?: string;
        /** Flag that defines whether case is taken into account for the locale's collation rules. */
        caseFirst?: LocaleCollationCaseFirst;
        /** The collation type used for sorting */
        collation?: string;
        /** The time keeping format convention used by the locale. */
        hourCycle?: LocaleHourCycleKey;
        /** The primary language subtag associated with the locale. */
        language?: string;
        /** The numeral system used by the locale. */
        numberingSystem?: string;
        /** Flag that defines whether the locale has special collation handling for numeric characters. */
        numeric?: boolean;
        /** The region of the world (usually a country) associated with the locale. Possible values are region codes as defined by ISO 3166-1. */
        region?: string;
        /** The script used for writing the particular language used in the locale. Possible values are script codes as defined by ISO 15924. */
        script?: string;
    }

    interface Locale extends LocaleOptions {
        /** A string containing the language, and the script and region if available. */
        baseName: string;
        /** The primary language subtag associated with the locale. */
        language: string;
        /** Gets the most likely values for the language, script, and region of the locale based on existing values. */
        maximize(): Locale;
        /** Attempts to remove information about the locale that would be added by calling `Locale.maximize()`. */
        minimize(): Locale;
        /** Returns the locale's full locale identifier string. */
        toString(): BCP47LanguageTag;
    }

    /**
     * Constructor creates [Intl.Locale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale)
     * objects
     *
     * @param tag - A string with a [BCP 47 language tag](http://tools.ietf.org/html/rfc5646).
     *  For the general form and interpretation of the locales argument,
     *  see the [`Intl` page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation).
     *
     * @param options - An [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/Locale#Parameters) with some or all of the options of the locale.
     *
     * @returns [Intl.Locale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) object.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale).
     */
    const Locale: {
        new (tag: BCP47LanguageTag | Locale, options?: LocaleOptions): Locale;
    };
}

export default Intl;
