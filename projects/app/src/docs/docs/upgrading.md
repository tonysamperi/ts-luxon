# Upgrading Luxon

## 3.x to 4.0

Version 4.0 has one breaking change: specifying "system" as the zone always results in the system zone, regardless of what you have the default set to. To get the default zone (whatever it is set to), use "default":

```js
Settings.defaultZone = "America/Chicago";

DateTime.now().setZone("default") // results in Chicago time
DateTime.now().setZone("system") // uses the user's system time
```

If this seems obvious, just be aware that it didn't work like that before!

## 2.x to 3.0

Version 3.0 of Luxon has a number of breaking changes.

### Environment support

TSLuxon 3.0 does not support Node < 12, or any version of IE. It also only supports newer versions of major browsers. This change
allows Luxon to make more assumptions about what's supported in the environment and will allow Luxon's code to simplify. See
the [Support Matrix](matrix.md) for more.

For this same reason, a polyfilled build is no longer provided; everything Luxon needs comes standard on browsers.

### Breaking signature changes

There are many more specific breaking changes. Most are aimed and making Luxon's handling of option parameters more consistent.

#### fromObject
`DateTime.fromObject()` and `Duration.fromObject()` now accept two parameters: one for the object and one for the options.

For example:

```js
// TSLuxon 2.x
DateTime.fromObject({ hour: 3, minute: 2, zone: "America/New_York", locale: "ru" });
Duration.fromObject({ hours: 3, minutes: 2, conversionAccuracy: "casual", locale: "ru" });

// vs Luxon 3.x
DateTime.fromObject({ hour: 3, minute: 2 }, { zone: "America/New_York", locale: "ru" });
Duration.fromObject({ hours: 3, minutes: 2 }, { conversionAccuracy: "casual", locale: "ru" });
```

#### toLocaleString

In Luxon 2.x, you can mix Intl options with overrides of the DateTime configuration into the same options parameter. 

These are now two separate parameters:

```js

// TSLuxon 2.x
DateTime.now().toLocaleString({ hour: "2-digit", locale: "ru" })

// vs TSLuxon 3.x

DateTime.now().toLocaleString({ hour: "2-digit" }, { locale: "ru" })
```

#### System zone

The zone of the executing environment (e.g. the time set on the computer running the browser running Luxon), is now called
"system" instead of "local" to reduce confusion.

```js
DateTime.fromObject({}, { zone: "local" }) // still works
DateTime.fromObject({}, { zone: "system" }) // preferred

DateTime.fromObject({}, { zone: "system" }).zone // => type is SystemZone
DateTime.fromObject({}, { zone: "system" }).zone.type // => "system"
```

#### Default zone

Luxon 3.x cleans up the handling of `Settings.defaultZone`:

```js

// setting
Settings.defaultZone = "America/New_York"; // can take a string
Settings.defaultZone = IANAZone.create("America/New_York"); // or a Zone instance

// getting
Settings.defaultZone //=> a Zone instance
```

The most significant breaking change here is that `Settings.defaultZoneName` no longer exists.

#### Other breaking changes

 * `DateTime#toObject` no longer accepts an `includeConfig` option
 * `resolvedLocaleOpts` is now `resolvedLocaleOptions`
 * `Zone#universal` is now `Zone#isUniversal`

### Non-breaking changes

 * `DateTime.local()` and `DateTime.utc()` now take an options parameter for setting zone and locale, same as `fromObject()`.

### A note

We originally had more ambitious plans for Luxon 2.0: a port to Typescript, an overhaul of error handling, and lots of other changes.
The problem is that we're very busy, and in the meantime browsers have evolved quickly, the mistakes in our API bothered a lot
of developers, and our need to support old environments made Luxon more difficult to change. So we made a basic set of changes
to give us some operating room. And hopefully someday we'll get back to those more ambitious plans.
