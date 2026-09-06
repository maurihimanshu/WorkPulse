"""Linux-specific activity monitoring."""

import logging
import os
import shutil
import subprocess
from typing import Dict, Union

from .base_monitor import BaseMonitor

logger = logging.getLogger(__name__)


class LinuxMonitor(BaseMonitor):
    """Linux implementation of platform monitoring."""

    def __init__(self) -> None:
        """Initialize Linux monitor."""
        try:
            self._check_dependencies()
        except Exception as e:
            logger.warning(f"Error initializing Linux monitor: {e}")

    def _check_dependencies(self) -> None:
        """Check if required tools are available."""
        missing = [tool for tool in ("xdotool", "xprintidle") if not shutil.which(tool)]
        if missing:
            logger.warning(f"Optional Linux tools not found: {', '.join(missing)}")

    def get_active_window_info(self) -> Dict[str, Union[str, int]]:
        """Get information about the currently active window.

        Returns:
            dict: Window information
        """
        try:
            if not shutil.which("xdotool"):
                return {
                    "app_name": "Unknown",
                    "window_title": "Unknown",
                    "process_id": 0,
                    "executable_path": "",
                }

            # Get active window ID
            window_id = (
                subprocess.check_output(
                    ["xdotool", "getactivewindow"], stderr=subprocess.DEVNULL, timeout=2
                )
                .decode()
                .strip()
            )

            # Get window title
            title = (
                subprocess.check_output(
                    ["xdotool", "getwindowname", window_id], stderr=subprocess.DEVNULL, timeout=2
                )
                .decode()
                .strip()
            )

            # Get window PID
            pid = (
                subprocess.check_output(
                    ["xdotool", "getwindowpid", window_id], stderr=subprocess.DEVNULL, timeout=2
                )
                .decode()
                .strip()
            )

            # Get executable path
            executable_path = os.path.realpath(f"/proc/{pid}/exe")
            app_name = os.path.basename(executable_path)

            return {
                "app_name": app_name,
                "window_title": title,
                "process_id": int(pid),
                "executable_path": executable_path,
            }

        except Exception as e:
            logger.debug(f"Error getting active window info: {e}")
            return {
                "app_name": "Unknown",
                "window_title": "Unknown",
                "process_id": 0,
                "executable_path": "",
            }

    def get_idle_time(self) -> float:
        """Get system idle time in seconds.

        Returns:
            float: Idle time in seconds
        """
        try:
            if not shutil.which("xprintidle"):
                return 0.0
            idle_time = (
                float(
                    subprocess.check_output(
                        ["xprintidle"], stderr=subprocess.DEVNULL, timeout=2
                    ).decode().strip()
                )
                / 1000.0
            )
            return idle_time
        except Exception as e:
            logger.debug(f"Error getting idle time: {e}")
            return 0.0

    def is_screen_locked(self) -> bool:
        """Check if screen is locked.

        Returns:
            bool: True if screen is locked, False otherwise
        """
        try:
            if shutil.which("loginctl"):
                res = subprocess.run(
                    ["loginctl", "show-session", "self", "-p", "LockedHint"],
                    capture_output=True,
                    text=True,
                    timeout=1,
                )
                if res.returncode == 0 and "LockedHint=yes" in res.stdout:
                    return True
        except Exception:
            pass
        return False

