# Install guide

Luxon provides different builds for different JS environments. See below for a link to the right one and instructions on how to use it. Luxon supports all modern platforms, but see [the support matrix](matrix.html) for additional details.

## Basic browser setup

- [Download UMD](https://unpkg.com/ts-luxon@latest/dist/ts-luxon.umd.js)

You can also load the files from a [CDN](https://www.jsdelivr.com/package/npm/ts-luxon).

Just include Luxon in a script tag. You can access its various classes through the `tsLuxon` global.

```html
<script src="ts-luxon.umd.js"></script>
```

You may wish to alias the classes you use:

```js
var DateTime = tsLuxon.DateTime;
```

See the [support matrix](matrix.html) for more information on what works and what doesn't in IE.

## Node

Supports Node 12+. Install via NPM:

```
npm install --save ts-luxon
```

```ts
import { DateTime } from "ts-luxon";
```

If you want to work with locales, you need ICU support:

 1. **For Node 13+, it comes built-in, no action necessary**
 2. For older Nodes, you need to install it yourself:
    1. Install a build of Node with full ICU baked in, such as via nvm: nvm install <version> -s --with-intl=full-icu --download=all or brew: brew install node --with-full-icu
    2. Install the ICU data externally and point Node to it. The instructions on how to do that are below.

The instructions for using full-icu as a package are a little confusing. Node can't automatically discover that you've installed it, so you need to tell it where to find the data, like this:
```
npm install full-icu
node --icu-data-dir=./node_modules/full-icu
```

You can also point to the data with an environment var, like this:

```
NODE_ICU_DATA="$(pwd)/node_modules/full-icu" node
```

## Webpack

```
npm install --save luxon
```

```ts
import { DateTime } from "ts-luxon";
```

## React Native

React Native works just fine, but React Native for Android doesn't ship with Intl support, which you need for [a lot of Luxon's functionality](matrix.html). Use [jsc-android-buildscripts](https://github.com/SoftwareMansion/jsc-android-buildscripts) to fix it.
