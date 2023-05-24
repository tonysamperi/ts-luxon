(() => {
    const tsLuxon = require("../dist/ts-luxon.umd");
    const pkg = require("../package.json");
    if(pkg.version !== tsLuxon.VERSION) {
        throw new Error(`Version mismatch! Expected ${pkg.version}, got ${tsLuxon.VERSION}. Rebuild the package to solve!`);
    }
})();