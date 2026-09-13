describe("toBe space comparisons", () => {
    test("normalizes whitespace in both strings by default", () => {
        expect("a\u00a0b\u202fc").toBe("a b c");
        expect("a b c").toBe("a\u00a0b\u202fc", false);
        expect("a\tb\nc").toBe("a b c");
        expect("a  b").not.toBe("a b");
        expect(() => expect("a\u00a0b").not.toBe("a b")).toThrow();
    });

    test("preserves exact whitespace when strict comparisons are enabled", () => {
        expect("a\u00a0b").not.toBe("a b", true);
        expect("a\u00a0b").toBe("a\u00a0b", true);
        expect(() => expect("a\u00a0b").toBe("a b", true)).toThrow();
    });

    test.each([false, true])("preserves Object.is semantics (strict: %s)", (strict) => {
        const value = {};
        expect(value).toBe(value, strict);
        expect(value).not.toBe({}, strict);
        expect(NaN).toBe(NaN, strict);
        expect(0).not.toBe(-0, strict);
        expect(null).toBe(null, strict);
        expect(undefined).toBe(undefined, strict);
        expect(true).toBe(true, strict);
        expect(1).not.toBe("1", strict);
    });

    test("supports promise matchers", async () => {
        await expect(Promise.resolve("a\u00a0b")).resolves.toBe("a b");
        await expect(Promise.reject("a\u00a0b")).rejects.not.toBe("a b", true);
    });
});
