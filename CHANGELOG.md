# Changelog

## 1.1.0 – 2026-10-26

### Added
- **Automatic scan** (daily or weekly, weekday and time selectable; default: weekly, Monday 07:00, last 7 days).
- **Notifications** with the result: Home Assistant notification (with a link to the panel) and/or any `notify.*` service, e.g. the Companion app. Option to report only outliers recorded since the previous scan, and option to notify also when nothing was found. “Scan now and notify” and “Send test notification” buttons.
- Service **`ha_cleanup.scan`** (fields `notify`, `days`; returns the result as response data) and event **`ha_cleanup_scan_finished`** for automations.
- The last scan is stored and shown again when the panel is opened.
- **Remove orphaned entities**: select entities that no longer exist and delete their history and statistics with the recorder's own functions (`recorder.purge_entities`, clear statistics). Optional safety backup first (default on).
- Log entries for scans and removed entities.

## 1.0.0 – 2026-10-26
- First version: outlier detection (spike detection, IQR, z-score, plausible range) for states, hourly and 5-minute statistics; replace, edit and delete values; counter correction; scan all; database backup and restore; settings; change log with undo.
