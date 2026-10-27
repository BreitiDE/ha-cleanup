"""Database access for Home Assistant Cleanup.

Every function in this module is blocking and must run in the recorder's
database executor (``get_instance(hass).async_add_executor_job``).
Raw SQL with bound parameters is used so the code works on SQLite,
MariaDB/MySQL and PostgreSQL alike.
"""

from __future__ import annotations

import math
from typing import Any

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from .analysis import chart, detect, format_value, parse_float, summarize
from .const import SOURCE_STATES, SOURCE_STATISTICS, SOURCE_STATISTICS_SHORT

STAT_TABLES = {
    SOURCE_STATISTICS: "statistics",
    SOURCE_STATISTICS_SHORT: "statistics_short_term",
}


class CleanupError(Exception):
    """Error shown to the user."""


# --------------------------------------------------------------------------- meta


def read_meta(session: Session) -> dict[str, Any]:
    """Entity ids with recorded states and all long-term statistic ids."""
    states_meta = {
        row.entity_id: row.metadata_id
        for row in session.execute(text("SELECT metadata_id, entity_id FROM states_meta"))
        if row.entity_id
    }
    stats: dict[str, dict[str, Any]] = {}
    for row in session.execute(
        text(
            "SELECT id, statistic_id, source, unit_of_measurement, has_mean, has_sum, name "
            "FROM statistics_meta"
        )
    ):
        if not row.statistic_id:
            continue
        stats[row.statistic_id] = {
            "id": row.id,
            "source": row.source,
            "unit": row.unit_of_measurement,
            "has_mean": bool(row.has_mean),
            "has_sum": bool(row.has_sum),
            "name": row.name,
        }
    return {"states_meta": states_meta, "statistics": stats}


def latest_states(session: Session, metadata_ids: list[int], per_entity: int = 5) -> dict[int, list[str]]:
    """The last few state strings for each metadata_id."""
    out: dict[int, list[str]] = {}
    q = text(
        "SELECT state FROM states WHERE metadata_id = :mid "
        "ORDER BY last_updated_ts DESC LIMIT :n"
    )
    for mid in metadata_ids:
        out[mid] = [r.state for r in session.execute(q, {"mid": mid, "n": per_entity})]
    return out


def statistic_meta(session: Session, statistic_id: str) -> dict[str, Any] | None:
    row = session.execute(
        text(
            "SELECT id, unit_of_measurement, has_mean, has_sum, name FROM statistics_meta "
            "WHERE statistic_id = :sid"
        ),
        {"sid": statistic_id},
    ).first()
    if row is None:
        return None
    return {
        "id": row.id,
        "unit": row.unit_of_measurement,
        "has_mean": bool(row.has_mean),
        "has_sum": bool(row.has_sum),
        "name": row.name,
    }


def states_metadata_id(session: Session, entity_id: str) -> int | None:
    row = session.execute(
        text("SELECT metadata_id FROM states_meta WHERE entity_id = :e"), {"e": entity_id}
    ).first()
    return row.metadata_id if row else None


def table_counts(session: Session) -> dict[str, int]:
    """Approximate row counts (cheap on SQLite thanks to max(rowid))."""
    out = {}
    for table, key in (("states", "state_id"), ("statistics", "id"), ("statistics_short_term", "id")):
        row = session.execute(text(f"SELECT MAX({key}) AS m FROM {table}")).first()
        out[table] = int(row.m or 0) if row else 0
    return out


# ------------------------------------------------------------------------ fetching


def _fetch_states(session: Session, mid: int, start: float, end: float, limit: int) -> tuple[list, bool]:
    rows = session.execute(
        text(
            "SELECT state_id, state, last_updated_ts FROM states "
            "WHERE metadata_id = :mid AND last_updated_ts >= :s AND last_updated_ts < :e "
            "ORDER BY last_updated_ts DESC LIMIT :n"
        ),
        {"mid": mid, "s": start, "e": end, "n": limit + 1},
    ).all()
    truncated = len(rows) > limit
    rows = rows[:limit]
    rows.reverse()
    return rows, truncated


def _fetch_stats(session: Session, table: str, meta_id: int, start: float, end: float, limit: int) -> tuple[list, bool]:
    rows = session.execute(
        text(
            f"SELECT id, start_ts, mean, min, max, state, sum FROM {table} "
            "WHERE metadata_id = :mid AND start_ts >= :s AND start_ts < :e "
            "ORDER BY start_ts DESC LIMIT :n"
        ),
        {"mid": meta_id, "s": start, "e": end, "n": limit + 1},
    ).all()
    truncated = len(rows) > limit
    rows = rows[:limit]
    rows.reverse()
    return rows, truncated


def _fetch_sum_before(session: Session, table: str, meta_id: int, start: float) -> float | None:
    row = session.execute(
        text(
            f"SELECT sum FROM {table} WHERE metadata_id = :mid AND start_ts < :s "
            "ORDER BY start_ts DESC LIMIT 1"
        ),
        {"mid": meta_id, "s": start},
    ).first()
    return parse_float(row.sum) if row else None


def _cap(outliers: list[dict], max_outliers: int) -> tuple[list[dict], int]:
    total = len(outliers)
    if total > max_outliers:
        outliers = sorted(outliers, key=lambda o: o["score"], reverse=True)[:max_outliers]
        outliers.sort(key=lambda o: o["ts"])
    return outliers, total


def analyze(
    session: Session,
    *,
    entity_id: str,
    source: str,
    start: float,
    end: float,
    method: str,
    threshold: float | None,
    window: int,
    vmin: float | None,
    vmax: float | None,
    max_rows: int,
    max_outliers: int,
    max_run: int = 3,
) -> dict[str, Any]:
    """Load a series and find outliers."""
    base: dict[str, Any] = {"entity_id": entity_id, "source": source, "start": start, "end": end}

    if source == SOURCE_STATES:
        mid = states_metadata_id(session, entity_id)
        if mid is None:
            raise CleanupError("This entity has no recorded states.")
        rows, truncated = _fetch_states(session, mid, start, end, max_rows)
        ids, times, values, raws = [], [], [], []
        skipped = 0
        for r in rows:
            v = parse_float(r.state)
            if v is None:
                skipped += 1
                continue
            ids.append(r.state_id)
            times.append(r.last_updated_ts)
            values.append(v)
            raws.append(r.state)
        hits, info = detect(values, method=method, threshold=threshold, window=window, vmin=vmin, vmax=vmax, max_run=max_run)
        outliers = []
        for h in hits:
            i = h["index"]
            outliers.append(
                {
                    "id": ids[i],
                    "ts": times[i],
                    "value": values[i],
                    "raw": raws[i],
                    "expected": h["expected"],
                    "suggested": format_value(h["expected"], raws[i], raws[max(0, i - 2) : i + 3]),
                    "score": h["score"],
                    "reason": h["reason"],
                    "prev": values[i - 1] if i > 0 else None,
                    "next": values[i + 1] if i + 1 < len(values) else None,
                    "is_latest": i == len(values) - 1 and not truncated and end >= times[-1],
                }
            )
        outliers, total = _cap(outliers, max_outliers)
        return {
            **base,
            "kind": "state",
            "rows": len(rows),
            "skipped": skipped,
            "truncated": truncated,
            "stats": summarize(values),
            "info": info,
            "chart": chart(times, values),
            "outliers": outliers,
            "total_outliers": total,
            "latest_id": ids[-1] if ids else None,
        }

    table = STAT_TABLES.get(source)
    if table is None:
        raise CleanupError(f"Unknown source {source}")
    meta = statistic_meta(session, entity_id)
    if meta is None:
        raise CleanupError("This entity has no long-term statistics.")
    rows, truncated = _fetch_stats(session, table, meta["id"], start, end, max_rows)
    base["unit"] = meta["unit"]

    if meta["has_sum"]:
        # Counters: look at the change of the running sum per period.
        prev = _fetch_sum_before(session, table, meta["id"], start)
        ids, times, deltas, sums = [], [], [], []
        for r in rows:
            s = parse_float(r.sum)
            if s is None:
                continue
            if prev is not None:
                ids.append(r.id)
                times.append(r.start_ts)
                deltas.append(s - prev)
                sums.append(s)
            prev = s
        hits, info = detect(deltas, method=method, threshold=threshold, window=window, vmin=vmin, vmax=vmax, max_run=max_run)
        hit_index = {h["index"] for h in hits}
        # A running sum must never fall: flag negative steps as well.
        for i, d in enumerate(deltas):
            if d < 0 and i not in hit_index:
                hits.append({"index": i, "score": 999.0, "reason": "counter went backwards", "expected": 0.0})
        hits.sort(key=lambda h: h["index"])
        outliers = []
        for h in hits:
            i = h["index"]
            expected = max(h["expected"], 0.0)
            outliers.append(
                {
                    "id": ids[i],
                    "ts": times[i],
                    "value": deltas[i],
                    "expected": expected,
                    "adjustment": expected - deltas[i],
                    "sum": sums[i],
                    "score": h["score"],
                    "reason": h["reason"],
                    "prev": deltas[i - 1] if i > 0 else None,
                    "next": deltas[i + 1] if i + 1 < len(deltas) else None,
                }
            )
        outliers, total = _cap(outliers, max_outliers)
        return {
            **base,
            "kind": "sum",
            "rows": len(rows),
            "skipped": 0,
            "truncated": truncated,
            "stats": summarize(deltas),
            "info": info,
            "chart": chart(times, deltas),
            "outliers": outliers,
            "total_outliers": total,
        }

    # Measurements: check mean, min and max separately, merge per row.
    ids = [r.id for r in rows]
    times = [r.start_ts for r in rows]
    fields: dict[str, list[float | None]] = {
        "mean": [parse_float(r.mean) for r in rows],
        "min": [parse_float(r.min) for r in rows],
        "max": [parse_float(r.max) for r in rows],
    }
    merged: dict[int, dict[str, Any]] = {}
    info: dict[str, Any] = {}
    for name, series in fields.items():
        idx = [i for i, v in enumerate(series) if v is not None]
        vals = [series[i] for i in idx]
        hits, finfo = detect(vals, method=method, threshold=threshold, window=window, vmin=vmin, vmax=vmax, max_run=max_run)
        if name == "mean":
            info = finfo
        for h in hits:
            row_i = idx[h["index"]]
            entry = merged.setdefault(row_i, {"fields": {}, "score": 0.0, "reason": h["reason"]})
            entry["fields"][name] = {"value": vals[h["index"]], "expected": h["expected"]}
            if h["score"] > entry["score"]:
                entry["score"] = h["score"]
                entry["reason"] = f"{name}: {h['reason']}"
    outliers = []
    for row_i in sorted(merged):
        e = merged[row_i]
        main = max(e["fields"], key=lambda f: abs(e["fields"][f]["value"] - e["fields"][f]["expected"]))
        outliers.append(
            {
                "id": ids[row_i],
                "ts": times[row_i],
                "field": main,
                "value": e["fields"][main]["value"],
                "expected": e["fields"][main]["expected"],
                "fields": e["fields"],
                "row": {k: fields[k][row_i] for k in fields},
                "score": round(e["score"], 2),
                "reason": e["reason"],
                "prev": fields[main][row_i - 1] if row_i > 0 else None,
                "next": fields[main][row_i + 1] if row_i + 1 < len(rows) else None,
            }
        )
    outliers, total = _cap(outliers, max_outliers)
    mean_vals = [v for v in fields["mean"] if v is not None]
    mean_times = [t for t, v in zip(times, fields["mean"]) if v is not None]
    ch = chart(mean_times, mean_vals)
    if len(rows) <= len(ch["t"]):
        # Show the real min/max band of each period.
        ch["min"] = [m if m is not None else v for m, v in zip(fields["min"], fields["mean"]) if v is not None]
        ch["max"] = [m if m is not None else v for m, v in zip(fields["max"], fields["mean"]) if v is not None]
    return {
        **base,
        "kind": "measurement",
        "rows": len(rows),
        "skipped": 0,
        "truncated": truncated,
        "stats": summarize(mean_vals),
        "stats_minmax": {
            "min": min((v for v in fields["min"] if v is not None), default=None),
            "max": max((v for v in fields["max"] if v is not None), default=None),
        },
        "info": info,
        "chart": ch,
        "outliers": outliers,
        "total_outliers": total,
    }


def scan(
    session: Session,
    *,
    entities: list[tuple[str, int]],
    start: float,
    end: float,
    method: str,
    threshold: float | None,
    window: int,
    limits: dict[str, dict],
    max_rows: int,
    max_run: int = 3,
    since: float | None = None,
) -> list[dict[str, Any]]:
    """Quick outlier count for many entities (states only).

    ``new`` counts outliers recorded after ``since`` (the previous scan).
    """
    out = []
    for entity_id, mid in entities:
        rows, _ = _fetch_states(session, mid, start, end, max_rows)
        times, values = [], []
        for r in rows:
            v = parse_float(r.state)
            if v is not None:
                times.append(r.last_updated_ts)
                values.append(v)
        lim = limits.get(entity_id) or {}
        hits, _ = detect(
            values,
            method=method,
            threshold=threshold,
            window=window,
            vmin=lim.get("min"),
            vmax=lim.get("max"),
            max_run=max_run,
        )
        worst = max(hits, key=lambda h: h["score"]) if hits else None
        new = sum(1 for h in hits if since is not None and times[h["index"]] > since)
        # Values outside the plausible range (shown on the Ranges page).
        lo, hi = lim.get("min"), lim.get("max")
        outside = [
            (abs(v - (lo if lo is not None and v < lo else hi)), v, t)
            for v, t in zip(values, times)
            if (lo is not None and v < lo) or (hi is not None and v > hi)
        ]
        out_worst = max(outside) if outside else None
        out.append(
            {
                "entity_id": entity_id,
                "count": len(values),
                "outliers": len(hits),
                "new": new if since is not None else len(hits),
                "max_score": worst["score"] if worst else 0,
                "worst_value": values[worst["index"]] if worst else None,
                "worst_ts": times[worst["index"]] if worst else None,
                "min": min(values) if values else None,
                "max": max(values) if values else None,
                "outside": len(outside) if lim else None,
                "outside_value": out_worst[1] if out_worst else None,
                "outside_ts": out_worst[2] if out_worst else None,
                "limits": {"min": lo, "max": hi} if lim else None,
            }
        )
    return out


# ------------------------------------------------------------------------- writing


def _finite(v: Any, what: str) -> float:
    f = parse_float(v)
    if f is None:
        raise CleanupError(f"{what} is not a valid number.")
    return f


def update_states(session: Session, entity_id: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Set new values for state rows. Returns the old values for undo."""
    mid = states_metadata_id(session, entity_id)
    if mid is None:
        raise CleanupError("Entity not found in the recorder.")
    changed = []
    for item in items:
        sid = int(item["id"])
        row = session.execute(
            text("SELECT state, last_updated_ts FROM states WHERE state_id = :id AND metadata_id = :mid"),
            {"id": sid, "mid": mid},
        ).first()
        if row is None:
            continue
        new = item["value"]
        if not isinstance(new, str):
            new = format_value(_finite(new, "Value"), row.state)
        else:
            _finite(new, "Value")
            new = new.strip()
        session.execute(text("UPDATE states SET state = :v WHERE state_id = :id"), {"v": new, "id": sid})
        changed.append({"id": sid, "ts": row.last_updated_ts, "old": row.state, "new": new})
    return changed


def delete_states(session: Session, entity_id: str, ids: list[int]) -> list[dict[str, Any]]:
    """Delete state rows. The newest state of an entity is protected."""
    mid = states_metadata_id(session, entity_id)
    if mid is None:
        raise CleanupError("Entity not found in the recorder.")
    newest = session.execute(
        text("SELECT state_id FROM states WHERE metadata_id = :mid ORDER BY last_updated_ts DESC LIMIT 1"),
        {"mid": mid},
    ).first()
    ids = [int(i) for i in ids]
    if newest and newest.state_id in ids:
        raise CleanupError(
            "The newest state of an entity cannot be deleted because the recorder still links to it. "
            "Change its value instead."
        )
    if not ids:
        return []
    sel = text(
        "SELECT state_id, state, last_updated_ts FROM states WHERE metadata_id = :mid AND state_id IN :ids"
    ).bindparams(bindparam("ids", expanding=True))
    rows = session.execute(sel, {"mid": mid, "ids": ids}).all()
    real = [r.state_id for r in rows]
    if not real:
        return []
    # Unlink rows that point to the deleted ones, then delete.
    for chunk_start in range(0, len(real), 500):
        chunk = real[chunk_start : chunk_start + 500]
        session.execute(
            text("UPDATE states SET old_state_id = NULL WHERE old_state_id IN :ids").bindparams(
                bindparam("ids", expanding=True)
            ),
            {"ids": chunk},
        )
        session.execute(
            text("DELETE FROM states WHERE state_id IN :ids").bindparams(bindparam("ids", expanding=True)),
            {"ids": chunk},
        )
    return [{"id": r.state_id, "ts": r.last_updated_ts, "old": r.state} for r in rows]


def update_stats(session: Session, source: str, entity_id: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Set mean/min/max of statistic rows (measurements only)."""
    table = STAT_TABLES.get(source)
    meta = statistic_meta(session, entity_id)
    if table is None or meta is None:
        raise CleanupError("No long-term statistics for this entity.")
    if meta["has_sum"]:
        raise CleanupError("Counters (sum) are corrected with an adjustment, not by editing rows.")
    changed = []
    for item in items:
        rid = int(item["id"])
        row = session.execute(
            text(f"SELECT start_ts, mean, min, max FROM {table} WHERE id = :id AND metadata_id = :mid"),
            {"id": rid, "mid": meta["id"]},
        ).first()
        if row is None:
            continue
        old = {"mean": row.mean, "min": row.min, "max": row.max}
        new = dict(old)
        for key in ("mean", "min", "max"):
            if key in item and item[key] is not None:
                new[key] = _finite(item[key], key)
        # Keep the row consistent: min <= mean <= max.
        if new["mean"] is not None:
            if new["min"] is not None and new["min"] > new["mean"]:
                new["min"] = new["mean"]
            if new["max"] is not None and new["max"] < new["mean"]:
                new["max"] = new["mean"]
        if new["min"] is not None and new["max"] is not None and new["min"] > new["max"]:
            new["min"], new["max"] = new["max"], new["min"]
        session.execute(
            text(f"UPDATE {table} SET mean = :mean, min = :min, max = :max WHERE id = :id"),
            {**new, "id": rid},
        )
        changed.append({"id": rid, "ts": row.start_ts, "old": old, "new": new})
    return changed


def delete_stats(session: Session, source: str, entity_id: str, ids: list[int]) -> list[dict[str, Any]]:
    table = STAT_TABLES.get(source)
    meta = statistic_meta(session, entity_id)
    if table is None or meta is None:
        raise CleanupError("No long-term statistics for this entity.")
    if meta["has_sum"]:
        raise CleanupError("Rows of a counter cannot be deleted. Use an adjustment instead.")
    ids = [int(i) for i in ids]
    rows = session.execute(
        text(
            f"SELECT id, start_ts, mean, min, max FROM {table} WHERE metadata_id = :mid AND id IN :ids"
        ).bindparams(bindparam("ids", expanding=True)),
        {"mid": meta["id"], "ids": ids},
    ).all()
    if rows:
        session.execute(
            text(f"DELETE FROM {table} WHERE id IN :ids").bindparams(bindparam("ids", expanding=True)),
            {"ids": [r.id for r in rows]},
        )
    return [
        {"id": r.id, "ts": r.start_ts, "old": {"mean": r.mean, "min": r.min, "max": r.max}} for r in rows
    ]


def stat_row_exists(session: Session, source: str, entity_id: str, start_ts: float) -> bool:
    table = STAT_TABLES.get(source)
    meta = statistic_meta(session, entity_id)
    if table is None or meta is None:
        return False
    row = session.execute(
        text(f"SELECT id FROM {table} WHERE metadata_id = :mid AND start_ts = :s"),
        {"mid": meta["id"], "s": start_ts},
    ).first()
    return row is not None


def recorded_ids(session: Session, entity_ids: list[str]) -> dict[str, dict[str, Any]]:
    """Which of the ids still have states / statistics, with row counts."""
    out: dict[str, dict[str, Any]] = {}
    for eid in entity_ids:
        mid = states_metadata_id(session, eid)
        n_states = 0
        if mid is not None:
            n_states = session.execute(
                text("SELECT COUNT(*) AS n FROM states WHERE metadata_id = :m"), {"m": mid}
            ).first().n
        meta = statistic_meta(session, eid)
        n_stats = 0
        if meta is not None:
            for table in ("statistics", "statistics_short_term"):
                n_stats += session.execute(
                    text(f"SELECT COUNT(*) AS n FROM {table} WHERE metadata_id = :m"), {"m": meta["id"]}
                ).first().n
        out[eid] = {"meta": mid is not None, "states": n_states, "statistics": n_stats, "stat_meta": meta is not None}
    return out


def is_finite(v: Any) -> bool:
    return isinstance(v, (int, float)) and math.isfinite(v)
