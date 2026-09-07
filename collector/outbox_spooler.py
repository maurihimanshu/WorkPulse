"""WorkPulse Persistent Outbox Spooler.

Guarantees zero data loss across restarts and network disconnects by persisting
unsent telemetry items to a local SQLite database (.outbox.db) and dispatching
them asynchronously in the background.
"""

import json
import logging
import sqlite3
import threading
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("WorkPulseOutbox")


class OutboxSpooler:
    """Asynchronous, SQLite-backed reliable telemetry dispatcher."""

    def __init__(self, db_path: Path, api_url: str):
        self.db_path = db_path
        self.api_url = api_url.rstrip("/")
        self.running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_path), timeout=5.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_db(self):
        with self._lock:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS outbox (
                        id TEXT PRIMARY KEY,
                        endpoint TEXT NOT NULL,
                        payload TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        retry_count INTEGER DEFAULT 0
                    )
                    """
                )
                conn.execute("CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at);")

    def enqueue(self, endpoint: str, payload: Dict[str, Any]):
        """Persist item to .outbox.db for asynchronous delivery."""
        item_id = str(uuid.uuid4())
        payload_str = json.dumps(payload)
        with self._lock:
            try:
                with self._get_connection() as conn:
                    conn.execute(
                        "INSERT INTO outbox (id, endpoint, payload) VALUES (?, ?, ?)",
                        (item_id, endpoint, payload_str),
                    )
            except Exception as e:
                logger.error(f"Failed to persist outbox record: {e}")

    def _post_json(self, endpoint: str, payload_str: str) -> bool:
        url = f"{self.api_url}{endpoint}"
        data = payload_str.encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                return resp.status in (200, 201, 204)
        except Exception:
            return False

    def _drain_batch(self, limit: int = 50) -> int:
        """Fetch oldest items, attempt delivery, and remove successful ones."""
        items = []
        with self._lock:
            try:
                with self._get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT id, endpoint, payload, retry_count FROM outbox ORDER BY created_at ASC LIMIT ?",
                        (limit,),
                    )
                    items = cursor.fetchall()
            except Exception as e:
                logger.debug(f"Outbox read error: {e}")
                return 0

        if not items:
            return 0

        success_ids = []
        failed = False

        for item_id, endpoint, payload_str, retry_count in items:
            if self._post_json(endpoint, payload_str):
                success_ids.append(item_id)
            else:
                failed = True
                with self._lock:
                    try:
                        with self._get_connection() as conn:
                            conn.execute(
                                "UPDATE outbox SET retry_count = retry_count + 1 WHERE id = ?",
                                (item_id,),
                            )
                    except Exception:
                        pass
                # Stop processing batch if connection is currently failing
                break

        if success_ids:
            with self._lock:
                try:
                    with self._get_connection() as conn:
                        placeholders = ",".join("?" for _ in success_ids)
                        conn.execute(f"DELETE FROM outbox WHERE id IN ({placeholders})", success_ids)
                except Exception as e:
                    logger.debug(f"Outbox delete error: {e}")

        return len(success_ids) if not failed else -1

    def _worker_loop(self):
        backoff = 1.0
        while self.running:
            result = self._drain_batch()
            if result > 0:
                backoff = 1.0
                time.sleep(0.05)
            elif result == 0:
                time.sleep(0.5)
            else:
                # Delivery failed, apply exponential backoff (up to 8s)
                time.sleep(backoff)
                backoff = min(8.0, backoff * 1.5)

    def start(self):
        if not self.running:
            self.running = True
            self._thread = threading.Thread(target=self._worker_loop, name="WorkPulseOutboxSpooler", daemon=True)
            self._thread.start()
            logger.info("Outbox spooler worker started.")

    def stop(self):
        self.running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
            logger.info("Outbox spooler worker stopped.")
