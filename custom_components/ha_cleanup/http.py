"""Download view for database backups."""

from __future__ import annotations

from http import HTTPStatus

from aiohttp import web

from homeassistant.components.http import KEY_HASS, KEY_HASS_USER, HomeAssistantView

from . import backup
from .const import DOMAIN
from .db import CleanupError


class BackupDownloadView(HomeAssistantView):
    """Serve a backup file (admin only, reachable via a signed path)."""

    url = "/api/ha_cleanup/backup/{name}"
    name = "api:ha_cleanup:backup"
    requires_auth = True

    async def get(self, request: web.Request, name: str) -> web.StreamResponse:
        user = request[KEY_HASS_USER]
        if not user.is_admin:
            return web.Response(status=HTTPStatus.UNAUTHORIZED)
        hass = request.app[KEY_HASS]
        runtime = hass.data.get(DOMAIN)
        if runtime is None:
            return web.Response(status=HTTPStatus.NOT_FOUND)
        try:
            path = await hass.async_add_executor_job(backup.backup_path, runtime.backup_dir, name)
        except CleanupError:
            return web.Response(status=HTTPStatus.NOT_FOUND)
        return web.FileResponse(
            path,
            headers={
                "Content-Disposition": f'attachment; filename="{path.name}"',
                "Content-Type": "application/octet-stream",
            },
        )
