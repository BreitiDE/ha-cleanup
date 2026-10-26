"""Backup and restore of the recorder SQLite database (blocking helpers)."""

from __future__ import annotations

import gzip
import json
import os
import re
import shutil
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from .db import CleanupError

NAME_RE = re.compile(r"^[A-Za-z0-9_.\-]+\.db(\.gz)?$")
STAGED_SUFFIX = ".ha_cleanup_restore"
MARKER_SUFFIX = ".ha_cleanup_restore.json"


def backup_name(directory: Path, kind: str = "manual", prefix: str = "home-assistant_v2") -> str:
    """Unique file name; never reuses the name of an existing backup."""
    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    tag = "" if kind == "manual" else f"_{kind}"
    n = 1
    while True:
        name = f"{prefix}_{stamp}{tag}{'' if n == 1 else f'-{n}'}.db"
        if not any((directory / (name + ext)).exists() for ext in ("", ".gz", ".partial", ".gz.partial")):
            return name
        n += 1


def _check_name(name: str) -> None:
    if not NAME_RE.match(name) or "/" in name or "\\" in name or name.startswith("."):
        raise CleanupError("Invalid backup name.")


def list_backups(directory: Path) -> list[dict[str, Any]]:
    if not directory.is_dir():
        return []
    out = []
    for p in directory.iterdir():
        if not p.is_file() or not NAME_RE.match(p.name):
            continue
        st = p.stat()
        meta_path = p.with_name(p.name + ".json")
        meta: dict[str, Any] = {}
        if meta_path.is_file():
            try:
                meta = json.loads(meta_path.read_text())
            except (OSError, ValueError):
                meta = {}
        out.append(
            {
                "name": p.name,
                "size": st.st_size,
                "created": meta.get("created", st.st_mtime),
                "compressed": p.name.endswith(".gz"),
                "db_size": meta.get("db_size"),
                "note": meta.get("note", ""),
                "kind": meta.get("kind", "manual"),
                "check": meta.get("check"),
                "duration": meta.get("duration"),
            }
        )
    out.sort(key=lambda b: b["created"], reverse=True)
    return out


def disk_free(directory: Path) -> int | None:
    try:
        directory.mkdir(parents=True, exist_ok=True)
        return shutil.disk_usage(directory).free
    except OSError:
        return None


def db_size(db_path: Path) -> int:
    size = 0
    for suffix in ("", "-wal"):
        p = Path(str(db_path) + suffix)
        if p.exists():
            size += p.stat().st_size
    return size


def _remove_side_files(path: Path) -> None:
    for suffix in ("-wal", "-shm", "-journal"):
        Path(str(path) + suffix).unlink(missing_ok=True)


def _quick_check(path: Path) -> str:
    con = sqlite3.connect(str(path))
    try:
        # Older backups may still be in WAL mode; convert so no side files remain.
        con.execute("PRAGMA journal_mode=DELETE")
        res = con.execute("PRAGMA quick_check").fetchone()
        tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    finally:
        con.close()
        _remove_side_files(path)
    if "states" not in tables or "statistics" not in tables:
        raise CleanupError("The file is not a Home Assistant recorder database.")
    return res[0] if res else "unknown"


def create_backup(
    db_path: Path, directory: Path, *, compress: bool, kind: str = "manual", note: str = ""
) -> dict[str, Any]:
    """Consistent online copy using SQLite's backup API (no recorder pause needed)."""
    if not db_path.is_file():
        raise CleanupError(f"Database file not found: {db_path}")
    directory.mkdir(parents=True, exist_ok=True)
    size = db_size(db_path)
    free = disk_free(directory) or 0
    need = size * (1.6 if compress else 1.1)
    if free < need:
        raise CleanupError(
            f"Not enough free space in {directory}: {free / 1e9:.1f} GB free, about {need / 1e9:.1f} GB needed."
        )
    started = time.time()
    name = backup_name(directory, kind)
    tmp = directory / (name + ".partial")
    src = sqlite3.connect(str(db_path), timeout=60)
    dst = sqlite3.connect(str(tmp))
    try:
        src.backup(dst)  # one step: consistent snapshot while HA keeps writing (WAL)
        # Self-contained single file: no -wal/-shm side files for the copy.
        dst.execute("PRAGMA journal_mode=DELETE")
    finally:
        dst.close()
        src.close()
    try:
        check = _quick_check(tmp)
        if check != "ok":
            raise CleanupError(f"Integrity check of the copy failed: {check}")
        if compress:
            final = directory / (name + ".gz")
            gz_tmp = directory / (name + ".gz.partial")
            with open(tmp, "rb") as fin, gzip.open(gz_tmp, "wb", compresslevel=5) as fout:
                shutil.copyfileobj(fin, fout, 4 * 1024 * 1024)
            tmp.unlink()
            os.replace(gz_tmp, final)
        else:
            final = directory / name
            os.replace(tmp, final)
    except BaseException:
        for p in directory.glob(name + "*.partial"):
            p.unlink(missing_ok=True)
        raise
    meta = {
        "created": time.time(),
        "db_size": size,
        "kind": kind,
        "note": note,
        "check": check,
        "duration": round(time.time() - started, 1),
    }
    Path(str(final) + ".json").write_text(json.dumps(meta))
    return {"name": final.name, "size": final.stat().st_size, **meta}


def delete_backup(directory: Path, name: str) -> None:
    _check_name(name)
    p = directory / name
    if not p.is_file():
        raise CleanupError("Backup not found.")
    p.unlink()
    Path(str(p) + ".json").unlink(missing_ok=True)


def backup_path(directory: Path, name: str) -> Path:
    _check_name(name)
    p = directory / name
    if not p.is_file():
        raise CleanupError("Backup not found.")
    return p


def prune(directory: Path, keep: int) -> list[str]:
    """Delete the oldest automatic and manual backups beyond `keep`."""
    if keep <= 0:
        return []
    removed = []
    for b in list_backups(directory)[keep:]:
        delete_backup(directory, b["name"])
        removed.append(b["name"])
    return removed


# ------------------------------------------------------------------------ restore


def staged_path(db_path: Path) -> Path:
    return Path(str(db_path) + STAGED_SUFFIX)


def marker_path(db_path: Path) -> Path:
    return Path(str(db_path) + MARKER_SUFFIX)


def pending_restore(db_path: Path) -> dict[str, Any] | None:
    m = marker_path(db_path)
    if not m.is_file() or not staged_path(db_path).is_file():
        return None
    try:
        return json.loads(m.read_text())
    except (OSError, ValueError):
        return {"name": "?"}


def stage_restore(db_path: Path, directory: Path, name: str, user: str | None) -> dict[str, Any]:
    """Unpack the backup next to the live database and verify it.

    The actual swap happens while Home Assistant shuts down, after the
    recorder has closed the database (see apply_restore).
    """
    src = backup_path(directory, name)
    staged = staged_path(db_path)
    tmp = Path(str(staged) + ".partial")
    need = src.stat().st_size * (4 if name.endswith(".gz") else 1.1)
    free = disk_free(db_path.parent) or 0
    if free < need:
        raise CleanupError("Not enough free space next to the database to prepare the restore.")
    try:
        if name.endswith(".gz"):
            with gzip.open(src, "rb") as fin, open(tmp, "wb") as fout:
                shutil.copyfileobj(fin, fout, 4 * 1024 * 1024)
        else:
            shutil.copyfile(src, tmp)
        check = _quick_check(tmp)
        if check != "ok":
            raise CleanupError(f"The backup failed the integrity check: {check}")
        os.replace(tmp, staged)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    info = {"name": name, "staged_at": time.time(), "user": user}
    marker_path(db_path).write_text(json.dumps(info))
    return info


def cancel_restore(db_path: Path) -> None:
    staged_path(db_path).unlink(missing_ok=True)
    marker_path(db_path).unlink(missing_ok=True)


def apply_restore(db_path: Path) -> bool:
    """Swap in the staged database. Only call when the recorder is closed."""
    staged = staged_path(db_path)
    if not staged.is_file():
        return False
    os.replace(staged, db_path)
    # A leftover write-ahead log belongs to the old database and must go.
    for suffix in ("-wal", "-shm", "-journal"):
        Path(str(db_path) + suffix).unlink(missing_ok=True)
    marker_path(db_path).unlink(missing_ok=True)
    return True
