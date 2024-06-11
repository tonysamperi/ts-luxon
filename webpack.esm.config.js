const { resolve } = require("path");
const webpackCommon = require("./webpack.common");

webpackCommon.module.rules.push({
    test: /\.tsx?$/,
    use: {
        loader: 'ts-loader',
        options: {
            configFile: "tsconfig.esm.json"
        }
    },
    exclude: /node_modules/
});

module.exports = {
    ...webpackCommon,
    entry: {
        'ts-luxon.esm': './src/index.ts'
    },
    experiments: {
        outputModule: true,
    },
    output: {
        path: resolve('dist'),
        globalObject: "this",
        filename: '[name].mjs',
        library: {
            type: "module"
        }
    }
};