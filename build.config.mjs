import {execSync} from "child_process";
import {build} from "esbuild";
import {replaceInFile} from "replace-in-file";
import fs from "fs/promises";
//
import pkg from "./package.json" with {type: "json"};

async function doBuild() {
    const {version} = pkg;
    const isProd = process.env.NODE_ENV === "production";

    execSync("tsc -p tsconfig.esm.json", {stdio: "inherit"});

    await replaceInFile({
        files: "dist/**/*",
        from: [/__BUILD_VRS__/g],
        to: [version]
    });
    // Duplicate the types index, to have all the typings recognized correctly
    await fs.copyFile("dist/types/index.d.ts", "dist/types/index.d.cts");

    await build({
        entryPoints: ["dist/raw-esm/**/*.js"],
        outdir: "dist/esm",
        format: "esm",
        bundle: !1,
        minify: !1 // never minify as it's only a source to work on
    });

    await build({
        entryPoints: ["dist/raw-esm/index.js"],
        outfile: "dist/cjs/index.cjs",
        format: "cjs",
        bundle: !0,
        minify: isProd
    });

}

try {
    doBuild();
}
catch (e) {
    console.error("Error");
}