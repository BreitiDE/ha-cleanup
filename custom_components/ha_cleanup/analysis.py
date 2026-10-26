"""Outlier detection for numeric time series (pure Python, no Home Assistant imports)."""

from __future__ import annotations

import math
from statistics import fmean, median
from typing import Any

from .const import (
    DEFAULT_THRESHOLDS,
    METHOD_IQR,
    METHOD_RANGE,
    METHOD_SPIKE,
    METHOD_ZSCORE,
    UNAVAILABLE_STATES,
)

MAD_SCALE = 1.4826  # makes the MAD comparable to a standard deviation
CHART_BUCKETS = 600


def parse_float(value: Any) -> float | None:
    """Return a finite float or None."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        f = float(value)
    else:
        s = str(value).strip()
        if s.lower() in UNAVAILABLE_STATES:
            return None
        try:
            f = float(s)
        except ValueError:
            return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def decimals_of(text: str | None) -> int:
    """Number of decimals used in a stored state string."""
    if not text or "." not in str(text):
        return 0
    frac = str(text).split(".", 1)[1]
    digits = 0
    for ch in frac:
        if ch.isdigit():
            digits += 1
        else:
            break
    return digits


def format_value(value: float, reference: str | None, neighbours: list[str] | None = None) -> str:
    """Format a number the way the sensor writes its states."""
    places = decimals_of(reference)
    for n in neighbours or []:
        places = max(places, decimals_of(n))
    places = min(places, 10)
    if places == 0 and float(value).is_integer():
        return str(int(value))
    if places == 0:
        places = 3
    text = f"{value:.{places}f}"
    return text


def _quantiles(sorted_vals: list[float], q: float) -> float:
    n = len(sorted_vals)
    if n == 1:
        return sorted_vals[0]
    pos = (n - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return sorted_vals[lo]
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (pos - lo)


def _quantum(sorted_vals: list[float]) -> float:
    """Smallest step between distinct typical values (the sensor's resolution).

    Only values between the 1st and 99th percentile are used, so a single
    wrong value cannot make the resolution look huge.
    """
    best = math.inf
    prev = None
    lo = _quantiles(sorted_vals, 0.01) if sorted_vals else 0.0
    hi = _quantiles(sorted_vals, 0.99) if sorted_vals else 0.0
    for v in sorted_vals:
        if v < lo or v > hi:
            continue
        if prev is not None and v != prev:
            best = min(best, v - prev)
        prev = v
    if best is math.inf:
        ref = abs(sorted_vals[len(sorted_vals) // 2]) if sorted_vals else 0.0
        return max(ref * 1e-3, 1e-6)
    return best


def summarize(values: list[float]) -> dict[str, Any]:
    """Descriptive statistics."""
    if not values:
        return {"count": 0}
    s = sorted(values)
    mean = fmean(values)
    var = fmean([(v - mean) ** 2 for v in values]) if len(values) > 1 else 0.0
    return {
        "count": len(values),
        "min": s[0],
        "max": s[-1],
        "mean": mean,
        "median": _quantiles(s, 0.5),
        "std": math.sqrt(var),
        "p01": _quantiles(s, 0.01),
        "p99": _quantiles(s, 0.99),
    }


def _neighbour_median(values: list[float], flagged: set[int], i: int, window: int) -> float | None:
    nb: list[float] = []
    n = len(values)
    j = i - 1
    while j >= 0 and len(nb) < window:
        if j not in flagged:
            nb.append(values[j])
        j -= 1
    left = len(nb)
    j = i + 1
    while j < n and len(nb) < left + window:
        if j not in flagged:
            nb.append(values[j])
        j += 1
    return median(nb) if nb else None


def detect(
    values: list[float],
    *,
    method: str = METHOD_SPIKE,
    threshold: float | None = None,
    window: int = 5,
    vmin: float | None = None,
    vmax: float | None = None,
    max_run: int = 3,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Find outliers.

    Returns a list of {index, score, reason, expected} and info about the
    thresholds that were used.
    """
    n = len(values)
    if threshold is None or threshold <= 0:
        threshold = DEFAULT_THRESHOLDS.get(method, 6.0)
    window = max(1, min(int(window or 5), 50))
    info: dict[str, Any] = {"method": method, "threshold": threshold, "window": window}
    if n == 0:
        return [], info

    s = sorted(values)
    quantum = _quantum(s)
    med_all = _quantiles(s, 0.5)
    mad_all = MAD_SCALE * median([abs(v - med_all) for v in values])
    mean = fmean(values)
    std = math.sqrt(fmean([(v - mean) ** 2 for v in values])) if n > 1 else 0.0
    global_scale = mad_all or std or quantum
    # Noise level from the change between consecutive values: not inflated by
    # slow daily cycles, so spikes on a smooth curve stay visible.
    diffs = [abs(values[i] - values[i - 1]) for i in range(1, n)]
    noise = MAD_SCALE * median(diffs) / math.sqrt(2) if diffs else 0.0
    info.update({"robust_sigma": global_scale, "noise": noise, "resolution": quantum})

    hits: dict[int, tuple[float, str]] = {}

    def hit(i: int, score: float, reason: str) -> None:
        old = hits.get(i)
        if old is None or score > old[0]:
            hits[i] = (score, reason)

    # Plausible range applies to every method.
    if vmin is not None or vmax is not None:
        span = global_scale or 1.0
        for i, v in enumerate(values):
            if vmin is not None and v < vmin:
                hit(i, 1000.0 + (vmin - v) / span, "below plausible range")
            elif vmax is not None and v > vmax:
                hit(i, 1000.0 + (v - vmax) / span, "above plausible range")

    if method == METHOD_SPIKE and n >= 3:
        floor = max(noise, quantum)
        spikes: dict[int, tuple[float, int]] = {}
        for i, v in enumerate(values):
            # Same number of neighbours everywhere: near the start or end of
            # the series the window extends further to the other side.
            lo = max(0, min(i - window, n - 1 - 2 * window))
            hi = min(n - 1, max(i + window, 2 * window))
            nb = values[lo:i] + values[i + 1 : hi + 1]
            if len(nb) < 2:
                continue
            m = median(nb)
            local = MAD_SCALE * median([abs(x - m) for x in nb])
            scale = max(local, floor)
            score = abs(v - m) / scale
            if score > threshold:
                spikes[i] = (score, 1 if v > m else -1)
        # A spike is short. Longer runs in the same direction are real events
        # (kettle on, door open, heating phase) and are not reported.
        max_run = max(1, int(max_run or 3))
        run: list[int] = []
        for i in sorted(spikes) + [None]:
            if run and (i is None or i != run[-1] + 1 or spikes[i][1] != spikes[run[-1]][1]):
                if len(run) <= max_run:
                    for j in run:
                        score, sign = spikes[j]
                        hit(j, score, "spike above neighbours" if sign > 0 else "drop below neighbours")
                run = []
            if i is not None:
                run.append(i)
        info.update({"floor": floor, "max_run": max_run})
    elif method == METHOD_IQR and n >= 4:
        q1, q3 = _quantiles(s, 0.25), _quantiles(s, 0.75)
        iqr = max(q3 - q1, quantum)
        lo, hi = q1 - threshold * iqr, q3 + threshold * iqr
        for i, v in enumerate(values):
            if v < lo:
                hit(i, (lo - v) / iqr + threshold, "below IQR fence")
            elif v > hi:
                hit(i, (v - hi) / iqr + threshold, "above IQR fence")
        info.update({"lower": lo, "upper": hi})
    elif method == METHOD_ZSCORE and n >= 3 and std > 0:
        for i, v in enumerate(values):
            z = abs(v - mean) / std
            if z > threshold:
                hit(i, z, "far from mean (z-score)")
        info.update({"lower": mean - threshold * std, "upper": mean + threshold * std})
    elif method == METHOD_RANGE:
        pass

    flagged = set(hits)
    result = []
    for i in sorted(hits):
        score, reason = hits[i]
        expected = _neighbour_median(values, flagged, i, window)
        if expected is None:
            expected = med_all
        result.append({"index": i, "score": round(score, 2), "reason": reason, "expected": expected})
    return result, info


def chart(times: list[float], values: list[float], buckets: int = CHART_BUCKETS) -> dict[str, list]:
    """Downsample to min/max/mean per time bucket so spikes stay visible."""
    if not times:
        return {"t": [], "min": [], "max": [], "mean": []}
    if len(times) <= buckets:
        return {"t": list(times), "min": list(values), "max": list(values), "mean": list(values)}
    t0, t1 = times[0], times[-1]
    width = (t1 - t0) / buckets or 1.0
    out_t: list[float] = []
    out_min: list[float] = []
    out_max: list[float] = []
    out_mean: list[float] = []
    cur = -1
    acc_min = acc_max = acc_sum = 0.0
    acc_n = 0
    for t, v in zip(times, values):
        b = min(int((t - t0) / width), buckets - 1)
        if b != cur:
            if acc_n:
                out_t.append(t0 + (cur + 0.5) * width)
                out_min.append(acc_min)
                out_max.append(acc_max)
                out_mean.append(acc_sum / acc_n)
            cur, acc_min, acc_max, acc_sum, acc_n = b, v, v, 0.0, 0
        acc_min = min(acc_min, v)
        acc_max = max(acc_max, v)
        acc_sum += v
        acc_n += 1
    if acc_n:
        out_t.append(t0 + (cur + 0.5) * width)
        out_min.append(acc_min)
        out_max.append(acc_max)
        out_mean.append(acc_sum / acc_n)
    return {"t": out_t, "min": out_min, "max": out_max, "mean": out_mean}
