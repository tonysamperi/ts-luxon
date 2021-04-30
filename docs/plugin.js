// This is a plugin for ESDoc that modifies the docs output to look how we want
const cheerio = require("cheerio"),
    path = require("path");

exports.onHandleContent = function(ev) {
    if (path.extname(ev.data.fileName) !== ".html") return;

    const $ = cheerio.load(ev.data.content);

    // Add TSLuxon to the page so you can play with it while browsing the docs
    $("body").append("<script src='https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js'/>");
    $("body").append(
        "<script>console.log('You can try TSLuxon right here using the `tsLuxon` global, like `tsLuxon.DateTime.now()`.')</script>"
    );

    // The little "100% documented" badge was too prominent.
    $("p.manual-badge").remove();

    // Identify that this page is about Luxon
    $("header").prepend('<a href="../index.html" class="luxon-title">TSLuxon</a>');
    $("head").append("<style>.luxon-title {font-size: 22px; color: black;}</style>");

    // Naming things better
    $('header > a:contains("Home")').text("Manual");

    // Read the source on Github, yo
    $('header > a:contains("Source")').remove();

    // Grammar snobbery
    $('h1:contains("References")').text("Reference");

    ev.data.content = $.html();
};
