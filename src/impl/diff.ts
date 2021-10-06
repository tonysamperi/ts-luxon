import { Duration } from "../duration";
import { DateTime } from "../datetime";
import { DurationUnit, DurationOptions, DurationObject } from "../types/duration";

function dayDiff(earlier: DateTime, later: DateTime) {
    const utcDayStart = (dt: DateTime) =>
            dt
                .toUTC(0, { keepLocalTime: true })
                .startOf("days")
                .valueOf(),
        ms = utcDayStart(later) - utcDayStart(earlier);
    return Math.floor(Duration.fromMillis(ms).as("days"));
}

function highOrderDiffs(
    earlier: DateTime,
    later: DateTime,
    units: DurationUnit[]
): [DateTime, DurationObject, DateTime, DurationUnit | undefined] {
    const differs: [DurationUnit, (a: DateTime, b: DateTime) => number][] = [
        ["years", (a, b) => b.year - a.year],
        ["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
        [
            "weeks",
            (a, b) => {
                const days = dayDiff(a, b);
                return (days - (days % 7)) / 7;
            }
        ],
        ["days", dayDiff]
    ];

    const results: DurationObject = {};
    let lowestOrder: DurationUnit | undefined,
        highWater = earlier,
        cursor = earlier.reconfigure({});

    for (const [unit, differ] of differs) {
        if (units.indexOf(unit) >= 0) {
            lowestOrder = unit;

            let delta = differ(cursor, later);
            highWater = cursor.plus({ [unit]: delta });

            if (highWater > later) {
                cursor = cursor.plus({ [unit]: delta - 1 });
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

export const diff = (earlier: DateTime, later: DateTime, units: DurationUnit[], opts: DurationOptions): Duration => {
    // tslint:disable-next-line:prefer-const
    let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);

    const remainingMillis = +later - +cursor;

    const lowerOrderUnits = units.filter(
        (u: DurationUnit) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0
    );

    if (lowerOrderUnits.length === 0) {
        if (highWater < later) {
            highWater = cursor.plus({ [lowestOrder as string]: 1 });
        }

        if (highWater !== cursor) {
            results[lowestOrder as keyof DurationObject] = (results[lowestOrder as keyof DurationObject] || 0) + remainingMillis / (+highWater - +cursor);
        }
    }

    const duration = Duration.fromObject(results, opts);

    if (lowerOrderUnits.length > 0) {
        return Duration.fromMillis(remainingMillis, opts)
            .shiftTo(...lowerOrderUnits)
            .plus(duration);
    }
    else {
        return duration;
    }
};
