import * as tsLuxon from "../dist/ts-luxon.js";
import pkg from "../package.json" assert { type: "json" };

(() => {
    if (pkg.version !== tsLuxon.VERSION) {
        throw new Error(`Version mismatch! Expected ${pkg.version}, got ${tsLuxon.VERSION}. Rebuild the package to solve!`);
    }
})();