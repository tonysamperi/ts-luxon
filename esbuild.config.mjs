import {build} from "esbuild";
import {execSync} from "child_process";

async function bundle() {
    await build({
        entryPoints: ["src/**/*.ts"], // 📂 all sources
        outdir: "dist/esm",
        format: "esm",
        bundle: false, // 🚫 No bundling
        minify: false,
        sourcemap: true,
        target: "esnext",
        tsconfig: "./tsconfig.esm.json",
        outExtension: { ".js": ".mjs" }
    });

    await build({
        entryPoints: ["src/**/*.ts"],
        outdir: "dist/cjs",
        format: "cjs",
        bundle: true,
        minify: false,
        sourcemap: true,
        target: "esnext",
        tsconfig: "./tsconfig.cjs.json",
        outExtension: { ".js": ".cjs" }
    });

    console.info("✅ Typescript compiled! Now generating declaration files...");

    execSync("tsc --emitDeclarationOnly --project tsconfig.esm.json", {stdio: "inherit"});

    console.info("✅ Build success!");
}

bundle()
    .catch((err) => {
        console.error("❌ Build failure:", err);
        process.exit(1);
    });
