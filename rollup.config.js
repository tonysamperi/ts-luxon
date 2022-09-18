import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import cleaner from "rollup-plugin-cleaner";
import { uglify } from "rollup-plugin-uglify";
import { terser } from "rollup-plugin-terser";

const pkg = require("./package.json");

export default {
    input: "src/index.ts",
    output: [
        { file: pkg.main, name: "tsLuxon", format: "umd", sourcemap: true },
        { file: pkg.main.replace(".js", ".min.js"), name: "tsLuxon", format: "umd", sourcemap: "inline", plugins: [uglify()] },
        { file: pkg.module, format: "es", sourcemap: true },
        { file: pkg.module.replace(".js", ".min.js"), format: "es", sourcemap: "inline", plugins: [uglify()] }
    ],
    external: [],
    watch: {
        include: "src/**"
    },
    plugins: [
        cleaner({
            targets: [
                "./dist/"
            ]
        }),
        // Compile TypeScript files
        typescript({ tsconfig: "tsconfig.json" }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // Enable Terser
        terser(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve(),
        // Resolve source maps to the original source
        sourceMaps()
    ]
};
