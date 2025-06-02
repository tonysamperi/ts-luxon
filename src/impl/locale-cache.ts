import ListFormat = Intl.ListFormat;

function extractDifferentPartValue(longParts: Intl.RelativeTimeFormatPart[],
                                   shortParts: Intl.RelativeTimeFormatPart[],
                                   fallback?: string) {
    const filteredLongParts = longParts.filter(p => p.type !== "integer");
    const filteredShortParts = shortParts.filter(p => p.type !== "integer");
    for (let i = 0;
         i < Math.min(filteredLongParts.length, filteredShortParts.length);
         i++) {
        const longPart = filteredLongParts[i];
        const shortPart = filteredShortParts[i];
        if (longPart.value !== shortPart.value) {
            return longPart.value.trim();
        }
    }

    return fallback; // fallback
}

/**
 * @private
 */
export class LocaleCache {

    protected static _intlDTCache: Map<string, Intl.DateTimeFormat> = new Map();
    protected static _intlLFCache: Map<string, Intl.ListFormat> = new Map();
    protected static _intlNumCache: Map<string, Intl.NumberFormat> = new Map();
    protected static _intlRelCache: Map<string, Intl.RelativeTimeFormat> = new Map();
    protected static _intlResolvedOptionsCache: Map<string, any> = new Map();
    protected static _sysLocaleCache: string | void;

    static getCachedDTF(locString: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
        const key = JSON.stringify([locString, options]);
        if (!this._intlDTCache.has(key)) {
            this._intlDTCache.set(key, new Intl.DateTimeFormat(locString, options));
        }

        return this._intlDTCache.get(key);
    }

    static getCachedINF(locString: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
        const key = JSON.stringify([locString, options]);
        if (!this._intlNumCache.has(key)) {
            let formatter: Intl.NumberFormat;

            if (options.unit === "quarter") {
                const relativeLongTimeFormatter = new Intl.RelativeTimeFormat(locString, {
                    numeric: "always",
                    style: "long"
                });
                const relativeShortTimeFormatter = new Intl.RelativeTimeFormat(locString, {
                    numeric: "always",
                    style: "short"
                });
                const singularLongParts = relativeLongTimeFormatter.formatToParts(1, "quarter");
                const singularShortParts = relativeShortTimeFormatter.formatToParts(1, "quarter");
                const singularUnit = extractDifferentPartValue(singularLongParts, singularShortParts, "quarter");
                const pluralLongParts = relativeLongTimeFormatter.formatToParts(2, "quarter");
                const pluralShortParts = relativeShortTimeFormatter.formatToParts(2, "quarter");
                const pluralUnit = extractDifferentPartValue(pluralLongParts, pluralShortParts, "quarters");

                const numberFormatter = new Intl.NumberFormat(locString, {
                    style: "decimal",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });

                formatter = {
                    format: (value: number) => {
                        const unit = Math.abs(value) === 1 ? singularUnit : pluralUnit;
                        return `${numberFormatter.format(value)} ${unit}`;
                    },
                    formatToParts: (value: number) => {
                        const unit = Math.abs(value) === 1 ? singularUnit : pluralUnit;
                        return [{
                            type: "literal",
                            value: `${numberFormatter.format(value)} ${unit}`
                        }];
                    },
                    resolvedOptions: () => ({
                        locale: locString,
                        numberingSystem: "latn",
                        style: "unit",
                        unit: "quarter",
                        unitDisplay: "long",
                        minimumIntegerDigits: 1,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                        currencyDisplay: "symbol",
                        currencySign: "standard",
                        useGrouping: true,
                        compactDisplay: "short",
                        notation: "standard",
                        signDisplay: "auto"
                    })
                } as Intl.NumberFormat;
            }
            else {
                formatter = new Intl.NumberFormat(locString, options);
            }

            this._intlNumCache.set(key, formatter);
        }

        return this._intlNumCache.get(key);
    }

    static getCachedIntResolvedOptions(locString: string): Intl.ResolvedDateTimeFormatOptions {
        if (!this._intlResolvedOptionsCache.has(locString)) {
            this._intlResolvedOptionsCache.set(locString, new Intl.DateTimeFormat(locString).resolvedOptions());
        }

        return this._intlResolvedOptionsCache.get(locString);
    }

    static getCachedLF(locString: string, opts: Intl.ListFormatOptions = {}): ListFormat {
        const key = JSON.stringify([locString, opts]);
        if (!this._intlLFCache.has(key)) {
            this._intlLFCache.set(key, new Intl.ListFormat(locString, opts));
        }

        return this._intlLFCache.get(key);
    }

    static getCachedRTF(locale: Intl.UnicodeBCP47LocaleIdentifier, options: Intl.RelativeTimeFormatOptions = {}): Intl.RelativeTimeFormat {
        const key = JSON.stringify([locale, options]);
        if (!this._intlRelCache.has(key)) {
            this._intlRelCache.set(key, new Intl.RelativeTimeFormat(locale, options));
        }

        return this._intlRelCache.get(key);
    }

    static reset(): void {
        this._sysLocaleCache = void 0;
        this._intlLFCache.clear();
        this._intlDTCache.clear();
        this._intlNumCache.clear();
        this._intlRelCache.clear();
        this._intlResolvedOptionsCache.clear();
    }

    static systemLocale(): string {
        if (!this._sysLocaleCache) {
            this._sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
        }

        return this._sysLocaleCache;
    }
}