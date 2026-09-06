"""Unit tests for WorkPulse Core OS Information Gathering Collector."""

import pytest
import datetime
from unittest.mock import MagicMock, patch
from collector.agent import CollectorAgent
from collector.os_monitors.platform_monitor import create_platform_monitor
from collector.os_monitors.base_monitor import BaseMonitor


def test_create_platform_monitor():
    monitor = create_platform_monitor()
    assert isinstance(monitor, BaseMonitor)


def test_create_linux_monitor():
    with patch("sys.platform", "linux"):
        from collector.os_monitors.linux_monitor import LinuxMonitor
        monitor = create_platform_monitor()
        assert isinstance(monitor, LinuxMonitor)
        info = monitor.get_active_window_info()
        assert isinstance(info, dict)
        assert "app_name" in info
        assert isinstance(monitor.get_idle_time(), (int, float))
        assert isinstance(monitor.is_screen_locked(), bool)


def test_create_macos_monitor():
    with patch("sys.platform", "darwin"):
        from collector.os_monitors.macos_monitor import MacOSMonitor
        monitor = create_platform_monitor()
        assert isinstance(monitor, MacOSMonitor)
        info = monitor.get_active_window_info()
        assert isinstance(info, dict)
        assert "app_name" in info
        assert isinstance(monitor.get_idle_time(), (int, float))
        assert isinstance(monitor.is_screen_locked(), bool)


def test_collector_agent_initialization():
    agent = CollectorAgent(api_url="http://localhost:9876", idle_threshold=60.0, poll_interval=1.0)
    assert agent.api_url == "http://localhost:9876"
    assert agent.idle_threshold == 60.0
    assert agent.poll_interval == 1.0
    assert agent.current_app == "Unknown"
    assert agent.is_idle is False


def test_collector_outbox_buffering():
    agent = CollectorAgent(api_url="http://localhost:9999", idle_threshold=60.0)
    # Mock _post_json to simulate failure (offline backend)
    agent._post_json = MagicMock(return_value=False)
    agent.current_app = "test.exe"
    agent.current_title = "Test App"
    agent.session_active_seconds = 120.0
    agent.session_idle_seconds = 10.0

    agent._close_current_activity()
    assert len(agent.outbox) == 1
    assert agent.outbox[0]["appName"] == "test.exe"
    assert agent.outbox[0]["activeTime"] == 120.0


def test_collector_outbox_flushing():
    agent = CollectorAgent(api_url="http://localhost:9876")
    agent.outbox = [{"appName": "code.exe", "activeTime": 50.0}]
    # Mock _post_json to simulate success
    agent._post_json = MagicMock(return_value=True)

    agent._flush_outbox()
    assert len(agent.outbox) == 0