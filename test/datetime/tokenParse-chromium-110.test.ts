import { DateTime } from "../../src";
// import { Helpers } from "../helpers";

// ------
// .fromFormat
// -------
test("DateTime.fromFormat() parses with NNBSP", () => {
    const dto = DateTime.fromFormat("3:22 AM", "h:m a", {
        numberingSystem: "latn",
        locale: "en-US"
    });

    expect(dto.isValid).toBe(true);
    expect(dto.invalidReason).toBe(void 0);
});

test("DateTime.fromFormat() parses with NNBSP", () => {
    const dto = DateTime.fromFormat("3:22 AM", "h:m a", {
        numberingSystem: "latn",
        locale: "en-US"
    });

    expect(dto.isValid).toBe(true);
    expect(dto.invalidReason).toBe(void 0);
});