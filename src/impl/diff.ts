import { Duration } from "../duration";
import { DateTime } from "../datetime";
import { DurationUnit, DurationOptions, DurationObject } from "../types/duration";

function dayDiff(earlier: DateTime, later: DateTime): number {
    const utcDayStart = (dt: DateTime): number =>
            dt
                .toUTC(0, { keepLocalTime: true })
                .startOf("days")
                .valueOf(),
        ms = utcDayStart(later) - utcDayStart(earlier);
    return Math.floor(Duration.fromMillis(ms).as("days"));
}

function highOrderDiffs(
    cursor: DateTime,
    later: DateTime,
    units: DurationUnit[]
): [DateTime, DurationObject, DateTime | undefined, DurationUnit | undefined] {
    const differs: [DurationUnit, (a: DateTime, b: DateTime) => number][] = [
        ["years", (a, b) => b.year - a.year],
        ["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
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
    const earlier = cursor;
    let lowestOrder: DurationUnit | undefined,
        highWater;

    /* This loop tries to diff using larger units first.
     If we overshoot, we backtrack and try the next smaller unit.
     "cursor" starts out at the earlier timestamp and moves closer and closer to "later"
     as we use smaller and smaller units.
     highWater keeps track of where we would be if we added one more of the smallest unit,
     this is used later to potentially convert any difference smaller than the smallest higher order unit
     into a fraction of that smallest higher order unit
     */
    for (const [unit, differ] of
        differs) {
        if (units.indexOf(unit) >= 0) {
            lowestOrder = unit;
            // we overshot the end point, backtrack cursor by 1
            results[unit] = differ(cursor, later);
            highWater = earlier.plus(results);

            // if we are still overshooting now, we need to backtrack again
            // this happens in certain situations when diffing times in different zones,
            // because this calculation ignores time zones
            if (highWater > later) {
                (results[unit] as number)--;
                cursor = earlier.plus(results);

                // if we are still overshooting now, we need to backtrack again
                // this happens in certain situations when diffing times in different zones,
                // because this calculation ignores time zones
                if (cursor > later) {
                    // keep the "overshot by 1" around as highWater
                    highWater = cursor;
                    // backtrack cursor by 1
                    (results[unit] as number)--;
                    cursor = earlier.plus(results);
                }
            }
            else {
                cursor = highWater;
            }
        }
    }

    return [cursor, results, highWater, lowestOrder];
}

export const diff = (earlier: DateTime, later: DateTime, units: DurationUnit[], opts: DurationOptions): Duration => {
    // eslint-disable-next-line prefer-const
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
