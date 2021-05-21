# Changelog

## before 2.0.0
* Refer to Luxon's changelog 
 
## 2.0.1
* Fixed DateTime.hasSame comparison 

## 2.0.2
* Added tslint
* Improved naming convention
* Solved Intl issue when compiling Angular (improved Intl namespace declaring and merging until es2020.intl)

## 2.0.3
* Added method resolvedLocaleOptions as per luxon@1.0.25

## 2.1.0  (Luxon 1.26.0)
* Add fromISOTime, toISOTime and toMillis to Duration (#803)
* Fix padding of negative years in IsoDate (#871)
* Fix hasSame unit comparison (#798)
* Export VERSION information (#794)
* Durations are considered equal with extra zero units. Fixes #809 (#811)

##2.1.1 (deprecated)
* Improved intersection check

##2.1.2
* Fixed package contents
* Adding missing exports of types for Duration

##2.2.0 (Luxon 1.27.0)
* Added version
* datetime.ts: Adding validation for mixing incompatible units
* Fix small typo in math doc
* Fixed DRY principle violation in DateTime.local()
* IANAZone.ts:  fixed Etc/GMT0 yields Invalid DateTime
* Add opt to use existing loc obj in weekdays/months
* Added info benchmarks
* feat: multiple units support in toRelative
* update node install instructions.

