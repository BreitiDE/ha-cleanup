"""Home Assistant Cleanup: find and fix outliers in recorder data."""

from __future__ import annotations

import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_CLOSE
from homeassistant.core import Event, HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from . import backup
from .const import (
    DOMAIN,
    PANEL_COMPONENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    SERVICE_SCAN,
    STATIC_URL,
    VERSION,
)
from .db import CleanupError
from .http import BackupDownloadView
from .runtime import CleanupRuntime
from .websocket import async_register_websocket

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register things that can only be registered once per run."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the panel, API and pending-restore hook."""
    runtime = CleanupRuntime(hass)
    await runtime.async_load()
    hass.data[DOMAIN] = runtime

    if not hass.data.get(f"{DOMAIN}_registered"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), False)]
        )
        hass.http.register_view(BackupDownloadView())
        async_register_websocket(hass)

        async def _apply_pending_restore(_event: Event) -> None:
            # EVENT_HOMEASSISTANT_CLOSE fires after the recorder has finished its
            # final write and closed the database, so the file can be swapped.
            db_path = hass.data.get(f"{DOMAIN}_db_path")
            if db_path is None:
                return
            try:
                if await hass.async_add_executor_job(backup.apply_restore, db_path):
                    _LOGGER.warning("Recorder database restored from backup; it is used after the restart")
            except OSError as err:
                _LOGGER.error("Restoring the recorder database failed: %s", err)

        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_CLOSE, _apply_pending_restore)

        async def _service_scan(call: ServiceCall) -> ServiceResponse:
            rt: CleanupRuntime | None = hass.data.get(DOMAIN)
            if rt is None:
                raise HomeAssistantError("Home Assistant Cleanup is not loaded")
            try:
                res = await rt.async_scan_all(
                    user="service", notify=call.data.get("notify", True), days=call.data.get("days"), trigger="service"
                )
            except CleanupError as err:
                raise HomeAssistantError(str(err)) from err
            return {
                "summary": res["summary"],
                "entities": [
                    {k: r.get(k) for k in ("entity_id", "outliers", "new", "worst_value", "worst_ts")}
                    for r in res["results"]
                    if r.get("outliers")
                ],
            }

        hass.services.async_register(
            DOMAIN,
            SERVICE_SCAN,
            _service_scan,
            schema=vol.Schema(
                {
                    vol.Optional("notify", default=True): cv.boolean,
                    vol.Optional("days"): vol.All(vol.Coerce(float), vol.Range(min=0.01, max=365)),
                }
            ),
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.data[f"{DOMAIN}_registered"] = True

    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{STATIC_URL}/ha-cleanup-panel.js?v={VERSION}",
        embed_iframe=False,
        require_admin=True,
        config={"version": VERSION},
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    runtime: CleanupRuntime | None = hass.data.pop(DOMAIN, None)
    if runtime:
        runtime.async_unload()
        await runtime.store.async_flush()
    return True
