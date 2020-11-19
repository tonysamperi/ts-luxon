import Duration from "../duration";
import DateTime from "../datetime";
import { DurationUnit, DurationOptions } from "../types/duration";
import { ThrowOnInvalid } from "../types/common";
export default function (earlier: DateTime, later: DateTime, units: DurationUnit[], options: DurationOptions & ThrowOnInvalid): Duration;
