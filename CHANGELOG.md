# Changelog

## 1.1.2 – 2026-10-26

### Added
- **Period selector next to “Scan all”** on the Entities page (last 24 hours, 3 days, 7 days, or everything the recorder keeps). It starts with the “Scan all” period from the settings; a choice applies until the page is reloaded or the settings are saved.

## 1.1.0 – 2026-10-26

### Added
- **Automatic scan** (daily or weekly, weekday and time selectable; default: weekly, Monday 07:00, last 7 days).
- **Notifications** with the result: Home Assistant notification (with a link to the panel) and/or any `notify.*` service, e.g. the Companion app. Option to report only outliers recorded since the previous scan, and option to notify also when nothing was found. “Scan now and notify” and “Send test notification” buttons.
- Service **`ha_cleanup.scan`** (fields `notify`, `days`; returns the result as response data) and event **`ha_cleanup_scan_finished`** for automations.
- The last scan is stored and shown again when the panel is opened.
- **Remove orphaned entities**: select entities that no longer exist and delete their history and statistics with the recorder's own functions (`recorder.purge_entities`, clear statistics). Optional safety backup first (default on).
- Log entries for scans and removed entities.

### Changed
- **Analysis and editing open in an overlay** that can be closed (✕, Esc or a click outside). The Entities page keeps only search, statistics and the entity list, so nothing is left between the top area and the list. Data source and period are chosen in the overlay header.
- The panel no longer opens the last analysed entity automatically.

## 1.0.0 – 2026-10-26
- First version: outlier detection (spike detection, IQR, z-score, plausible range) for states, hourly and 5-minute statistics; replace, edit and delete values; counter correction; scan all; database backup and restore; settings; change log with undo.
