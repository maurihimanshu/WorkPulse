"""macOS-specific activity monitoring."""

import logging
import os
import shutil
import subprocess
from typing import Dict, Union

from .base_monitor import BaseMonitor

logger = logging.getLogger(__name__)


class MacOSMonitor(BaseMonitor):
    """macOS implementation of platform monitoring."""

    def __init__(self) -> None:
        """Initialize macOS monitor."""
        try:
            self._check_dependencies()
        except Exception as e:
            logger.warning(f"Error initializing macOS monitor: {e}")

    def _check_dependencies(self) -> None:
        """Check if required tools are available."""
        if not shutil.which("osascript"):
            logger.warning("Optional macOS tool not found: osascript")

    def get_active_window_info(self) -> Dict[str, Union[str, int]]:
        """Get information about the currently active window.

        Returns:
            dict: Window information
        """
        try:
            if not shutil.which("osascript"):
                return {
                    "app_name": "Unknown",
                    "window_title": "Unknown",
                    "process_id": 0,
                    "executable_path": "",
                }

            # Get active application info using AppleScript
            script = """
                tell application "System Events"
                    set frontApp to first application process whose frontmost is true
                    set appName to name of frontApp
                    set appPath to path of frontApp
                    set appPID to unix id of frontApp
                    set windowTitle to ""
                    try
                        set windowTitle to name of first window of frontApp
                    end try
                    return {appName, windowTitle, appPID, appPath}
                end tell
            """

            result = (
                subprocess.check_output(
                    ["osascript", "-e", script], stderr=subprocess.DEVNULL, timeout=2
                )
                .decode()
                .strip()
            )

            # Parse result
            app_name, window_title, pid, executable_path = result.split(", ")

            return {
                "app_name": app_name,
                "window_title": window_title or "Unknown",
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
            if not shutil.which("osascript"):
                return 0.0

            # Get idle time using AppleScript
            script = """
                tell application "System Events"
                    return idle time
                end tell
            """

            idle_time = float(
                subprocess.check_output(
                    ["osascript", "-e", script], stderr=subprocess.DEVNULL, timeout=2
                )
                .decode()
                .strip()
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
            result = subprocess.run(
                [
                    "python3",
                    "-c",
                    "import Quartz; print(Quartz.CGSessionCopyCurrentDictionary().get('CGSSessionScreenIsLocked', 0))",
                ],
                capture_output=True,
                text=True,
                timeout=1,
            )
            if result.returncode == 0 and result.stdout.strip() == "1":
                return True
        except Exception:
            pass
        return False

