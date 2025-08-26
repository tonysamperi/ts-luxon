import { FixedOffsetZone, IANAZone } from "../../src";

test("IANAZone.create returns a singleton per zone name", () => {
    expect(IANAZone.create("UTC")).toBe(IANAZone.create("UTC"));
    expect(IANAZone.create("America/New_York")).toBe(IANAZone.create("America/New_York"));

    expect(IANAZone.create("UTC")).not.toBe(IANAZone.create("America/New_York"));

    // hold true even for invalid zone names
    expect(IANAZone.create("blorp")).toBe(IANAZone.create("blorp"));
});

test("IANAZone.create should return IANAZone instance", () => {
    const result = IANAZone.create("America/Cancun");
    expect(result).toBeInstanceOf(IANAZone);
});

test("IANAZone.isValidSpecifier", () => {
    expect(IANAZone.isValidSpecifier("America/New_York")).toBe(true);
    // this used to return true but now returns false, because we just defer to isValidZone
    expect(IANAZone.isValidSpecifier("Fantasia/Castle")).toBe(false);
    expect(IANAZone.isValidSpecifier("Sport~~blorp")).toBe(false);
    expect(IANAZone.isValidSpecifier("Etc/GMT+8")).toBe(true);
    expect(IANAZone.isValidSpecifier("Etc/GMT-8")).toBe(true);
    expect(IANAZone.isValidSpecifier("Etc/GMT-0")).toBe(true);
    expect(IANAZone.isValidSpecifier("Etc/GMT-1")).toBe(true);
    // @ts-ignore
    expect(IANAZone.isValidSpecifier(null)).toBe(false);
});

test("IANAZone.isValidZone", () => {
    expect(IANAZone.isValidZone("America/New_York")).toBe(true);
    expect(IANAZone.isValidZone("Fantasia/Castle")).toBe(false);
    expect(IANAZone.isValidZone("Sport~~blorp")).toBe(false);
    expect(IANAZone.isValidZone("")).toBe(false);
});

test("IANAZone.type returns a static string", () => {
    expect(IANAZone.create("America/Santiago").type).toBe("iana");
    expect(IANAZone.create("America/Blorp").type).toBe("iana");
});

test("IANAZone.name returns the zone name passed to the constructor", () => {
    expect(IANAZone.create("America/Santiago").name).toBe("America/Santiago");
    expect(IANAZone.create("America/Blorp").name).toBe("America/Blorp");
    expect(IANAZone.create("foo").name).toBe("foo");
});

test("IANAZone is not universal", () => {
    expect(IANAZone.create("America/Santiago").isUniversal).toBe(false);
});

test("IANAZone.offsetName with a long format", () => {
    const zone = IANAZone.create("America/Santiago");
    const offsetName = zone.offsetName(1552089600, { format: "long", locale: "en-US" });
    expect(offsetName).toBe("Chile Summer Time");
});

test("IANAZone.offsetName with a short format", () => {
    const zone = IANAZone.create("America/Santiago");
    const offsetName = zone.offsetName(1552089600, { format: "short", locale: "en-US" });
    expect(offsetName).toBe("GMT-3");
});

test("IANAZone.formatOffset with a short format", () => {
    const zone = IANAZone.create("America/Santiago");
    const offsetName = zone.formatOffset(1552089600, "short");
    expect(offsetName).toBe("-03:00");
});

test("IANAZone.formatOffset with a narrow format", () => {
    const zone = IANAZone.create("America/Santiago");
    const offsetName = zone.formatOffset(1552089600, "narrow");
    expect(offsetName).toBe("-3");
});

test("IANAZone.formatOffset with a techie format", () => {
    const zone = IANAZone.create("America/Santiago");
    const offsetName = zone.formatOffset(1552089600, "techie");
    expect(offsetName).toBe("-0300");
});

test("IANAZone.formatOffset throws for an invalid format", () => {
    const zone = IANAZone.create("America/Santiago");
    // @ts-expect-error
    expect(() => zone.formatOffset(1552089600, "blorp")).toThrow();
});

test("IANAZone.equals requires both zones to be iana", () => {
    expect(IANAZone.create("UTC").equals(FixedOffsetZone.utcInstance)).toBe(false);
});

test("IANAZone.equals returns false even if the two share offsets", () => {
    const luxembourg = IANAZone.create("Europe/Luxembourg");
    const rome = IANAZone.create("Europe/Rome");
    expect(luxembourg.equals(rome)).toBe(false);
});

test("IANAZone.isValid returns true for valid zone names", () => {
    expect(IANAZone.create("UTC").isValid).toBe(true);
    expect(IANAZone.create("America/Santiago").isValid).toBe(true);
    expect(IANAZone.create("Europe/Paris").isValid).toBe(true);
});

test("IANAZone.isValid returns false for invalid zone names", () => {
    expect(IANAZone.create("").isValid).toBe(false);
    expect(IANAZone.create("foo").isValid).toBe(false);
    expect(IANAZone.create("CEDT").isValid).toBe(false);
    expect(IANAZone.create("GMT+2").isValid).toBe(false);
    expect(IANAZone.create("America/Blorp").isValid).toBe(false);
    // @ts-ignore
    expect(IANAZone.create(null).isValid).toBe(false);
});

test("IANAZone.normalize normalizes the zone name", () => {
    expect(IANAZone.normalizeZone("america/nEw_york")).toBe("America/New_York");
    expect(IANAZone.normalizeZone("AMERICA/NEW_YORK")).toBe("America/New_York");
    expect(IANAZone.normalizeZone("America/New_York")).toBe("America/New_York");
    expect(IANAZone.normalizeZone("europe/paris")).toBe("Europe/Paris");
    expect(IANAZone.normalizeZone("EUROPE/PARIS")).toBe("Europe/Paris");
    expect(IANAZone.normalizeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
    expect(IANAZone.normalizeZone("Etc/GMT")).toBe("UTC");
});

test("IANAZone returns canonical zone name regardless of input casing", () => {
    expect(IANAZone.create("america/nEw_york").name).toBe("America/New_York");
    expect(IANAZone.create("AMERICA/NEW_YORK").name).toBe("America/New_York");
    expect(IANAZone.create("America/New_York").name).toBe("America/New_York");
    expect(IANAZone.create("europe/paris").name).toBe("Europe/Paris");
    expect(IANAZone.create("EUROPE/PARIS").name).toBe("Europe/Paris");
    expect(IANAZone.create("Asia/Tokyo").name).toBe("Asia/Tokyo");
});
