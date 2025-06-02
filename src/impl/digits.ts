import { NumberingSystem } from "../types/locale.js";
import { Locale } from "./locale.js";

const numberingSystems: { [key in NumberingSystem]: string } = {
    arab: "[\u0660-\u0669]",
    arabext: "[\u06F0-\u06F9]",
    bali: "[\u1B50-\u1B59]",
    beng: "[\u09E6-\u09EF]",
    deva: "[\u0966-\u096F]",
    fullwide: "[\uFF10-\uFF19]",
    gujr: "[\u0AE6-\u0AEF]",
    hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
    khmr: "[\u17E0-\u17E9]",
    knda: "[\u0CE6-\u0CEF]",
    laoo: "[\u0ED0-\u0ED9]",
    limb: "[\u1946-\u194F]",
    mlym: "[\u0D66-\u0D6F]",
    mong: "[\u1810-\u1819]",
    mymr: "[\u1040-\u1049]",
    orya: "[\u0B66-\u0B6F]",
    tamldec: "[\u0BE6-\u0BEF]",
    telu: "[\u0C66-\u0C6F]",
    thai: "[\u0E50-\u0E59]",
    tibt: "[\u0F20-\u0F29]",
    latn: "\\d"
};

type NumberingSystemUTF16 = Exclude<NumberingSystem, "hanidec" | "latn">;

// Why "latn" and "hanidec" are missing in Luxon??
const numberingSystemsUTF16: { [key in NumberingSystemUTF16]: [number, number] } = {
    arab: [1632, 1641],
    arabext: [1776, 1785],
    bali: [6992, 7001],
    beng: [2534, 2543],
    deva: [2406, 2415],
    fullwide: [65296, 65303],
    gujr: [2790, 2799],
    khmr: [6112, 6121],
    knda: [3302, 3311],
    laoo: [3792, 3801],
    limb: [6470, 6479],
    mlym: [3430, 3439],
    mong: [6160, 6169],
    mymr: [4160, 4169],
    orya: [2918, 2927],
    tamldec: [3046, 3055],
    telu: [3174, 3183],
    thai: [3664, 3673],
    tibt: [3872, 3881]
};

// eslint-disable-next-line no-useless-escape
const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");

export function parseDigits(str: string) {
    const intValue = parseInt(str, 10);
    if (!isNaN(intValue)) {
        return intValue;
    }

    let digits = "";
    for (let i = 0;
         i < str.length;
         i++) {
        const code = str.charCodeAt(i);
        if (str[i].search(numberingSystems.hanidec) !== -1) {
            digits += hanidecChars.indexOf(str[i]);
        }
        else {
            for (const key in
                numberingSystemsUTF16) {
                const [min, max] = numberingSystemsUTF16[key as NumberingSystemUTF16];
                if (code >= min && code <= max) {
                    digits += code - min;
                    break;
                }
            }
        }
    }
    return parseInt(digits, 10);
}

// cache of {numberingSystem: {append: regex}}
const digitRegexCache: Map<Partial<NumberingSystem>, Map<string, RegExp>> = new Map();

export function resetDigitRegexCache(): void {
    digitRegexCache.clear();
}

export function digitRegex({ numberingSystem }: Locale, append: string = ""): RegExp {
    const ns = numberingSystem || "latn" as NumberingSystem;
    if (!digitRegexCache.has(ns)) {
        digitRegexCache.set(ns, new Map());
    }
    const appendCache = digitRegexCache.get(ns);
    if (!appendCache.has(append)) {
        appendCache.set(append, new RegExp(`${numberingSystems[ns]}${append}`));
    }

    return appendCache.get(append);
}
