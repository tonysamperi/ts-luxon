# TS Luxon

[![MIT License][license-image]][license] [![Build Status][gh-actions-image]][gh-actions-url] [![NPM version][npm-version-image]][npm-url] [![Coverage Status][test-coverage-image]][test-coverage-url] ![PRs welcome][contributing-image]
[![Size](https://img.shields.io/bundlephobia/minzip/ts-luxon)](https://unpkg.com/ts-luxon@latest/bundles/ts-luxon.umd.min.js)

TS Luxon is a library for working with dates and times in Javscript and Typescript.

This repo was initially created by [GillesDebunne]([initial-autor]) which of course started from [Luxon]([original-luxon]) itself.

Many thanks to both of them for this fantastic work. 

I decided to fork his work, because we don't know for sure if and when Luxon will adopt this source.

I realized moment wasn't suitable anymore for my projects, but I couldn't wait to have a more stable version and at this time Luxon (v 1.25.0) had structural issues, which resulted in errors in my Angular projects.

## Upgrading to 3.x

See the [docs page](https://tonysamperi.github.io/ts-luxon/docs)

```js
DateTime.now().setZone('America/New_York').minus({ weeks: 1 }).endOf('day').toISO();
```

## Features
 * DateTime, Duration, and Interval types.
 * Immutable, chainable, unambiguous API.
 * Parsing and formatting for common and custom formats.
 * Native time zone and Intl support (no locale or tz files).

## Usage

### Via npm

`npm i ts-luxon --save`

then

```typescript
import {DateTime} from "ts-luxon";

const myDto = DateTime.local();
```

### Bundle / UMD

You can download the umd bundle from here:

* [ts-luxon.umd.js](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js)

# DOCS

See the [docs page](https://tonysamperi.github.io/ts-luxon/docs)

and the [demo page](https://tonysamperi.github.io/ts-luxon)

more example will be added! For suggestions open an issue or a PR (yes, even on the demo site if you want)!

## Special thanks

Jetbrains is now supporting this library with an open-source license, which will allow a better code! 🎉

![jetbrains-logo](https://user-images.githubusercontent.com/5957244/150580991-863d6fba-1090-4924-b26c-be19c6310f24.svg)

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


