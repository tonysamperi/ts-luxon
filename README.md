# TS Luxon

[![MIT License][license-image]][license] [![Build Status][gh-actions-image]][gh-actions-url] [![NPM version][npm-version-image]][npm-url] [![Coverage Status][test-coverage-image]][test-coverage-url] ![PRs welcome][contributing-image]
[![Size](https://img.shields.io/bundlephobia/minzip/ts-luxon)](https://unpkg.com/ts-luxon@latest/dist/cjs/index.cjs)

TS Luxon is a library for working with dates and times in Javscript and Typescript.

This repo was initially created by [GillesDebunne]([initial-autor]) which of course started from [Luxon]([original-luxon]) itself.

Many thanks to both of them for this fantastic work. 

I decided to fork his work, because we don't know for sure if and when Luxon will adopt this source.

I realized moment wasn't suitable anymore for my projects, but I couldn't wait to have a more stable version and at this time Luxon (v 1.25.0) had structural issues, which resulted in errors in my Angular projects.

## New feature: preview releases
With v6 I introduced a new release tag `next`.
These versions are basically release candidates that can be tried out before they get released.
The next version tag gets cleared out automatically upon release of the latest stable version.

The beta releases instead, like it's always been, represent **unstable** releases, and they're subject to dramatic changes. 

## Upgrading to 6.x
This finally solves the coexistence of ESM and CJS.

Many thanks to the autors of [arethetypeswrong](https://arethetypeswrong.github.io/) and [publint](https://publint.dev/), which were essential tools to debug and understand the package.json.

### Very important for Typescript users
We reached a pretty much stable point for **Intl** support, which means we could finally drop that "compat" types that were needed to have a stable behaviour across various versions.
So in order to make everything work as expected you should have lib **es2021** or later in your tsconfig.
Another option could be using `skipLibCheck`, but depending on how to want to manage your compiler, you might want to keep this off (default).

```json
{
    "include": [
        "src"
    ],
    "exclude": [
        "test"
    ],
    "compilerOptions": {
        "module": "CommonJS",
        "target": "es6",
        "lib": [
            "esnext"
        ]
    }
}
```

### Dropped the UMD bundle
Seriously. It's 2025. If you're using IE11 or require-js you may as well stick with date-fns, or moment.
We drop heavy old stuff like the UMD bundle.
But if you want to have tsLuxon in a global variable like it was before, you can do something like this:

```html
<script type="module">
  import * as tsLuxon from "https://unpkg.com/ts-luxon?module";
  window.tsLuxon = tsLuxon;
</script>
```
You might even adjust this to work with require js, if you're happy! 😀
Although seriously, in that case, I suggest you to compile your own bundle with esbuild starting from the esm build. It's literally one line of code.

## Upgrading to 5.x
Compared to v4 here I only changed how the library is built and the outputs.
It should be completely transparent to the user given the adjustments to the package.json and given the fact that the es6 export of v4 is **interpreted as CJS anyways**.
I'm working on adding a real ESM module output to v5, but it seems there's no way of making the two coexist.

## Upgrading to 4.x

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

---

Thanks to [fire332](https://github.com/fire332) for his contribution about package.json

## Development

Please, read the CONTRIBUTING.md you can find in the master branch.

[initial-author]: https://github.com/GillesDebunne
[original-luxon]: https://github.com/moment/luxon
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: LICENSE

[gh-actions-url]: https://github.com/tonysamperi/ts-luxon/actions?query=workflow%3A%22Test%22
[gh-actions-image]: https://github.com/tonysamperi/ts-luxon/workflows/Test/badge.svg?branch=master

[npm-url]: https://npmjs.org/package/ts-luxon
[npm-version-image]: https://badge.fury.io/js/ts-luxon.svg

[doc-url]: https://tonysamperi.github.io/ts-luxon/
[doc-coverage-image]: https://moment.github.io/luxon/docs/_media/Luxon_icon_64x64.png

[test-coverage-url]: https://codecov.io/gh/tonysamperi/ts-luxon
[test-coverage-image]: https://codecov.io/gh/tonysamperi/ts-luxon/branch/master/graph/badge.svg

[contributing-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg


