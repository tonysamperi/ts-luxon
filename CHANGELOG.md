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

## 2.1.0
* Add fromISOTime, toISOTime and toMillis to Duration (#803)
* Fix padding of negative years in IsoDate (#871)
* Fix hasSame unit comparison (#798)
* Export VERSION information (#794)
* Durations are considered equal with extra zero units. Fixes #809 (#811)

##2.1.1
* Improved intersection check