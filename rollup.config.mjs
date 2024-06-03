import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import pluginReplace from "@rollup/plugin-replace";

import pkg from "./package.json" assert { type: "json" };

export default {
    input: "src/index.ts",
    output: [
        { file: pkg.main, name: "tsLuxon", format: "umd", sourcemap: true },
        { file: pkg.main.replace(".js", ".min.js"), name: "tsLuxon", format: "umd", sourcemap: "inline", plugins: [terser()] },
        { file: pkg.module, format: "es", sourcemap: true },
        { file: pkg.module.replace(".mjs", ".min.mjs"), format: "es", sourcemap: "inline", plugins: [terser()] }
    ],
    external: [],
    watch: {
        include: "src/**"
    },
    plugins: [
        // Compile TypeScript files
        typescript({
            // tsconfig: "tsconfig.json"
        }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve(),
        pluginReplace({
            preventAssignment: !0,
            values: {
                __BUILD_VRS__: () => pkg.version
            }
        })
    ]
};
