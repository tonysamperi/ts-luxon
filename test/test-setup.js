const { toBe: originalToBe } = require("expect/build/matchers").default;

expect.extend({
    // Usage: expect(received).toBe(expected, true) for standard Jest comparisons.
    toBe(received, expected, useStrictSpaceComparisons = false) {
        if (!useStrictSpaceComparisons) {
            if (typeof received === "string") {
                received = received.replace(/\s/g, " ");
            }
            if (typeof expected === "string") {
                expected = expected.replace(/\s/g, " ");
            }
        }

        return originalToBe.call(this, received, expected);
    }
});
