const { version } = require("./package.json");

// from "(.*?)(?<!\.js)";

module.exports = {
    mode: "development",
    optimization: {
        minimize: false
    },
    devtool: 'source-map',
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"],
        // Add support for TypeScripts fully qualified ESM imports.
        extensionAlias: {
            ".js": [".js", ".ts"],
            ".mjs": [".mjs", ".mts"]
        }
    },
    module: {
        rules: [
            {
                test: /\.m?[jt]s$/,
                loader: 'string-replace-loader',
                options: {
                    search: "__BUILD_VRS__",
                    replace: version,
                }
            },
        ]
    }
};  