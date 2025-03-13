import ListFormat = Intl.ListFormat;

/**
 * @private
 */
export class LocaleCache {

    protected static _intlDTCache: Record<string, Intl.DateTimeFormat> = {};
    protected static _intlLFCache: Record<string, Intl.ListFormat> = {};
    protected static _intlNumCache: Record<string, Intl.NumberFormat> = {};
    protected static _intlRelCache: Record<string, Intl.RelativeTimeFormat> = {};
    protected static _intlResolvedOptionsCache: Record<string, any> = {};
    protected static _sysLocaleCache: string | void;

    static getCachedDTF(locString: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
        const key = JSON.stringify([locString, options]);
        let dtf = this._intlDTCache[key];
        if (!dtf) {
            dtf = new Intl.DateTimeFormat(locString, options);
            this._intlDTCache[key] = dtf;
        }
        return dtf;
    }

    static getCachedINF(locString: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
        const key = JSON.stringify([locString, options]);
        let inf = this._intlNumCache[key];
        if (!inf) {
            inf = new Intl.NumberFormat(locString, options);
            this._intlNumCache[key] = inf;
        }
        return inf;
    }

    static getCachedIntResolvedOptions(locString: string): Intl.ResolvedDateTimeFormatOptions {
        if (!this._intlResolvedOptionsCache[locString]) {
            this._intlResolvedOptionsCache[locString] = new Intl.DateTimeFormat(locString).resolvedOptions();
        }
        return this._intlResolvedOptionsCache[locString];
    }

    static getCachedLF(locString: string, opts: Intl.ListFormatOptions = {}): ListFormat {
        const key = JSON.stringify([locString, opts]);
        let dtf = this._intlLFCache[key];
        if (!dtf) {
            dtf = new Intl.ListFormat(locString, opts);
            this._intlLFCache[key] = dtf;
        }
        return dtf;
    }

    static getCachedRTF(locale: Intl.UnicodeBCP47LocaleIdentifier, options: Intl.RelativeTimeFormatOptions = {}): Intl.RelativeTimeFormat {
        const key = JSON.stringify([locale, options]);
        let inf = this._intlRelCache[key];
        if (!inf) {
            inf = new Intl.RelativeTimeFormat(locale, options);
            this._intlRelCache[key] = inf;
        }
        return inf;
    }

    static reset(): void {
        this._sysLocaleCache = void 0;
        this._intlLFCache = {};
        this._intlDTCache = {};
        this._intlNumCache = {};
        this._intlRelCache = {};
        this._intlResolvedOptionsCache = {};
    }

    static systemLocale(): string {
        if (!this._sysLocaleCache) {
            this._sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
        }

        return this._sysLocaleCache;
    }
}
