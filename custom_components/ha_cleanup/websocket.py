"""Websocket API used by the panel (admin only)."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DEFAULT_SETTINGS, DOMAIN, METHODS, SOURCES
from .db import CleanupError

_LOGGER = logging.getLogger(__name__)

Handler = Callable[[Any, dict[str, Any], str | None], Awaitable[Any]]


def _wrap(func: Handler):
    """Common error handling; passes runtime, message and user name."""

    async def handler(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        runtime = hass.data.get(DOMAIN)
        if runtime is None:
            connection.send_error(msg["id"], "not_loaded", "Home Assistant Cleanup is not loaded.")
            return
        user = connection.user.name if connection.user else None
        try:
            result = await func(runtime, msg, user)
        except CleanupError as err:
            connection.send_error(msg["id"], "cleanup_error", str(err))
            return
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("Error in %s", msg.get("type"))
            connection.send_error(msg["id"], "unknown_error", f"{type(err).__name__}: {err}")
            return
        connection.send_result(msg["id"], result)

    return handler


def _cmd(schema: dict, func: Handler):
    @websocket_api.require_admin
    @websocket_api.websocket_command(schema)
    @websocket_api.async_response
    async def _command(hass, connection, msg):
        await _wrap(func)(hass, connection, msg)

    return _command


_num = vol.Any(None, vol.Coerce(float))
_source = vol.In(SOURCES)


async def _info(rt, msg, user):
    return await rt.async_info()


async def _entities(rt, msg, user):
    return await rt.async_entities()


async def _analyze(rt, msg, user):
    return await rt.async_analyze(msg)


async def _scan(rt, msg, user):
    return {"results": await rt.async_scan(msg["entity_ids"], msg.get("days"))}


async def _update(rt, msg, user):
    return await rt.async_update(user, msg["source"], msg["entity_id"], msg["items"])


async def _delete(rt, msg, user):
    return await rt.async_delete(user, msg["source"], msg["entity_id"], msg["ids"])


async def _adjust(rt, msg, user):
    return await rt.async_adjust(user, msg["entity_id"], msg["items"])


async def _limits(rt, msg, user):
    vmin, vmax = msg.get("min"), msg.get("max")
    if vmin is not None and vmax is not None and vmin > vmax:
        raise CleanupError("Minimum must be lower than maximum.")
    await rt.store.async_set_limits(msg["entity_id"], vmin, vmax)
    return {"limits": rt.settings.get("limits", {}).get(msg["entity_id"])}


async def _settings_get(rt, msg, user):
    return {"settings": rt.settings, "defaults": DEFAULT_SETTINGS, "backup_dir": str(rt.backup_dir)}


async def _settings_set(rt, msg, user):
    changes = {k: v for k, v in msg["settings"].items() if k in DEFAULT_SETTINGS and k != "limits"}
    if "method" in changes and changes["method"] not in METHODS:
        raise CleanupError("Unknown method.")
    for key, lo, hi in (("window", 1, 50), ("max_run", 1, 50), ("days", 0.01, 3650), ("scan_days", 0.01, 365),
                        ("max_rows", 1000, 5_000_000), ("max_outliers", 10, 100_000), ("backup_keep", 0, 100)):
        if key in changes:
            try:
                val = float(changes[key])
            except (TypeError, ValueError) as err:
                raise CleanupError(f"{key} must be a number.") from err
            if not lo <= val <= hi:
                raise CleanupError(f"{key} must be between {lo} and {hi}.")
            changes[key] = int(val) if key not in ("days", "scan_days") else val
    if "threshold" in changes and changes["threshold"] not in (None, ""):
        changes["threshold"] = float(changes["threshold"])
        if changes["threshold"] <= 0:
            raise CleanupError("Threshold must be greater than 0.")
    elif "threshold" in changes:
        changes["threshold"] = None
    if "auto_scan" in changes and changes["auto_scan"] not in ("off", "daily", "weekly"):
        raise CleanupError("Automatic scan must be off, daily or weekly.")
    if "auto_scan_weekday" in changes:
        changes["auto_scan_weekday"] = int(changes["auto_scan_weekday"])
        if not 0 <= changes["auto_scan_weekday"] <= 6:
            raise CleanupError("Weekday must be 0 (Monday) to 6 (Sunday).")
    if "auto_scan_time" in changes:
        parts = str(changes["auto_scan_time"]).split(":")
        try:
            h, m = int(parts[0]), int(parts[1])
            assert 0 <= h <= 23 and 0 <= m <= 59
        except (ValueError, IndexError, AssertionError) as err:
            raise CleanupError("Time must look like 07:00.") from err
        changes["auto_scan_time"] = f"{h:02d}:{m:02d}"
    if "auto_scan_days" in changes:
        changes["auto_scan_days"] = float(changes["auto_scan_days"])
        if not 0.01 <= changes["auto_scan_days"] <= 365:
            raise CleanupError("Scan period must be between 0.01 and 365 days.")
    if changes.get("notify_service"):
        svc = str(changes["notify_service"]).strip()
        domain, _, name = svc.partition(".")
        if not name:
            domain, name = "notify", domain
        if not rt.hass.services.has_service(domain, name):
            raise CleanupError(f"Notify service {domain}.{name} does not exist.")
        changes["notify_service"] = f"{domain}.{name}"
    await rt.store.async_update_settings(changes)
    rt.async_schedule()
    await rt.store.async_add_log(action="settings", user=user, message=", ".join(sorted(changes)))
    return {"settings": rt.settings}


async def _scan_last(rt, msg, user):
    return {"scan": rt.store.last_scan, "next_scan": rt.next_scan(), "scanning": rt.scan_status()}


async def _scan_start(rt, msg, user):
    return {"scanning": rt.start_scan(user, msg.get("days"), msg.get("entity_ids"), msg.get("pattern"))}


async def _scan_stop(rt, msg, user):
    return {"stopping": rt.stop_scan()}


async def _scan_status(rt, msg, user):
    last = rt.store.last_scan
    f = rt.store.filter_scan
    return {
        "scanning": rt.scan_status(),
        "error": rt.last_scan_error,
        "last_ts": last.get("ts") if last else None,
        "filter_ts": f.get("ts") if f else None,
        "filter": f if msg.get("with_filter") else None,
    }


async def _scan_run(rt, msg, user):
    days = msg.get("days") or rt.settings.get("auto_scan_days")
    res = await rt.async_scan_all(user=user, notify=bool(msg.get("notify")), days=days, trigger="panel")
    return {"summary": res["summary"], "scan": rt.store.last_scan}


async def _scan_save(rt, msg, user):
    await rt.async_save_panel_scan(user, float(msg["days"]), msg["results"])
    return {"scan": rt.store.last_scan}


async def _notify_test(rt, msg, user):
    return await rt.async_notify(None, test=True)


async def _purge(rt, msg, user):
    return await rt.async_purge_entities(user, msg["entity_ids"], bool(msg.get("backup", True)))


async def _log_list(rt, msg, user):
    return {"entries": rt.store.log}


async def _log_clear(rt, msg, user):
    await rt.store.async_clear_log()
    return {}


async def _log_undo(rt, msg, user):
    return await rt.async_undo(user, msg["entry_id"])


async def _backups(rt, msg, user):
    return await rt.async_backups()


async def _backup_create(rt, msg, user):
    return await rt.async_create_backup(user, note=msg.get("note") or "")


async def _backup_delete(rt, msg, user):
    await rt.async_delete_backup(user, msg["name"])
    return {}


async def _backup_restore(rt, msg, user):
    restart = msg.get("restart")
    if restart is None:
        restart = bool(rt.settings.get("auto_restart_after_restore"))
    return await rt.async_restore(user, msg["name"], restart)


async def _backup_cancel(rt, msg, user):
    await rt.async_cancel_restore(user)
    return {}


COMMANDS = [
    ({vol.Required("type"): f"{DOMAIN}/info"}, _info),
    ({vol.Required("type"): f"{DOMAIN}/entities"}, _entities),
    (
        {
            vol.Required("type"): f"{DOMAIN}/analyze",
            vol.Required("entity_id"): str,
            vol.Optional("source"): _source,
            vol.Optional("method"): vol.In(METHODS),
            vol.Optional("threshold"): _num,
            vol.Optional("window"): vol.Any(None, vol.Coerce(int)),
            vol.Optional("days"): _num,
            vol.Optional("start"): _num,
            vol.Optional("end"): _num,
            vol.Optional("min"): _num,
            vol.Optional("max"): _num,
        },
        _analyze,
    ),
    (
        {
            vol.Required("type"): f"{DOMAIN}/scan",
            vol.Required("entity_ids"): [str],
            vol.Optional("days"): _num,
        },
        _scan,
    ),
    (
        {
            vol.Required("type"): f"{DOMAIN}/update",
            vol.Required("source"): _source,
            vol.Required("entity_id"): str,
            vol.Required("items"): [dict],
        },
        _update,
    ),
    (
        {
            vol.Required("type"): f"{DOMAIN}/delete",
            vol.Required("source"): _source,
            vol.Required("entity_id"): str,
            vol.Required("ids"): [vol.Coerce(int)],
        },
        _delete,
    ),
    (
        {
            vol.Required("type"): f"{DOMAIN}/adjust",
            vol.Required("entity_id"): str,
            vol.Required("items"): [dict],
        },
        _adjust,
    ),
    (
        {
            vol.Required("type"): f"{DOMAIN}/limits",
            vol.Required("entity_id"): str,
            vol.Optional("min"): _num,
            vol.Optional("max"): _num,
        },
        _limits,
    ),
    ({vol.Required("type"): f"{DOMAIN}/settings/get"}, _settings_get),
    ({vol.Required("type"): f"{DOMAIN}/settings/set", vol.Required("settings"): dict}, _settings_set),
    ({vol.Required("type"): f"{DOMAIN}/scan/last"}, _scan_last),
    (
        {vol.Required("type"): f"{DOMAIN}/scan/run", vol.Optional("notify"): bool, vol.Optional("days"): _num},
        _scan_run,
    ),
    (
        {vol.Required("type"): f"{DOMAIN}/scan/save", vol.Required("days"): vol.Coerce(float), vol.Required("results"): [dict]},
        _scan_save,
    ),
    ({vol.Required("type"): f"{DOMAIN}/notify/test"}, _notify_test),
    (
        {
            vol.Required("type"): f"{DOMAIN}/scan/start",
            vol.Optional("days"): _num,
            vol.Optional("entity_ids"): [str],
            vol.Optional("pattern"): vol.Any(None, str),
        },
        _scan_start,
    ),
    ({vol.Required("type"): f"{DOMAIN}/scan/stop"}, _scan_stop),
    ({vol.Required("type"): f"{DOMAIN}/scan/status", vol.Optional("with_filter"): bool}, _scan_status),
    (
        {vol.Required("type"): f"{DOMAIN}/orphans/purge", vol.Required("entity_ids"): [str], vol.Optional("backup"): bool},
        _purge,
    ),
    ({vol.Required("type"): f"{DOMAIN}/log/list"}, _log_list),
    ({vol.Required("type"): f"{DOMAIN}/log/clear"}, _log_clear),
    ({vol.Required("type"): f"{DOMAIN}/log/undo", vol.Required("entry_id"): str}, _log_undo),
    ({vol.Required("type"): f"{DOMAIN}/backup/list"}, _backups),
    ({vol.Required("type"): f"{DOMAIN}/backup/create", vol.Optional("note"): str}, _backup_create),
    ({vol.Required("type"): f"{DOMAIN}/backup/delete", vol.Required("name"): str}, _backup_delete),
    (
        {
            vol.Required("type"): f"{DOMAIN}/backup/restore",
            vol.Required("name"): str,
            vol.Optional("restart"): vol.Any(None, bool),
        },
        _backup_restore,
    ),
    ({vol.Required("type"): f"{DOMAIN}/backup/cancel_restore"}, _backup_cancel),
]


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    for schema, func in COMMANDS:
        websocket_api.async_register_command(hass, _cmd(schema, func))
