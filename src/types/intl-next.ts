// We keep this file to integrate modifications which aren't in ts lib intl yey

// This file can be removed once es2020.intl is part of TS
// and can be added in the 'lib' section of tsconfig.json

declare namespace Intl {
    interface CollatorOptions {
        usage?: string;
        localeMatcher?: string;
        numeric?: boolean;
        caseFirst?: string;
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

    // tslint:disable-next-line:naming-convention
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
        type?: ListType;
        style?: "long" | "short" | "narrow";
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

export default Intl;