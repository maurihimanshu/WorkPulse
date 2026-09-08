"""Unit tests for WorkPulse Autostart manager."""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from collector.autostart import (
    disable_autostart,
    enable_autostart,
    get_default_command,
    is_autostart_enabled,
)


def test_get_default_command():
    cmd = get_default_command()
    assert "run.py" in cmd
    assert "--autostart" in cmd


def test_get_default_command_frozen():
    with patch.object(sys, "frozen", True, create=True), patch.object(sys, "executable", "C:\\Program Files\\WorkPulse\\WorkPulse.exe"):
        cmd = get_default_command()
        assert cmd == '"C:\\Program Files\\WorkPulse\\WorkPulse.exe" --autostart'


def test_windows_autostart_check_and_toggle():
    with patch("sys.platform", "win32"):
        mock_winreg = MagicMock()
        with patch.dict("sys.modules", {"winreg": mock_winreg}):
            # Test query when value exists
            mock_winreg.QueryValueEx.return_value = ("python run.py --autostart", 1)
            assert is_autostart_enabled() is True

            # Test query when FileNotFoundError
            mock_winreg.QueryValueEx.side_effect = FileNotFoundError()
            assert is_autostart_enabled() is False

            # Test enable
            assert enable_autostart("test-cmd") is True
            mock_winreg.SetValueEx.assert_called_once()

            # Test disable
            assert disable_autostart() is True
            mock_winreg.DeleteValue.assert_called_once()


def test_linux_autostart(tmp_path):
    with patch("sys.platform", "linux"), patch("pathlib.Path.home", return_value=tmp_path):
        assert is_autostart_enabled() is False

        # Enable autostart
        assert enable_autostart("python3 /opt/workpulse/run.py --autostart") is True
        assert is_autostart_enabled() is True
        desktop_file = tmp_path / ".config" / "autostart" / "workpulse.desktop"
        assert desktop_file.exists()
        assert "Exec=python3 /opt/workpulse/run.py --autostart" in desktop_file.read_text(encoding="utf-8")

        # Disable autostart
        assert disable_autostart() is True
        assert is_autostart_enabled() is False
        assert not desktop_file.exists()


def test_macos_autostart(tmp_path):
    with patch("sys.platform", "darwin"), patch("pathlib.Path.home", return_value=tmp_path):
        assert is_autostart_enabled() is False

        # Enable autostart
        assert enable_autostart() is True
        assert is_autostart_enabled() is True
        plist_file = tmp_path / "Library" / "LaunchAgents" / "com.workpulse.launcher.plist"
        assert plist_file.exists()
        assert "<key>RunAtLoad</key>" in plist_file.read_text(encoding="utf-8")

        # Disable autostart
        assert disable_autostart() is True
        assert is_autostart_enabled() is False
        assert not plist_file.exists()
