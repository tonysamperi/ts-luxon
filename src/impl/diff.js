import Duration from "../duration";
function dayDiff(earlier, later) {
    var utcDayStart = function (dt) {
        return dt
            .toUTC(0, { keepLocalTime: true })
            .startOf("days")
            .valueOf();
    }, ms = utcDayStart(later) - utcDayStart(earlier);
    return Math.floor(Duration.fromMillis(ms).as("days"));
}
function highOrderDiffs(earlier, later, units) {
    var _a, _b;
    var differs = [
        ["years", function (a, b) { return b.year - a.year; }],
        ["months", function (a, b) { return b.month - a.month + (b.year - a.year) * 12; }],
        [
            "weeks",
            function (a, b) {
                var days = dayDiff(a, b);
                return (days - (days % 7)) / 7;
            }
        ],
        ["days", dayDiff]
    ];
    var results = {};
    var lowestOrder, highWater = earlier, cursor = earlier.reconfigure({});
    for (var _i = 0, differs_1 = differs; _i < differs_1.length; _i++) {
        var _c = differs_1[_i], unit = _c[0], differ = _c[1];
        if (units.indexOf(unit) >= 0) {
            lowestOrder = unit;
            var delta = differ(cursor, later);
            highWater = cursor.plus((_a = {}, _a[unit] = delta, _a));
            if (highWater > later) {
                cursor = cursor.plus((_b = {}, _b[unit] = delta - 1, _b));
                delta -= 1;
            }
            else {
                cursor = highWater;
            }
            results[unit] = delta;
        }
    }
    return [cursor, results, highWater, lowestOrder];
}
export default function (earlier, later, units, options) {
    var _a, _b;
    // eslint-disable-next-line prefer-const
    var _c = highOrderDiffs(earlier, later, units), cursor = _c[0], results = _c[1], highWater = _c[2], lowestOrder = _c[3];
    var remainingMillis = later.valueOf() - cursor.valueOf();
    var lowerOrderUnits = units.filter(function (u) { return ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0; });
    if (lowerOrderUnits.length === 0) {
        // if there are no low order units, there is at least one high order unit
        // and lowestOrder is hence defined
        if (highWater < later) {
            highWater = cursor.plus((_a = {}, _a[lowestOrder] = 1, _a));
        }
        if (highWater !== cursor) {
            results[lowestOrder] =
                results[lowestOrder] +
                    remainingMillis / (highWater.valueOf() - cursor.valueOf());
        }
    }
    var duration = Duration.fromObject(results, options);
    if (lowerOrderUnits.length > 0) {
        return (_b = Duration.fromMillis(remainingMillis, options)).shiftTo.apply(_b, lowerOrderUnits).plus(duration);
    }
    else {
        return duration;
    }
}
//# sourceMappingURL=diff.js.map