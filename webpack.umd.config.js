const { resolve } = require("path");
const webpackCommon = require("./webpack.common");

webpackCommon.module.rules.push({
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/,
});

module.exports = {
    ...webpackCommon,
    entry: {
        'ts-luxon': './src/index.ts'
    },
    output: {
        path: resolve('dist/umd'),
        globalObject: "this",
        filename: '[name].js',
        library: {
            type: "umd",
            name: "tsLuxon"
        },
        umdNamedDefine: true
    }
};