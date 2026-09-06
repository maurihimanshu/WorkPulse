# WorkPulse OS Information Gathering Agent
import argparse
import datetime
import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

CURRENT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = CURRENT_DIR.parent.resolve()
for p in (str(CURRENT_DIR), str(PROJECT_ROOT)):
    if p not in sys.path:
        sys.path.insert(0, p)

from collector.os_monitors.platform_monitor import create_platform_monitor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('WorkPulseCollector')

class CollectorAgent:
    def __init__(self, api_url='http://localhost:9876', idle_threshold=60.0, poll_interval=1.0):
        self.api_url = api_url.rstrip('/')
        self.idle_threshold = idle_threshold
        self.poll_interval = poll_interval
        self.monitor = create_platform_monitor()
        self.running = False
        self.current_app = 'Unknown'
        self.current_title = 'Unknown'
        self.current_exe = ''
        self.current_pid = 0
        self.session_start = datetime.datetime.now()
        self.last_tick = datetime.datetime.now()
        self.session_active_seconds = 0.0
        self.session_idle_seconds = 0.0
        self.is_idle = False
        self.outbox = []
        self.last_heartbeat = 0.0

    def _post_json(self, endpoint: str, payload: dict) -> bool:
        url = f'{self.api_url}{endpoint}'
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                return resp.status in (200, 201, 204)
        except Exception:
            return False

    def _flush_outbox(self):
        if not self.outbox:
            return
        remaining = []
        for item in self.outbox:
            if not self._post_json('/api/ingest/activity', item):
                remaining.append(item)
        self.outbox = remaining[:500]

    def _close_current_activity(self):
        if self.session_active_seconds < 0.5 and self.session_idle_seconds < 0.5:
            return
        now = datetime.datetime.now()
        activity_data = {
            'appName': self.current_app or 'Unknown',
            'windowTitle': self.current_title or 'Unknown',
            'processId': self.current_pid or 0,
            'executablePath': self.current_exe or '',
            'startTime': self.session_start.isoformat(),
            'endTime': now.isoformat(),
            'activeTime': round(self.session_active_seconds, 2),
            'idleTime': round(self.session_idle_seconds, 2),
            'category': 'Uncategorized'
        }
        logger.info(f'Logged session: [{activity_data["appName"]}] active={activity_data["activeTime"]}s, idle={activity_data["idleTime"]}s')
        if not self._post_json('/api/ingest/activity', activity_data):
            self.outbox.append(activity_data)

    def _send_heartbeat(self, idle_seconds: float):
        now = time.time()
        if now - self.last_heartbeat < 1.5:
            return
        self.last_heartbeat = now
        heartbeat_data = {
            'appName': self.current_app,
            'windowTitle': self.current_title,
            'processId': self.current_pid,
            'executablePath': self.current_exe,
            'idleSeconds': round(idle_seconds, 1),
            'isIdle': self.is_idle,
            'currentSessionActiveSeconds': round(self.session_active_seconds, 1),
            'isMonitoring': True,
            'timestamp': datetime.datetime.now().isoformat()
        }
        self._post_json('/api/ingest/heartbeat', heartbeat_data)

    def run(self):
        logger.info(f'WorkPulse Collector started. Target: {self.api_url}')
        self.running = True
        self.session_start = datetime.datetime.now()
        self.last_tick = datetime.datetime.now()
        try:
            while self.running:
                loop_start = time.time()
                now = datetime.datetime.now()
                delta = (now - self.last_tick).total_seconds()
                self.last_tick = now

                idle_sec = self.monitor.get_idle_time()
                locked = self.monitor.is_screen_locked()
                system_is_idle = (idle_sec >= self.idle_threshold) or locked

                window_info = self.monitor.get_active_window_info()
                if isinstance(window_info, dict):
                    title = window_info.get('window_title', 'Unknown')
                    app = window_info.get('app_name', 'Unknown')
                    pid = window_info.get('process_id', 0)
                    exe = window_info.get('executable_path', '')
                elif isinstance(window_info, tuple):
                    if len(window_info) >= 4:
                        title, app, pid, exe = window_info[:4]
                    elif len(window_info) == 2:
                        title, app = window_info
                        pid, exe = 0, ''
                    else:
                        title, app, pid, exe = 'Unknown', 'Unknown', 0, ''
                else:
                    title, app, pid, exe = 'Unknown', 'Unknown', 0, ''

                title = title or 'Unknown'
                app = app or 'Unknown'

                app_changed = (app.lower() != self.current_app.lower()) or (title != self.current_title)
                idle_changed = (system_is_idle != self.is_idle)

                if app_changed or (idle_changed and system_is_idle):
                    self._close_current_activity()
                    self.current_app = app
                    self.current_title = title
                    self.current_pid = pid or 0
                    self.current_exe = exe or ''
                    self.session_start = now
                    self.session_active_seconds = 0.0
                    self.session_idle_seconds = 0.0
                    self.is_idle = system_is_idle

                if system_is_idle:
                    self.session_idle_seconds += delta
                    self.is_idle = True
                else:
                    self.session_active_seconds += delta
                    self.is_idle = False

                self._flush_outbox()
                self._send_heartbeat(idle_sec)

                elapsed = time.time() - loop_start
                sleep_time = max(0.1, self.poll_interval - elapsed)
                time.sleep(sleep_time)
        except KeyboardInterrupt:
            logger.info('Stopping collector...')
        finally:
            self._close_current_activity()
            self._flush_outbox()
            logger.info('Collector stopped.')

    def stop(self):
        self.running = False

def main():
    parser = argparse.ArgumentParser(description='WorkPulse OS Collector')
    parser.add_argument('--api-url', default='http://localhost:9876')
    parser.add_argument('--idle-threshold', type=float, default=60.0)
    parser.add_argument('--poll-interval', type=float, default=1.0)
    args = parser.parse_args()
    agent = CollectorAgent(args.api_url, args.idle_threshold, args.poll_interval)
    agent.run()

if __name__ == '__main__':
    main()