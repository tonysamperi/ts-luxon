# Changelog

## 3.5.0 (Luxon 2.5.x)
* DateTime.diff produces wrong results with unit quarter fix. (#1279)
* dt.toLocaleString(DateTime.DATETIME_FULL); //=> 'April 20, 2017 at 11:32 AM EDT'
* Add Duration.rescale

## 3.4.1 (Luxon 2.5.0)
* fix #776 (#872)

## 3.4.0 (Luxon 2.5.0)
* Wednesday support for RFC 850 (#1225)
* Fix link to duration months (#1232)
* Mention escaping behavior in Duration.toFormat docstring (#1221)
* Exported ORDERED_UNITS, REVERSE_ORDERED_UNITS and NormalizedDurationUnit for util purposes
* Fixed Duration.toHuman (#1134)
* Added option to exclude quarters and weeks in Duration.toHuman

## 3.3.2 (Luxon 2.4.0)
* Fixed version
* Downgrade typescript version to ~3.9.7, since emitted globalThis for types breaks TS compilation when using the library

## 3.3.1 (Luxon 2.4.0)
* Fixed wrong type in toFormat, DateTimeOptions instead of LocaleOptions
* Removed useless type DateTimeWithZoneOptions, unified everything under DateTimeOptions

## 3.3.0 (Luxon 2.4.0)
* fix: change NBSP regex to a non-matching group #1169 (#1194)
* fix bug 908 isInDST() incorrect (#1199)
* Update math.md (#1180)
* add support for extended zones
* Increase number of allowed digits when parsing ISO duration (#1213)

## 3.2.0 (Luxon 2.3.2) 
* NOTE: I'm doing a major version since there's added functionality. Don't know why in Luxon they only bumped patch
* Added an `includeOffsetSpace` option to `toSQL` and `toSQLTime`
* Added `toUnixInteger`
* Don't use `-0` when negating durations with zeros in them
* Fix timezone calculations for negative years
* add week formatting token "w" for durations
* fix weekday computation for years 0-100

## 3.1.0 (Luxon 2.3.0)

* api-docs: fixed links
* Duration support for fractional duration (#1071)
* Duration.fromObject now supports strings with new type UnparsedDurationObject
* Add fromDurationLike method (#1062)
* Stop special casing of `Etc/GMT*` zones
* switch back to using hour12 for IANA offset calculation
* Fix issue in quirky environments that lack `hourCycle` support and sometimes computed offsets 12 hours off
* Handling of quarters in DateTime + tokenParser, don't know how it disappeared
* Allow offsets to pick among ambiguous times when both an offset and zone are provided to `fromFormat`
* Fix a floating point bug in `Duration.shiftTo()`
* Fix http and 2822 docstrings
* Refactored Intl typing (intl-next.ts) 
* Added type definitions for Intl.ListFormat
* add Duration#toHuman
* Upgrade typescript version to ~4.4.4
* faster toISO, toISODate, and toISOTIme
* simplify toSQL and friends
* Major perf improvements to `toISO()`, `toISODate()`, `toISOTime()`, and `toSQLDate()`
* Fixed date padding for negative years in `toISO()`
* Fix whacky Iana Dates

## 3.0.1

* Added [docs](https://tonysamperi.github.io/ts-luxon/docs)! 🎉
* Added ES6 build and minified versions with inline sourcemaps! 🎉

## 3.0.0 (Luxon 2.0.1)

* Inverted changelog to show latest versions first
* Removed useless site folder (I'll work on the gh-pages only with some md viewer for Angular)
* Change usage of hour12 to hourCycle
* Remove Zone and FTP fallbacks
* Fix ISO parsing for offset specifiers in Year-Ordinal formats
* Renamed DateTime.resolvedLocalOptions to DateTime.resolvedLocaleOptions
* Add support for formatting and parsing tokens `uu` and `uuu` (#976)
* Add test cases for day-of-the-month parsing (#1023)

## 2.2.0 (Luxon 1.27.0)

* Added version
* datetime.ts: Adding validation for mixing incompatible units
* Fix small typo in math doc
* Fixed DRY principle violation in DateTime.local()
* IANAZone.ts:  fixed Etc/GMT0 yields Invalid DateTime
* Add opt to use existing loc obj in weekdays/months
* Added info benchmarks
* feat: multiple units support in toRelative
* update node install instructions.

## 2.1.2

* Fixed package contents
* Adding missing exports of types for Duration

## 2.1.1 (deprecated)

* Improved intersection check

## 2.1.0  (Luxon 1.26.0)

* Add fromISOTime, toISOTime and toMillis to Duration (#803)
* Fix padding of negative years in IsoDate (#871)
* Fix hasSame unit comparison (#798)
* Export VERSION information (#794)
* Durations are considered equal with extra zero units. Fixes #809 (#811)

## 2.0.3

* Added method resolvedLocaleOptions as per luxon@1.0.25

## 2.0.2

* Added tslint
* Improved naming convention
* Solved Intl issue when compiling Angular (improved Intl namespace declaring and merging until es2020.intl)

## 2.0.1

* Fixed DateTime.hasSame comparison

## before 2.0.0

* Refer to Luxon's changelog