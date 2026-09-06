"""Cross-platform autostart management for WorkPulse.

Supports:
- Windows: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
- Linux: ~/.config/autostart/workpulse.desktop
- macOS: ~/Library/LaunchAgents/com.workpulse.launcher.plist
"""

import logging
import os
import sys
from pathlib import Path

logger = logging.getLogger("WorkPulseAutostart")

APP_NAME = "WorkPulse"
RUN_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"


def get_default_command() -> str:
    """Construct the command line string to run WorkPulse silently on boot."""
    root_dir = Path(__file__).parent.parent.resolve()
    run_py = root_dir / "run.py"

    if sys.platform == "win32":
        # Prefer pythonw.exe to prevent console window flashing on boot
        python_exe = sys.executable
        if python_exe.lower().endswith("python.exe"):
            pythonw = Path(python_exe).parent / "pythonw.exe"
            if pythonw.exists():
                python_exe = str(pythonw)
        return f'"{python_exe}" "{run_py}" --autostart'
    else:
        return f'"{sys.executable}" "{run_py}" --autostart'


def is_autostart_enabled() -> bool:
    """Check if WorkPulse is configured to launch on system boot."""
    platform = sys.platform

    if platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY_PATH, 0, winreg.KEY_READ) as key:
                try:
                    winreg.QueryValueEx(key, APP_NAME)
                    return True
                except FileNotFoundError:
                    return False
        except Exception as e:
            logger.error(f"Failed to check Windows autostart: {e}")
            return False

    elif platform == "linux":
        desktop_file = Path.home() / ".config" / "autostart" / f"{APP_NAME.lower()}.desktop"
        return desktop_file.exists()

    elif platform == "darwin":
        plist_file = Path.home() / "Library" / "LaunchAgents" / f"com.{APP_NAME.lower()}.launcher.plist"
        return plist_file.exists()

    return False


def enable_autostart(command: str = None) -> bool:
    """Enable WorkPulse to launch on system boot."""
    cmd = command or get_default_command()
    platform = sys.platform

    if platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY_PATH, 0, winreg.KEY_SET_VALUE) as key:
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, cmd)
                logger.info(f"Registered Windows autostart: {cmd}")
                return True
        except Exception as e:
            logger.error(f"Failed to enable Windows autostart: {e}")
            return False

    elif platform == "linux":
        try:
            autostart_dir = Path.home() / ".config" / "autostart"
            autostart_dir.mkdir(parents=True, exist_ok=True)
            desktop_file = autostart_dir / f"{APP_NAME.lower()}.desktop"
            content = f"""[Desktop Entry]
Type=Application
Version=1.0
Name={APP_NAME}
Comment=Privacy-first Activity Telemetry & Productivity Platform
Exec={cmd}
Terminal=false
StartupNotify=false
Categories=Utility;
"""
            desktop_file.write_text(content, encoding="utf-8")
            logger.info(f"Created Linux autostart desktop file: {desktop_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to enable Linux autostart: {e}")
            return False

    elif platform == "darwin":
        try:
            agents_dir = Path.home() / "Library" / "LaunchAgents"
            agents_dir.mkdir(parents=True, exist_ok=True)
            plist_file = agents_dir / f"com.{APP_NAME.lower()}.launcher.plist"
            content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{APP_NAME.lower()}.launcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{str(Path(__file__).parent.parent.resolve() / "run.py")}</string>
        <string>--autostart</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
"""
            plist_file.write_text(content, encoding="utf-8")
            logger.info(f"Created macOS LaunchAgent plist: {plist_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to enable macOS autostart: {e}")
            return False

    return False


def disable_autostart() -> bool:
    """Disable WorkPulse from launching on system boot."""
    platform = sys.platform

    if platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY_PATH, 0, winreg.KEY_SET_VALUE) as key:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                    logger.info("Removed Windows autostart entry")
                    return True
                except FileNotFoundError:
                    return True
        except Exception as e:
            logger.error(f"Failed to disable Windows autostart: {e}")
            return False

    elif platform == "linux":
        try:
            desktop_file = Path.home() / ".config" / "autostart" / f"{APP_NAME.lower()}.desktop"
            if desktop_file.exists():
                desktop_file.unlink()
                logger.info(f"Removed Linux autostart desktop file: {desktop_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to disable Linux autostart: {e}")
            return False

    elif platform == "darwin":
        try:
            plist_file = Path.home() / "Library" / "LaunchAgents" / f"com.{APP_NAME.lower()}.launcher.plist"
            if plist_file.exists():
                plist_file.unlink()
                logger.info(f"Removed macOS LaunchAgent plist: {plist_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to disable macOS autostart: {e}")
            return False

    return False
