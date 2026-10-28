"""Constants for Home Assistant Cleanup."""

from __future__ import annotations

DOMAIN = "ha_cleanup"
NAME = "Home Assistant Cleanup"
VERSION = "1.2.4"

PANEL_URL_PATH = "ha-cleanup"
PANEL_TITLE = "Cleanup"
PANEL_ICON = "mdi:broom"
PANEL_COMPONENT = "ha-cleanup-panel"
STATIC_URL = "/ha_cleanup_static"

STORAGE_VERSION = 1
STORAGE_KEY_SETTINGS = f"{DOMAIN}.settings"
STORAGE_KEY_LOG = f"{DOMAIN}.log"
STORAGE_KEY_SCAN = f"{DOMAIN}.scan"
STORAGE_KEY_FILTER_SCAN = f"{DOMAIN}.filter_scan"

EVENT_SCAN_FINISHED = f"{DOMAIN}_scan_finished"
NOTIFICATION_ID = f"{DOMAIN}_scan"
SERVICE_SCAN = "scan"

LOG_MAX_ENTRIES = 1000

SOURCE_STATES = "states"
SOURCE_STATISTICS = "statistics"
SOURCE_STATISTICS_SHORT = "statistics_short_term"
SOURCES = (SOURCE_STATES, SOURCE_STATISTICS, SOURCE_STATISTICS_SHORT)

METHOD_SPIKE = "spike"  # Hampel filter: rolling median + MAD
METHOD_IQR = "iqr"
METHOD_ZSCORE = "zscore"
METHOD_RANGE = "range"  # only the plausible min/max range
METHODS = (METHOD_SPIKE, METHOD_IQR, METHOD_ZSCORE, METHOD_RANGE)

DEFAULT_THRESHOLDS = {
    METHOD_SPIKE: 6.0,
    METHOD_IQR: 3.0,
    METHOD_ZSCORE: 4.0,
    METHOD_RANGE: 0.0,
}

DEFAULT_SETTINGS: dict = {
    "method": METHOD_SPIKE,
    "threshold": None,  # None -> DEFAULT_THRESHOLDS[method]
    "window": 5,  # neighbours on each side for the spike filter
    "max_run": 3,  # longer runs of deviating values are real events, not spikes
    "days": 7,
    "scan_days": 3,
    "max_rows": 250_000,
    "max_outliers": 2_000,
    "backup_dir": "",  # empty -> <config>/ha_cleanup/backups
    "backup_compress": True,
    "backup_keep": 5,
    "backup_before_restore": True,
    "auto_restart_after_restore": True,
    "auto_scan": "weekly",  # off | daily | weekly
    "auto_scan_weekday": 0,  # 0 = Monday
    "auto_scan_time": "07:00",
    "auto_scan_days": 7,  # period checked by the automatic scan
    "notify_persistent": True,  # notification in the HA sidebar
    "notify_service": "",  # e.g. notify.mobile_app_iphone
    "notify_only_new": True,  # only notify about outliers newer than the last scan
    "notify_when_clean": False,
    "backup_before_purge": True,
    "limits": {},  # entity_id -> {"min": float|None, "max": float|None}
}

UNAVAILABLE_STATES = {"unknown", "unavailable", "none", "", "nan", "inf", "-inf"}
