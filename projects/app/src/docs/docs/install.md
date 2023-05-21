# Install guide

TSLuxon provides only one umd build, because the best use scenario of TSLuxon is inside a TypeScript project, where the user will decide which platforms to support with the build. 
In any case, see [the support matrix](matrix.md) for additional details.

## Basic browser setup

If you want to play in the browser, you can download a JS version of TSLuxon here.
Of course if you're thinking about using this library in a JS project it's perfectly possible.

> Note that the minified version exists only since v 3.0.1

- [Download full](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js)
- [Download minified](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.min.js)

You can also load the files from a [CDN](https://www.jsdelivr.com/package/npm/luxon).

Just include TSLuxon in a script tag. You can access its various classes through the `tsLuxon` global.

```html
<script src="path-to/ts-luxon.umd.js"></script>
```

You may wish to alias the classes you use:

```js
var DateTime = tsLuxon.DateTime;
```

## Node.js

Supports Node.js 6+. Install via NPM:

```
npm install --save ts-luxon
```

```js
const { DateTime } = require("ts-luxon");
```

If you want to work with locales, you need ICU support:

 1. **For Node.js 13+, it comes built-in, no action necessary**
 2. For older versions of Node.js (only 12 is supported), you need to install it yourself:
    1. Install a build of Node.js with full ICU baked in, such as via nvm: nvm install <version> -s --with-intl=full-icu --download=all or brew: brew install node --with-full-icu
    2. Install the ICU data externally and point Node.js to it. The instructions on how to do that are below.

The instructions for using full-icu as a package are a little confusing. Node.js can't automatically discover that you've installed it, so you need to tell it where to find the data, like this:

```
npm install full-icu
node --icu-data-dir=./node_modules/full-icu
```

You can also point to the data with an environment var, like this:

```
NODE_ICU_DATA="$(pwd)/node_modules/full-icu" node
```

## ES6

Since v 3.0.1 there's also the ES6 version

- [Download full](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.es6.js)

- [Download minified](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.es6.min.js)

This would allow to use such imports even in js projects:

```js
import { DateTime } from "ts-luxon";
```

## Types

Types are included in the library! That was also the point when making the source with TypeScript! 🎉

## React Native

React Native >=0.70 works just fine out of the box. Older versions of React Native for Android (or if you disable Hermes) doesn't include Intl support by default, which you need for [a lot of Luxon's functionality](matrix.md).

For React Native >=0.60, you should configure the build flavor of jsc in `android/app/build.gradle`:

```diff
-def jscFlavor = 'org.webkit:android-jsc:+'
+def jscFlavor = 'org.webkit:android-jsc-intl:+'
```

For even older versions of React Native you can use [jsc-android-buildscripts](https://github.com/SoftwareMansion/jsc-android-buildscripts) to fix it.
