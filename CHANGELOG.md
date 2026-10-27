# Changelog

## 1.2.3 – 2026-10-27

### Added
- **Sortable entity list**: click the column header “Entity” (A→Z, again Z→A), “Values scanned” or “Outliers” (large → small, again small → large). A third click switches sorting off. Entities without a scan result always stay at the end. The sort order is remembered.

## 1.2.2 – 2026-10-27

### Added
- **Zoom into the time axis** of the analysis chart: drag across the chart with the mouse to zoom into a time range. The zoomed range is loaded again, so every single value is shown instead of the downsampled overview. Drag again to zoom further.
  - “Reset zoom” in the Overview header (or a double-click into the chart) shows the whole period again.
  - While zoomed, the outlier list shows only the outliers in the zoomed range; fixing or deleting values keeps the zoom.
  - The zoom is reset when the entity, data source or period changes or the overlay is closed.
- “Normal range” / “Full range” (value axis) are unchanged.

## 1.2.1 – 2026-10-27

### Added
- **New page “Ranges”** (menu between Entities and Backup) for the plausible ranges:
  - Statistics: number of ranges, ranges with min and max, values outside (last scan), clean, not scanned.
  - List with status, entity, unit, minimum, maximum, current value and the worst value outside; actions: analyze, edit, remove (with undo).
  - Search, filter (all / values outside / only one limit), page navigation and 10, 25, 50, 100 or all entries per page (remembered).
  - “Add range” dialog: search an entity, see min / max / current value of the last 7 days and a suggested range. Growing counters get only a minimum as suggestion.
- “Scan all” now also records how many values are outside each plausible range.

### Changed
- The plausible ranges table moved from Settings to the Ranges page. The fourth tile on Settings now shows the automatic scan.
- The extra menu button in the Cleanup header was removed (the Home Assistant sidebar button stays).

## 1.2.0 – 2026-10-27

### Added
- **Scan filter …** next to “Scan all”: scan a single entity or a pattern such as `sensor.*`, `*victron*` or several separated by comma (matches entity_id and name). Shows the matching entities while typing, has quick patterns and the recently used filters, and its own period (default from the settings).
  - The result is shown in the entity list with a banner (filter, number of entities, period); ✕ returns to the last full scan, “Run again” repeats the filter scan.
  - The last full scan and the “only new outliers” notifications are not changed by a filter scan.
  - If the filter matches exactly one entity, its analysis opens right after the scan.
- **The view is kept** when you leave the panel and come back, also after a reload: list filter, page, search text, scan period, the active filter scan and an open analysis overlay (entity, data source, period). Stored per browser.

### Changed
- The database box shows only the icon and the file name; the full path appears on mouse-over. The “backup” link was removed – use the Backup menu.
- “Scan all” is unchanged.

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
