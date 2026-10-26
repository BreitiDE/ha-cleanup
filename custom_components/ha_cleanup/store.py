"""Settings and change log storage."""

from __future__ import annotations

import copy
import time
import uuid
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DEFAULT_SETTINGS,
    LOG_MAX_ENTRIES,
    STORAGE_KEY_LOG,
    STORAGE_KEY_SCAN,
    STORAGE_KEY_SETTINGS,
    STORAGE_VERSION,
)


class CleanupStore:
    """Holds settings and the change log in .storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._settings_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY_SETTINGS)
        self._log_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY_LOG)
        self.settings: dict[str, Any] = copy.deepcopy(DEFAULT_SETTINGS)
        self.log: list[dict[str, Any]] = []
        self._scan_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY_SCAN)
        self.last_scan: dict[str, Any] | None = None

    async def async_load(self) -> None:
        data = await self._settings_store.async_load()
        if isinstance(data, dict):
            for key, value in data.items():
                if key in DEFAULT_SETTINGS:
                    self.settings[key] = value
        log = await self._log_store.async_load()
        if isinstance(log, dict) and isinstance(log.get("entries"), list):
            self.log = log["entries"]
        scan = await self._scan_store.async_load()
        if isinstance(scan, dict) and isinstance(scan.get("results"), list):
            self.last_scan = scan

    async def async_save_scan(self, scan: dict[str, Any]) -> None:
        self.last_scan = scan
        await self._scan_store.async_save(scan)

    async def async_update_settings(self, changes: dict[str, Any]) -> dict[str, Any]:
        for key, value in changes.items():
            if key in DEFAULT_SETTINGS:
                self.settings[key] = value
        await self._settings_store.async_save(self.settings)
        return self.settings

    async def async_set_limits(self, entity_id: str, vmin: float | None, vmax: float | None) -> None:
        limits = dict(self.settings.get("limits") or {})
        if vmin is None and vmax is None:
            limits.pop(entity_id, None)
        else:
            limits[entity_id] = {"min": vmin, "max": vmax}
        await self.async_update_settings({"limits": limits})

    async def async_add_log(self, **entry: Any) -> dict[str, Any]:
        item = {"id": uuid.uuid4().hex, "ts": time.time(), "undone": False, **entry}
        details = item.get("details")
        if isinstance(details, list) and len(details) > 100:
            item["details_total"] = len(details)
            item["details"] = details[:100]
        self.log.insert(0, item)
        del self.log[LOG_MAX_ENTRIES:]
        self._log_store.async_delay_save(lambda: {"entries": self.log}, 1)
        return item

    async def async_mark_undone(self, entry_id: str) -> None:
        for item in self.log:
            if item["id"] == entry_id:
                item["undone"] = True
        self._log_store.async_delay_save(lambda: {"entries": self.log}, 1)

    async def async_clear_log(self) -> None:
        self.log = []
        await self._log_store.async_save({"entries": []})

    async def async_flush(self) -> None:
        await self._log_store.async_save({"entries": self.log})
