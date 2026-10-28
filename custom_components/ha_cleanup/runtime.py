"""Runtime state and the operations behind the websocket API."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.recorder import get_instance, session_scope

from . import backup, db
from .analysis import parse_float
from .const import (
    DEFAULT_THRESHOLDS,
    DOMAIN,
    EVENT_SCAN_FINISHED,
    NOTIFICATION_ID,
    PANEL_URL_PATH,
    SOURCE_STATES,
    SOURCE_STATISTICS,
    SOURCE_STATISTICS_SHORT,
    VERSION,
)
from .db import CleanupError
from .store import CleanupStore

_LOGGER = logging.getLogger(__name__)

# Domains whose plain numeric state is a reading even without a unit.
NUMERIC_DOMAINS = {"sensor", "input_number", "number", "counter"}


def _sqlite_path(db_url: str) -> Path | None:
    if not db_url.startswith("sqlite://"):
        return None
    path = db_url.split("sqlite:///", 1)[-1] if "sqlite:///" in db_url else ""
    if not path or ":memory:" in path:
        return None
    return Path(path.split("?", 1)[0])


class CleanupRuntime:
    """Everything the panel talks to."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = CleanupStore(hass)
        self.recorder = get_instance(hass)
        self.db_url: str = self.recorder.db_url
        self.db_path = _sqlite_path(self.db_url)
        self.engine = (
            "sqlite"
            if self.db_path
            else "mariadb/mysql"
            if "mysql" in self.db_url
            else "postgresql"
            if "postgres" in self.db_url
            else "other"
        )
        self.busy: str | None = None  # long running backup/restore job
        self.scanning: dict[str, Any] | None = None  # progress of a server-side scan
        self.last_scan_error: str | None = None
        self._unsub_schedule: CALLBACK_TYPE | None = None
        hass.data[f"{DOMAIN}_db_path"] = self.db_path

    async def async_load(self) -> None:
        await self.store.async_load()
        self.async_schedule()

    @callback
    def async_unload(self) -> None:
        if self._unsub_schedule:
            self._unsub_schedule()
            self._unsub_schedule = None

    # --------------------------------------------------------------- schedule

    @callback
    def async_schedule(self) -> None:
        """(Re)arm the automatic scan from the settings."""
        self.async_unload()
        mode = self.settings.get("auto_scan") or "off"
        if mode == "off":
            return
        try:
            hour, minute = (int(x) for x in str(self.settings.get("auto_scan_time") or "07:00").split(":")[:2])
        except ValueError:
            hour, minute = 7, 0

        @callback
        def _fire(now: datetime) -> None:
            if mode == "weekly" and now.weekday() != int(self.settings.get("auto_scan_weekday") or 0):
                return
            self.hass.async_create_background_task(
                self.async_scan_all(user="schedule", notify=True, trigger="schedule"), f"{DOMAIN} automatic scan"
            )

        self._unsub_schedule = async_track_time_change(self.hass, _fire, hour=hour, minute=minute, second=0)

    def next_scan(self) -> float | None:
        """Timestamp of the next automatic scan (for the panel)."""
        mode = self.settings.get("auto_scan") or "off"
        if mode == "off":
            return None
        from homeassistant.util import dt as dt_util

        try:
            hour, minute = (int(x) for x in str(self.settings.get("auto_scan_time") or "07:00").split(":")[:2])
        except ValueError:
            hour, minute = 7, 0
        now = dt_util.now()
        cand = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        for _ in range(8):
            ok = cand > now and (mode == "daily" or cand.weekday() == int(self.settings.get("auto_scan_weekday") or 0))
            if ok:
                return cand.timestamp()
            cand = cand + timedelta(days=1)
        return None

    # ----------------------------------------------------------------- helpers

    @property
    def settings(self) -> dict[str, Any]:
        return self.store.settings

    @property
    def backup_dir(self) -> Path:
        custom = (self.settings.get("backup_dir") or "").strip()
        if custom:
            return Path(custom)
        return Path(self.hass.config.path("ha_cleanup", "backups"))

    async def _db(self, func, *args):
        """Run a blocking function with a session in the recorder executor."""

        def _job():
            with session_scope(hass=self.hass) as session:
                try:
                    return func(session, *args)
                except CleanupError as err:
                    # Expected user errors: roll back quietly instead of letting
                    # session_scope log a stack trace.
                    session.rollback()
                    return err

        result = await self.recorder.async_add_executor_job(_job)
        if isinstance(result, CleanupError):
            raise result
        return result

    def _threshold(self, method: str, threshold: float | None) -> float:
        if threshold is not None and threshold > 0:
            return float(threshold)
        stored = self.settings.get("threshold")
        if stored and self.settings.get("method") == method:
            return float(stored)
        return DEFAULT_THRESHOLDS.get(method, 6.0)

    # -------------------------------------------------------------------- info

    async def async_info(self) -> dict[str, Any]:
        size = None
        if self.db_path:
            size = await self.hass.async_add_executor_job(backup.db_size, self.db_path)
        counts = await self._db(db.table_counts)
        pending = None
        if self.db_path:
            pending = await self.hass.async_add_executor_job(backup.pending_restore, self.db_path)
        since = time.time() - 30 * 86400
        changes = [e for e in self.store.log if e["ts"] >= since and e.get("action") in ("edit", "delete", "adjust")]
        return {
            "version": VERSION,
            "engine": self.engine,
            "db_path": str(self.db_path) if self.db_path else None,
            "db_size": size,
            "keep_days": self.recorder.keep_days,
            "counts": counts,
            "settings": self.settings,
            "pending_restore": pending,
            "busy": self.busy,
            "changes_30d": len(changes),
            "changed_values_30d": sum(int(e.get("count") or 0) for e in changes),
            "backup_dir": str(self.backup_dir),
            "time_zone": self.hass.config.time_zone,
            "last_scan": self._scan_summary(),
            "next_scan": self.next_scan(),
            "scanning": self.scan_status(),
        }

    def _scan_summary(self) -> dict[str, Any] | None:
        scan = self.store.last_scan
        if not scan:
            return None
        res = scan.get("results") or []
        return {
            "ts": scan.get("ts"),
            "days": scan.get("days"),
            "trigger": scan.get("trigger"),
            "entities": len(res),
            "with_outliers": sum(1 for r in res if r.get("outliers")),
            "outliers": sum(int(r.get("outliers") or 0) for r in res),
            "new": sum(int(r.get("new") or 0) for r in res),
        }

    # ---------------------------------------------------------------- entities

    async def async_entities(self) -> dict[str, Any]:
        meta = await self._db(db.read_meta)
        states_meta: dict[str, int] = meta["states_meta"]
        stats: dict[str, dict] = meta["statistics"]
        registry = er.async_get(self.hass)

        items: list[dict[str, Any]] = []
        unknown: list[tuple[str, int]] = []
        for entity_id, mid in states_meta.items():
            st = self.hass.states.get(entity_id)
            reg = registry.async_get(entity_id)
            stat = stats.get(entity_id)
            unit = None
            numeric = False
            if st is not None:
                unit = st.attributes.get("unit_of_measurement")
                numeric = (
                    parse_float(st.state) is not None
                    or unit is not None
                    or "state_class" in st.attributes
                )
            if numeric and st is not None and unit is None and "state_class" not in st.attributes \
                    and entity_id.split(".", 1)[0] not in NUMERIC_DOMAINS:
                # zone.home (persons), todo lists (open items) etc. are counts, not readings
                numeric = False
            if not numeric and reg is not None and reg.unit_of_measurement:
                unit, numeric = reg.unit_of_measurement, True
            if not numeric and stat is not None:
                unit, numeric = stat["unit"], True
            if not numeric and st is None:
                unknown.append((entity_id, mid))
                continue
            if numeric:
                items.append(self._entity_item(entity_id, mid, st, reg, stat, unit))

        if unknown:
            latest = await self._db(db.latest_states, [mid for _, mid in unknown[:1000]])
            for entity_id, mid in unknown[:1000]:
                if entity_id.split(".", 1)[0] in NUMERIC_DOMAINS and any(
                parse_float(s) is not None for s in latest.get(mid, [])
            ):
                    items.append(self._entity_item(entity_id, mid, None, registry.async_get(entity_id), None, None))

        # Statistics without recorded states (external statistics, excluded entities).
        for sid, stat in stats.items():
            if sid in states_meta:
                continue
            st = self.hass.states.get(sid)
            items.append(self._entity_item(sid, None, st, registry.async_get(sid), stat, stat["unit"]))

        items.sort(key=lambda i: i["entity_id"])
        return {"entities": items}

    def _entity_item(self, entity_id, mid, st, reg, stat, unit) -> dict[str, Any]:
        name = None
        if st is not None:
            name = st.attributes.get("friendly_name")
        if not name and reg is not None:
            name = reg.name or reg.original_name
        if not name and stat is not None:
            name = stat.get("name")
        external = ":" in entity_id
        return {
            "entity_id": entity_id,
            "name": name or entity_id,
            "unit": unit,
            "domain": entity_id.split(":" if external else ".", 1)[0],
            "state": st.state if st is not None else None,
            "has_states": mid is not None,
            "statistic": (
                {"has_sum": stat["has_sum"], "has_mean": stat["has_mean"], "source": stat["source"]}
                if stat
                else None
            ),
            "state_class": st.attributes.get("state_class") if st is not None else None,
            "device_class": st.attributes.get("device_class") if st is not None else None,
            "exists": st is not None,
            "orphaned": st is None and reg is None and not external,
            "disabled": bool(reg and reg.disabled_by),
            "external": external,
            "limits": (self.settings.get("limits") or {}).get(entity_id),
        }

    # ---------------------------------------------------------------- analysis

    async def async_analyze(self, msg: dict[str, Any]) -> dict[str, Any]:
        method = msg.get("method") or self.settings["method"]
        limits = (self.settings.get("limits") or {}).get(msg["entity_id"]) or {}
        vmin = msg.get("min", limits.get("min"))
        vmax = msg.get("max", limits.get("max"))
        end = msg.get("end") or time.time() + 60
        start = msg.get("start") or end - float(msg.get("days") or self.settings["days"]) * 86400
        result = await self._db(
            lambda session: db.analyze(
                session,
                entity_id=msg["entity_id"],
                source=msg.get("source") or SOURCE_STATES,
                start=float(start),
                end=float(end),
                method=method,
                threshold=self._threshold(method, msg.get("threshold")),
                window=int(msg.get("window") or self.settings["window"]),
                vmin=vmin,
                vmax=vmax,
                max_rows=int(self.settings["max_rows"]),
                max_outliers=int(self.settings["max_outliers"]),
                max_run=int(self.settings.get("max_run") or 3),
            )
        )
        st = self.hass.states.get(msg["entity_id"])
        result["unit"] = result.get("unit") or (st.attributes.get("unit_of_measurement") if st else None)
        result["name"] = (st.attributes.get("friendly_name") if st else None) or msg["entity_id"]
        result["current"] = st.state if st else None
        result["limits"] = {"min": vmin, "max": vmax}
        result["state_class"] = st.attributes.get("state_class") if st else None
        return result

    async def async_scan(self, entity_ids: list[str], days: float | None) -> list[dict[str, Any]]:
        meta = await self._db(db.read_meta)
        sm = meta["states_meta"]
        pairs = [(e, sm[e]) for e in entity_ids if e in sm]
        end = time.time() + 60
        start = end - float(days or self.settings["scan_days"]) * 86400
        method = self.settings["method"]
        return await self._db(
            lambda session: db.scan(
                session,
                entities=pairs,
                start=start,
                end=end,
                method=method,
                threshold=self._threshold(method, None),
                window=int(self.settings["window"]),
                limits=self.settings.get("limits") or {},
                max_rows=int(self.settings["max_rows"]),
                max_run=int(self.settings.get("max_run") or 3),
            )
        )

    # ------------------------------------------------------------------ writes

    async def async_update(self, user: str | None, source: str, entity_id: str, items: list[dict]) -> dict[str, Any]:
        if source == SOURCE_STATES:
            changed = await self._db(lambda s: db.update_states(s, entity_id, items))
            undo = [{"id": c["id"], "value": c["old"]} for c in changed]
        else:
            changed = await self._db(lambda s: db.update_stats(s, source, entity_id, items))
            undo = [{"id": c["id"], **c["old"]} for c in changed]
        entry = await self.store.async_add_log(
            action="edit",
            user=user,
            entity_id=entity_id,
            source=source,
            count=len(changed),
            details=changed,
            undo={"type": "update", "source": source, "entity_id": entity_id, "items": undo} if changed else None,
        )
        return {"changed": len(changed), "log_id": entry["id"]}

    async def async_delete(self, user: str | None, source: str, entity_id: str, ids: list[int]) -> dict[str, Any]:
        if source == SOURCE_STATES:
            deleted = await self._db(lambda s: db.delete_states(s, entity_id, ids))
        else:
            deleted = await self._db(lambda s: db.delete_stats(s, source, entity_id, ids))
        entry = await self.store.async_add_log(
            action="delete", user=user, entity_id=entity_id, source=source, count=len(deleted), details=deleted
        )
        return {"deleted": len(deleted), "log_id": entry["id"]}

    async def async_adjust(self, user: str | None, entity_id: str, items: list[dict]) -> dict[str, Any]:
        """Correct a counter: shift the running sum from the given period onward."""
        meta = await self._db(lambda s: db.statistic_meta(s, entity_id))
        if meta is None or not meta["has_sum"]:
            raise CleanupError("This entity has no counter statistics.")
        unit = meta["unit"]
        done = []
        for item in items:
            amount = float(item["adjustment"])
            if amount == 0:
                continue
            start = datetime.fromtimestamp(float(item["ts"]), tz=timezone.utc)
            self.recorder.async_adjust_statistics(entity_id, start, amount, unit)
            done.append({"ts": float(item["ts"]), "adjustment": amount, "old": item.get("value")})
        await self.recorder.async_block_till_done()
        entry = await self.store.async_add_log(
            action="adjust",
            user=user,
            entity_id=entity_id,
            source=SOURCE_STATISTICS,
            count=len(done),
            details=done,
            unit=unit,
            undo={
                "type": "adjust",
                "entity_id": entity_id,
                "items": [{"ts": d["ts"], "adjustment": -d["adjustment"]} for d in done],
            }
            if done
            else None,
        )
        return {"adjusted": len(done), "log_id": entry["id"]}

    async def async_undo(self, user: str | None, entry_id: str) -> dict[str, Any]:
        entry = next((e for e in self.store.log if e["id"] == entry_id), None)
        if entry is None or not entry.get("undo"):
            raise CleanupError("This change cannot be undone.")
        if entry.get("undone"):
            raise CleanupError("This change was already undone.")
        u = entry["undo"]
        if u["type"] == "update":
            if u["source"] == SOURCE_STATES:
                res = await self._db(lambda s: db.update_states(s, u["entity_id"], u["items"]))
            else:
                res = await self._db(lambda s: db.update_stats(s, u["source"], u["entity_id"], u["items"]))
            n = len(res)
        elif u["type"] == "adjust":
            meta = await self._db(lambda s: db.statistic_meta(s, u["entity_id"]))
            for item in u["items"]:
                start = datetime.fromtimestamp(float(item["ts"]), tz=timezone.utc)
                self.recorder.async_adjust_statistics(u["entity_id"], start, float(item["adjustment"]), meta["unit"])
            await self.recorder.async_block_till_done()
            n = len(u["items"])
        else:
            raise CleanupError("Unknown undo type.")
        await self.store.async_mark_undone(entry_id)
        await self.store.async_add_log(
            action="undo", user=user, entity_id=u["entity_id"], source=u.get("source"), count=n,
            message=f"Undid change from {datetime.fromtimestamp(entry['ts']).strftime('%Y-%m-%d %H:%M:%S')}",
        )
        return {"restored": n}


    # ------------------------------------------------------------ full scan

    def scan_status(self) -> dict[str, Any] | None:
        """Progress of a running scan, without internal fields."""
        sc = self.scanning
        if not sc:
            return None
        return {k: v for k, v in sc.items() if k != "stop"}

    def start_scan(
        self, user: str | None, days: float | None, entity_ids: list[str] | None = None, pattern: str | None = None
    ) -> dict[str, Any]:
        """Start a scan as a background task in Home Assistant (keeps running when the panel is closed)."""
        if self.scanning:
            raise CleanupError("A scan is already running.")
        mode = "filter" if entity_ids is not None else "all"
        if mode == "filter" and not entity_ids:
            raise CleanupError("No entity matches the filter.")
        # Reserve the slot right away so a second click cannot start a parallel scan.
        self.scanning = {"mode": mode, "pattern": pattern, "days": days, "done": 0, "total": len(entity_ids or []),
                         "started": time.time(), "user": user, "stop": False}
        self.last_scan_error = None

        async def _run() -> None:
            try:
                await self.async_scan_all(user=user, days=days, trigger="panel", entity_ids=entity_ids,
                                          pattern=pattern, reserved=True)
            except Exception as err:  # noqa: BLE001
                _LOGGER.exception("Scan failed")
                self.last_scan_error = str(err)
                self.scanning = None
                await self.store.async_add_log(action="error", user=user, message=f"Scan failed: {err}")

        self.hass.async_create_background_task(_run(), f"{DOMAIN} {mode} scan")
        return self.scan_status()

    def stop_scan(self) -> bool:
        if not self.scanning:
            return False
        self.scanning["stop"] = True
        return True

    async def async_scan_all(
        self,
        user: str | None = None,
        notify: bool = False,
        days: float | None = None,
        trigger: str | None = None,
        entity_ids: list[str] | None = None,
        pattern: str | None = None,
        reserved: bool = False,
    ) -> dict[str, Any]:
        """Scan numeric entities on the server and store the result.

        Without ``entity_ids`` every entity is scanned and the result becomes the
        "last scan" (used by notifications). With ``entity_ids`` it is a filter
        scan that is stored separately and never replaces the last full scan.
        """
        if self.scanning and not reserved:
            raise CleanupError("A scan is already running.")
        mode = "filter" if entity_ids is not None else "all"
        if days is None or days <= 0:
            days = self.settings.get("auto_scan_days") if trigger in ("schedule", "service") else self.settings["scan_days"]
        days = float(days or 3)
        previous = self.store.last_scan
        since = previous.get("ts") if previous and mode == "all" else None
        try:
            all_ents = [e for e in (await self.async_entities())["entities"] if e["has_states"]]
        except Exception:
            self.scanning = None
            raise
        if mode == "filter":
            wanted = set(entity_ids)
            ents = [e for e in all_ents if e["entity_id"] in wanted]
        else:
            ents = all_ents
        state = self.scanning if reserved and self.scanning else {}
        state.update({"mode": mode, "pattern": pattern, "days": days, "done": 0, "total": len(ents),
                      "started": state.get("started", time.time()), "user": user, "stop": state.get("stop", False)})
        self.scanning = state
        results: list[dict[str, Any]] = []
        try:
            for i in range(0, len(ents), 20):
                if state["stop"]:
                    break
                chunk = [e["entity_id"] for e in ents[i : i + 20]]
                results += await self._scan_chunk(chunk, days, since)
                state["done"] = min(len(ents), i + 20)
        finally:
            aborted = bool(state.get("stop")) and state["done"] < len(ents)
            self.scanning = None
        units = {e["entity_id"]: e["unit"] for e in ents}
        names = {e["entity_id"]: e["name"] for e in ents}
        for r in results:
            r["unit"], r["name"] = units.get(r["entity_id"]), names.get(r["entity_id"])
        scan = {"ts": time.time(), "days": days, "since": since, "trigger": trigger or user or "panel", "results": results,
                "aborted": aborted, "scanned": len(results), "total": len(ents)}
        stopped = f" · stopped after {len(results)} of {len(ents)}" if aborted else ""
        if mode == "filter":
            scan.update({"pattern": pattern, "ids": [e["entity_id"] for e in ents]})
            await self.store.async_save_filter_scan(scan)
            out = sum(int(r.get("outliers") or 0) for r in results)
            hit = sum(1 for r in results if r.get("outliers"))
            await self.store.async_add_log(
                action="scan", user=user, count=out,
                message=f"Filter {pattern or ''}: {out} outlier(s) in {hit} of {len(ents)} entities · last {days:g} days{stopped}",
            )
            return {"summary": {"ts": scan["ts"], "days": days, "entities": len(ents), "with_outliers": hit,
                                "outliers": out, "aborted": aborted}, "results": results}
        await self.store.async_save_scan(scan)
        summary = self._scan_summary()
        summary["aborted"] = aborted
        self.hass.bus.async_fire(EVENT_SCAN_FINISHED, {k: v for k, v in summary.items() if k != "trigger"})
        await self.store.async_add_log(
            action="scan",
            user=user,
            count=summary["outliers"],
            message=f"{summary['outliers']} outlier(s) in {summary['with_outliers']} of {summary['entities']} entities"
            f" · last {days:g} days" + (f" · {summary['new']} new" if since else "") + stopped,
        )
        if notify and not aborted:
            await self.async_notify(scan, test=False)
        return {"summary": summary, "results": results}

    async def _scan_chunk(self, entity_ids: list[str], days: float, since: float | None) -> list[dict[str, Any]]:
        meta = await self._db(db.read_meta)
        sm = meta["states_meta"]
        pairs = [(e, sm[e]) for e in entity_ids if e in sm]
        end = time.time() + 60
        start = end - days * 86400
        method = self.settings["method"]
        return await self._db(
            lambda session: db.scan(
                session,
                entities=pairs,
                start=start,
                end=end,
                method=method,
                threshold=self._threshold(method, None),
                window=int(self.settings["window"]),
                limits=self.settings.get("limits") or {},
                max_rows=int(self.settings["max_rows"]),
                max_run=int(self.settings.get("max_run") or 3),
                since=since,
            )
        )

    async def async_save_panel_scan(self, user: str | None, days: float, results: list[dict[str, Any]]) -> None:
        """Keep the result of a scan that ran from the panel."""
        await self.store.async_save_scan(
            {"ts": time.time(), "days": days, "since": None, "trigger": "panel", "results": results}
        )
        s = self._scan_summary()
        await self.store.async_add_log(
            action="scan", user=user, count=s["outliers"],
            message=f"{s['outliers']} outlier(s) in {s['with_outliers']} of {s['entities']} entities · last {days:g} days",
        )

    async def async_notify(self, scan: dict[str, Any] | None, test: bool = False) -> dict[str, Any]:
        """Send the scan result as persistent notification and/or notify service."""
        scan = scan or self.store.last_scan
        if not scan:
            raise CleanupError("There is no scan result yet.")
        only_new = bool(self.settings.get("notify_only_new")) and scan.get("since") is not None
        key = "new" if only_new else "outliers"
        hits = sorted((r for r in scan["results"] if r.get(key)), key=lambda r: r.get("max_score", 0), reverse=True)
        total = sum(int(r[key]) for r in hits)
        if not hits and not test and not self.settings.get("notify_when_clean"):
            return {"sent": False, "reason": "nothing new"}
        title = "Cleanup: " + (
            f"{total} {'new ' if only_new else ''}outlier{'s' if total != 1 else ''} found" if hits else "no outliers"
        )
        lines = []
        for r in hits[:8]:
            worst = r.get("worst_value")
            unit = f" {r['unit']}" if r.get("unit") else ""
            w = f", worst {worst:g}{unit}" if isinstance(worst, (int, float)) else ""
            lines.append(f"- {r.get('name') or r['entity_id']} ({r['entity_id']}): {r[key]}{w}")
        if len(hits) > 8:
            lines.append(f"- … and {len(hits) - 8} more entities")
        period = f"last {scan.get('days', 0):g} days"
        body = (
            f"Scan of {len(scan['results'])} entities, {period}" + (" (only outliers since the previous scan)" if only_new else "") + ".\n\n"
            + ("\n".join(lines) if lines else "All values look plausible.")
        )
        sent = []
        if self.settings.get("notify_persistent", True):
            persistent_notification.async_create(
                self.hass, body + f"\n\n[Open Cleanup](/{PANEL_URL_PATH})", title=title, notification_id=NOTIFICATION_ID
            )
            sent.append("persistent_notification")
        service = (self.settings.get("notify_service") or "").strip()
        if service:
            domain, _, name = service.partition(".")
            if not name:
                domain, name = "notify", domain
            if not self.hass.services.has_service(domain, name):
                raise CleanupError(f"Notify service {domain}.{name} does not exist.")
            await self.hass.services.async_call(
                domain, name, {"title": title, "message": body.replace("\n\n", "\n")}, blocking=True
            )
            sent.append(f"{domain}.{name}")
        return {"sent": bool(sent), "targets": sent, "title": title}

    # ------------------------------------------------------- orphaned entities

    async def async_purge_entities(self, user: str | None, entity_ids: list[str], backup_first: bool) -> dict[str, Any]:
        """Remove states and statistics of entities that no longer exist."""
        registry = er.async_get(self.hass)
        blocked = [e for e in entity_ids if self.hass.states.get(e) is not None or registry.async_get(e) is not None]
        if blocked:
            raise CleanupError(
                "Only orphaned entities can be removed here. Still present: " + ", ".join(blocked[:5])
            )
        if not entity_ids:
            return {"removed": 0}
        before = await self._db(lambda s: db.recorded_ids(s, entity_ids))
        safety = None
        if backup_first and self.db_path:
            safety = await self.async_create_backup(user, note=f"before removing {len(entity_ids)} orphaned entities", kind="safety")
        with_states = [e for e, v in before.items() if v["meta"]]
        with_stats = [e for e, v in before.items() if v["stat_meta"]]
        if with_states:
            await self.hass.services.async_call(
                "recorder", "purge_entities", {"entity_id": with_states, "keep_days": 0}, blocking=True
            )
        if with_stats:
            self.recorder.async_clear_statistics(with_stats)
        # The recorder works through its queue; wait until the rows are gone.
        after = before
        for _ in range(60):
            await self.recorder.async_block_till_done()
            after = await self._db(lambda s: db.recorded_ids(s, entity_ids))
            if all(not v["states"] and not v["stat_meta"] for v in after.values()):
                break
            await asyncio.sleep(1)
        details = [
            {"entity_id": e, "states": before[e]["states"], "statistics": before[e]["statistics"],
             "left": after[e]["states"] + after[e]["statistics"]}
            for e in entity_ids
        ]
        removed = sum(1 for d in details if d["left"] == 0)
        await self.store.async_add_log(
            action="purge",
            user=user,
            count=removed,
            details=details,
            message=f"Removed {removed} orphaned entit{'y' if removed == 1 else 'ies'} "
            f"({sum(d['states'] for d in details)} states, {sum(d['statistics'] for d in details)} statistic rows)"
            + (f" · safety backup {safety['name']}" if safety else ""),
        )
        return {"removed": removed, "details": details, "safety_backup": safety["name"] if safety else None}

    # ----------------------------------------------------------------- backups

    def _require_sqlite(self) -> Path:
        if not self.db_path:
            raise CleanupError(
                f"Backups from this panel need the default SQLite database (you use {self.engine}). "
                "Use the database's own tools, e.g. mysqldump or pg_dump."
            )
        return self.db_path

    async def async_backups(self) -> dict[str, Any]:
        directory = self.backup_dir
        items = await self.hass.async_add_executor_job(backup.list_backups, directory)
        free = await self.hass.async_add_executor_job(backup.disk_free, directory)
        pending = None
        if self.db_path:
            pending = await self.hass.async_add_executor_job(backup.pending_restore, self.db_path)
        return {
            "backups": items,
            "directory": str(directory),
            "free": free,
            "supported": self.db_path is not None,
            "engine": self.engine,
            "pending_restore": pending,
            "busy": self.busy,
        }

    async def async_create_backup(self, user: str | None, note: str = "", kind: str = "manual") -> dict[str, Any]:
        db_path = self._require_sqlite()
        if self.busy:
            raise CleanupError(f"Please wait: {self.busy} is still running.")
        self.busy = "backup"
        try:
            result = await self.hass.async_add_executor_job(
                lambda: backup.create_backup(
                    db_path, self.backup_dir, compress=bool(self.settings["backup_compress"]), kind=kind, note=note
                )
            )
            removed = await self.hass.async_add_executor_job(
                backup.prune, self.backup_dir, int(self.settings.get("backup_keep") or 0)
            )
        except CleanupError as err:
            await self.store.async_add_log(action="error", user=user, message=f"Backup failed: {err}")
            raise
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("Backup failed")
            await self.store.async_add_log(action="error", user=user, message=f"Backup failed: {err}")
            raise CleanupError(f"Backup failed: {err}") from err
        finally:
            self.busy = None
        await self.store.async_add_log(
            action="backup",
            user=user,
            message=f"{result['name']} ({result['size'] / 1e6:.1f} MB, {result['duration']} s)"
            + (f", removed {len(removed)} old backup(s)" if removed else ""),
        )
        return result

    async def async_delete_backup(self, user: str | None, name: str) -> None:
        await self.hass.async_add_executor_job(backup.delete_backup, self.backup_dir, name)
        await self.store.async_add_log(action="backup_delete", user=user, message=name)

    async def async_restore(self, user: str | None, name: str, restart: bool) -> dict[str, Any]:
        db_path = self._require_sqlite()
        if self.busy:
            raise CleanupError(f"Please wait: {self.busy} is still running.")
        # Stage first: the chosen backup is unpacked and verified before the
        # safety backup runs, so pruning old backups can never remove it.
        self.busy = "restore"
        try:
            info = await self.hass.async_add_executor_job(
                backup.stage_restore, db_path, self.backup_dir, name, user
            )
        finally:
            self.busy = None
        safety = None
        if self.settings.get("backup_before_restore"):
            try:
                safety = await self.async_create_backup(user, note=f"before restoring {name}", kind="safety")
            except CleanupError:
                await self.hass.async_add_executor_job(backup.cancel_restore, db_path)
                raise
        await self.store.async_add_log(
            action="restore",
            user=user,
            message=f"{name} prepared, applied on the next restart"
            + (f" (safety backup {safety['name']})" if safety else ""),
        )
        await self.store.async_flush()
        if restart:
            self.hass.async_create_task(
                self.hass.services.async_call("homeassistant", "restart", blocking=False)
            )
        return {"pending": info, "safety_backup": safety["name"] if safety else None, "restarting": restart}

    async def async_cancel_restore(self, user: str | None) -> None:
        db_path = self._require_sqlite()
        await self.hass.async_add_executor_job(backup.cancel_restore, db_path)
        await self.store.async_add_log(action="restore", user=user, message="Pending restore cancelled")
