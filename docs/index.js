// This file exports a config object to be passed to ESDoc, including what files to add to the manual and what
// options to set when processing the docstrings and computing documentation coverage.

// This is the table of contents, which exists just to create an ordering.
// If you"re adding a doc, all you have to do is add it here.
const manualFiles = [
    "install",
    "tour",
    "intl",
    "zones",
    "calendars",
    "formatting",
    "parsing",
    "math",
    "validity",
    "matrix",
    "moment",
    "why"
].map(d => `./docs/${d}.md`);

const excludeIrrelevant = ["lib/index\\.js", "lib/luxonFilled\\.js", "lib/impl/.*\\.js"];

module.exports = {
    source: "./build/lib",
    destination: "./build/docs",
    excludes: excludeIrrelevant,
    plugins: [
        {
            name: "esdoc-standard-plugin",
            option: {
                accessor: {
                    access: ["public"]
                },
                brand: {
                    title: "TSLuxon"
                },
                manual: {
                    globalIndex: true,
                    index: "./docs/index.md",
                    files: manualFiles.concat(["./CHANGELOG.md", "./contributing.md"])
                }
            }
        },
        // don't consider random unexported functions to be undocumented
        {
            name: "esdoc-coverage-plugin",
            option: {
                kind: ["class", "method", "member", "get", "set"]
            }
        },
        // customizations to the ESDoc output
        { name: "./docs/plugin.js" }
    ]
};
