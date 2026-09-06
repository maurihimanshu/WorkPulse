"""Unit tests for WorkPulse System Tray & Status Dialog."""

from unittest.mock import MagicMock, patch
from collector.tray import create_tray_icon_image, WorkPulseTrayApp


def test_create_tray_icon_image():
    img = create_tray_icon_image(64, 64)
    assert img.size == (64, 64)
    assert img.mode == "RGBA"


def test_tray_app_initialization():
    exit_mock = MagicMock()
    app = WorkPulseTrayApp(api_url="http://localhost:9876", on_exit_callback=exit_mock)
    assert app.api_url == "http://localhost:9876"
    assert app.is_monitoring is True
    assert app._running is True


def test_tray_app_get_backend_status_fallback():
    app = WorkPulseTrayApp(api_url="http://localhost:99999")
    status = app.get_backend_status()
    assert status["status"] == "OFFLINE"
    assert "currentApp" in status
    assert "isMonitoring" in status
