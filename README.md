# TS Luxon

[![MIT License][license-image]][license] [![Build Status][gh-actions-image]][gh-actions-url] [![NPM version][npm-version-image]][npm-url] [![Coverage Status][test-coverage-image]][test-coverage-url] ![PRs welcome][contributing-image]

TS Luxon is a library for working with dates and times in Javscript and Typescript.

This repo was initially created by [GillesDebunne]([initial-autor]) which of course started from [Luxon]([original-luxon]) itself.

Many thanks to both of them for this fantastic work. 

I decided to fork his work, because we don't know for sure if and when Luxon will adopt this source.

I realized moment wasn't suitable anymore for my projects, but I couldn't wait to have a more stable version and at this time Luxon (v 1.25.0) had structural issues, which resulted in errors in my Angular projects.


```js
DateTime.now().setZone('America/New_York').minus({ weeks: 1 }).endOf('day').toISO();
```

## Features
 * DateTime, Duration, and Interval types.
 * Immutable, chainable, unambiguous API.
 * Parsing and formatting for common and custom formats.
 * Native time zone and Intl support (no locale or tz files).

## Download

You can download the umd bundles from here:

* [ts-luxon.umd.js](https://tonysamperi.github.io/ts-luxon/lib/ts-luxon.umd.js)
* [ts-luxon.umd.min.js](https://tonysamperi.github.io/ts-luxon/lib/ts-luxon.min.umd.js)

# DOCS

(COMING SOON)

## Development

Pleas, read the CONTRIBUTING.md you can find in the master branch.

[initial-author]: https://github.com/GillesDebunne
[original-luxon]: https://github.com/moment/luxon
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license]: license.md

[gh-actions-url]: https://github.com/tonysamperi/ts-luxon/actions?query=workflow%3A%22Docker+tests%22
[gh-actions-image]: https://github.com/tonysamperi/ts-luxon/workflows/Docker%20tests/badge.svg?branch=master

[npm-url]: https://npmjs.org/package/ts-luxon
[npm-version-image]: https://badge.fury.io/js/ts-luxon.svg

[doc-url]: https://tonysamperi.github.io/ts-luxon/
[doc-coverage-image]: https://moment.github.io/luxon/docs/badge.svg

[test-coverage-url]: https://codecov.io/gh/tonysamperi/ts-luxon
[test-coverage-image]: https://codecov.io/gh/tonysamperi/ts-luxon/branch/master/graph/badge.svg

[contributing-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
