# Changelog

## 6.0.0 (Luxon next 3.5.0)
* Added support for esm
* Removed umd bundle

## 5.1.0 (Luxon next 3.5.0)
* Add lastMoment getter to Interval (#1280)
* Create LocaleCache to optimize maintenance and readability of the various locale caches (#1642)
* Fix DateTime toISODate return type
* Fix DateTime toISO return type
* Fix DateTime until return type
* Optimize performance by adding caching for resolved options and parsed locale strings
* Fix tests to work with Node 22 (#1675)

## 5.0.6 (Luxon next 3.5.0)
* Documented weekSettings opt in DateTime (#1640)

## 5.0.5 (Luxon next 3.4.4)

* Final version of package.json exports

## 5.0.4 \***DEPRECATED\***

* The extra "require" actually broke

## 5.0.3  \***DEPRECATED\***

* Fixed package.json

## 5.0.2 \***DEPRECATED\***

* Fixed tokenParser

## 5.0.1 \***DEPRECATED\***

* Fixed build output (removed extra terser)

## 5.0.0 \***DEPRECATED\***

* Partially fixed package.json

## 4.6.2 (Luxon next 3.4.4)

* Fix tokenParser.ts

## 4.6.1 (Luxon next 3.4.4)

* Fix package outputs

## 4.6.0 (Luxon next 3.4.4)

* Validate time zone in quickDT prior to guessing offset (#1575)
* Use getPrototypeOf instead of __proto__ (#1592)
* Perf: Memoize digitsRegex (#1581)
* Add DateTime.buildFormatParser and DateTime.fromFormatParser (#1582)
* Perf: Use computed offset passed in DateTime constructor (#1576)
* Update interval.js doc per #742 (#1565)
* Added some JS doc for time zones (#1499)
* Fix cutoff year docs
* Perf: Cache ts offset guesses for quickDT (#1579)

## 4.5.2 (Luxon 3.4.4)

* Fixed Datetime docs for: fromJSDate, fromMillis, fromSeconds, diff (
  Closes [#9](https://github.com/tonysamperi/ts-luxon/issues/9))

## 4.5.1 (Luxon 3.4.4)

* Fixed DateTime.toISODate implementation
* Removed null on return types of DateTime (avoid needing not nullish operators):
    * monthLong / monthShort
    * offsetNameLong / offsetNameShort
    * weekdayLong / weekdayShort
    * zoneName
    * toISO / toISOTime / toISOWeekDate
    * toSQL
    * toString

## 4.5.0 (Luxon 3.4.4)

* Fixed space characters in tests for Node 20
* Improve DateTime#diff for cross-zone diffs in certain situations (#1165)
* Improved normalization functions
* Implement localized week information (#1454)
* Fix Interval.splitAt datetime sorting (#1524)
* Add custom inspect for node without dependency (#1526)

## 4.4.0 (Luxon 3.4.1)

* Switched to eslint (finally!)
* Refactored everything to respect alphabetic order rule
* Fix parsing.md docs: remove "TTT" from valid parsing tokens (#1427)
* Fix math.md docs: add missing "leap" in "leap years" (#1438)
* Fix zones.md docs: fix default zone name (#1394)
* Fix DateTime.invalid documentation (#1470)
* Fix normalize() to handle partially negative inputs (#1467)
* Fix Info.months for Islamic calendar (#1464)
* Added search in docs (#1481)
* Handle invalid Durations in toHuman and toMillis (#1489)
* Improve Duration#shiftTo and Duration#normalize now having a better handling (#1493)

## 4.3.1 (Luxon 3.3.0)

* Fix typings path issue (#6)[https://github.com/tonysamperi/ts-luxon/issues/6]

## 4.3.0 (Luxon 3.3.0)

* Handle dates in year 99 rolling over into year 100 behaving as if year 100 was a leap year (#1390 / #1389)
* Fix support for Node 18 (tests included)
* Add toUnixInteger() to the formatting documentation (#1379)
* Custom zone formatting support (#1377)
* Update docs on react native android support (#1367 / #864)
* fix notes for quarter workaround (#1265)
* zones.md assign to defaultZoneName (#1264)
* Improve DateTime#diff for cross-zone diffs in certain situations (#1165)
* Fix Duration#toISOTime depending on the locale (#1404)
* Correctly handle hourCycle when expanding macro tokens (#1391 / #1197)
* Fixing typos (#1408)
* Expose method on DateTime to get all possible offsets for ambiguous local times (#1405)

## 4.2.2 (Luxon next 3.3.0)

* fix property VERSION now reading directly the package.json to avoid misalignment

## 4.2.1 (Luxon next 3.3.0)

* allow parsing of just an offset
* fix parsing issue for Chromium browsers above v 109 (fixes #4)
* upgrade typescript version from 4.6 to 4.7

## 4.2.0 (Luxon 3.2.1)

* Allow timeZone to be specified as an intl option
* Fix for diff's handling of end-of-month when crossing leap years (#1340)
* Add Interval.toLocaleString() (#1320)
* Fixed Datetime#loc accessor
* preserve language tags (#1354)
* fix rfc2822 regex
* added test script to compensate for removed Docker

## 4.1.0 (Luxon 3.1.1)

* Add Settings.twoDigitCutoffYear to configure parsing 'yy' token. (#1330)
* Add Interval.toLocaleString() (#1320)

## 4.0.1 (Luxon 3.1.0)

* Version bump, added homepage to package.json

## 4.0.0 (Luxon 3.1.0)

* Add "default" as an option for specifying a zone, and change "system" to really mean the system zone (breaking change)
* Add DateTime.parseFormatForOpts
* Fixed JSDocs for static members (#1272)
* Adds 'at' to FULL and HUGE examples for en_US (#1256)
* Update parsing docs to show syntax for literals (#1271)
* Exported ConversionMatrixUnit and ConversionMatrix
* Created interface DurationConfig and fixed weirdly underscored props in Duration._clone.
* Duration support custom matrix (#1220)
* Added DateTime.expandFormat
* Added support for custom conversion matrices in Durations

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
* Downgrade typescript version to ~3.9.7, since emitted globalThis for types breaks TS compilation when using the
  library

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