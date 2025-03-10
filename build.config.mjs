import {execSync} from "child_process";
import {build} from "esbuild";
import pkg from "./package.json" with {type: "json"};
import {replace} from "esbuild-plugin-replace";


async function doBuild() {
    execSync("tsc -p tsconfig.esm.json", {stdio: "inherit"});
    // execSync("tsc --project tsconfig.cjs.json", {stdio: "inherit"});

    await build({
        entryPoints: ["dist/index.js"],
        outfile: "dist/index.js",
        format: "esm",
        bundle: false,
        minify: false,
        keepNames: true,
        allowOverwrite: !0,
        plugins: [
            replace({
                "__BUILD_VRS__": `${pkg.version}`,
                "__author__": `'tonysamperi'`
            })
        ]
    });

    await build({
        entryPoints: ["dist/index.js"],
        outfile: "dist/cjs/index.cjs",
        format: "cjs",
        bundle: true,
        minify: true
    });

    await build({
        entryPoints: ["dist/index.js"],
        bundle: true,
        platform: "node",
        target: ["node12"],
        outfile: "dist/node/index.cjs"
    });
}

try {
    doBuild();
}
catch (e) {
    console.error("Error");
}