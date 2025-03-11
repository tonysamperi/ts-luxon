import {execSync} from "child_process";
import {build} from "esbuild";
import pkg from "./package.json" with {type: "json"};
import {replace} from "esbuild-plugin-replace";
import fs from "fs/promises";

const commonPlugins = [
    replace({
        "__BUILD_VRS__": `${pkg.version}`
    })
];

async function doBuild() {
    execSync("tsc -p tsconfig.esm.json", {stdio: "inherit"});
    // Duplicate the types index, to have all the typings recognized correctly
    await fs.copyFile("dist/types/index.d.ts", "dist/types/index.d.cts");
    // execSync("tsc --project tsconfig.cjs.json", {stdio: "inherit"});

    await build({
        entryPoints: ["dist/raw-esm/**/*.js"],
        outdir: "dist/esm",
        format: "esm",
        bundle: false,
        minify: false,
        // outExtension: {".js": ".mjs"},
        plugins: [
            ...commonPlugins
        ]
    });

    await build({
        entryPoints: ["dist/raw-esm/index.js"],
        outfile: "dist/cjs/index.cjs",
        format: "cjs",
        bundle: true,
        minify: true,
        plugins: [
            ...commonPlugins
        ]
    });

    await build({
        entryPoints: ["dist/raw-esm/index.js"],
        bundle: true,
        platform: "node",
        target: ["node12"],
        outfile: "dist/node/index.cjs",
        plugins: [
            ...commonPlugins
        ]
    });
}

try {
    doBuild();
}
catch (e) {
    console.error("Error");
}