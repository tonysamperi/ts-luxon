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
        'ts-luxon.umd': './src/index.ts'
    },
    output: {
        path: resolve('dist', "umd"),
        filename: '[name].js',
        library: {
            type: "umd",
            name: "tsLuxon"
        },
        umdNamedDefine: true
    }
};  