#!/usr/bin/env python3
"""WorkPulse Unified Launcher.

Starts the Spring Boot backend (with persistent SQLite database),
spawns the Python OS Information Gathering collector,
and launches the System Tray resident application in the taskbar notification area.
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
JAR_PATH = BACKEND_DIR / "target" / "workpulse-backend-0.2.0.jar"
DATA_DIR = ROOT_DIR / "data"


def check_prerequisites():
    """Verify java is installed."""
    java_cmd = shutil.which("java")
    if not java_cmd:
        print("[ERROR] Java runtime not found on PATH. Please install Java 21+.")
        sys.exit(1)


def wait_for_backend(url="http://localhost:8080/api/control/status", timeout=50):
    """Wait until Spring Boot backend is responding."""
    start = time.time()
    print("[INFO] Waiting for WorkPulse backend to initialize...")
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    print("[INFO] WorkPulse backend is healthy and ready.")
                    return True
        except Exception:
            time.sleep(1)
    return False


def main():
    parser = argparse.ArgumentParser(description="WorkPulse Unified Launcher")
    parser.add_argument("--port", type=int, default=8080, help="Backend port (default: 8080)")
    parser.add_argument(
        "--autostart",
        action="store_true",
        help="Launched by system boot (silent, no browser pop-up)",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open default browser automatically",
    )
    parser.add_argument(
        "--no-collector",
        action="store_true",
        help="Do not start Python OS collector",
    )
    parser.add_argument(
        "--no-tray",
        action="store_true",
        help="Run without taskbar system tray (console mode)",
    )
    parser.add_argument(
        "--dialog",
        action="store_true",
        help="Open status dialog immediately on launch",
    )
    args = parser.parse_args()

    check_prerequisites()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    os.chdir(ROOT_DIR)

    # 1. Start Spring Boot Backend
    if JAR_PATH.exists():
        backend_cmd = ["java", "-jar", str(JAR_PATH), f"--server.port={args.port}"]
        print(f"[INFO] Starting backend via JAR: {JAR_PATH.name}")
    else:
        mvn_cmd = "mvn.cmd" if sys.platform == "win32" else "mvn"
        backend_cmd = [
            mvn_cmd,
            "spring-boot:run",
            f"-Dspring-boot.run.arguments=--server.port={args.port}",
        ]
        print("[INFO] Starting backend via Maven spring-boot:run...")

    logs_dir = ROOT_DIR / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    backend_log = open(logs_dir / "backend.log", "w", encoding="utf-8", buffering=1)

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR if not JAR_PATH.exists() else ROOT_DIR),
        stdout=backend_log,
        stderr=subprocess.STDOUT,
    )

    collector_proc = None

    def shutdown_subprocesses():
        nonlocal collector_proc, backend_proc
        print("\n[INFO] Shutting down WorkPulse...")
        if collector_proc:
            print("[INFO] Terminating collector agent...")
            collector_proc.terminate()
            try:
                collector_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                collector_proc.kill()
            collector_proc = None

        if backend_proc:
            print("[INFO] Terminating backend server...")
            backend_proc.terminate()
            try:
                backend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_proc.kill()
            backend_proc = None
        print("[INFO] WorkPulse stopped.")

    try:
        backend_url = f"http://localhost:{args.port}"
        if not wait_for_backend(f"{backend_url}/api/control/status", timeout=50):
            print("[ERROR] Backend failed to start within timeout. See logs/backend.log.")
            shutdown_subprocesses()
            sys.exit(1)

        # 2. Launch Default Browser (unless launched silently via autostart or --no-browser)
        if not args.autostart and not args.no_browser:
            print(f"[INFO] Launching WorkPulse Dashboard in default browser at {backend_url}...")
            webbrowser.open(backend_url)

        # 3. Start Python OS Collector Agent
        if not args.no_collector:
            collector_cmd = [
                sys.executable,
                str(ROOT_DIR / "collector" / "agent.py"),
                "--api-url",
                backend_url,
            ]
            print("[INFO] Starting Python OS Information Gathering Collector...")
            collector_log = open(logs_dir / "collector.log", "w", encoding="utf-8", buffering=1)
            collector_proc = subprocess.Popen(
                collector_cmd,
                cwd=str(ROOT_DIR),
                stdout=collector_log,
                stderr=subprocess.STDOUT,
            )

        print("\n" + "=" * 60)
        print(f"  WorkPulse is running at: {backend_url}")
        print("  - Python Collector: Active (tracking active window & idle)")
        print(f"  - Database: Persistent SQLite (data/workpulse.db)")
        if not args.no_tray:
            print("  - Taskbar System Tray: Active (Taskbar hidden icons area)")
            print("    * Click tray icon to open status & quick actions dialog")
            print("    * Right-click for options (Open Dashboard, Autostart, Quit)")
        print("  Press Ctrl+C to stop all services gracefully.")
        print("=" * 60 + "\n")

        # 4. Start System Tray Resident Loop or Fallback to Console Wait
        if not args.no_tray:
            try:
                from collector.tray import WorkPulseTrayApp
                tray_app = WorkPulseTrayApp(
                    api_url=backend_url,
                    on_exit_callback=shutdown_subprocesses,
                )
                tray_app.run(show_dialog_on_start=args.dialog)
            except Exception as e:
                print(f"[WARN] Failed to start system tray ({e}). Falling back to console loop.")
                while True:
                    time.sleep(1)
        else:
            while True:
                time.sleep(1)

    except KeyboardInterrupt:
        shutdown_subprocesses()
    finally:
        shutdown_subprocesses()


if __name__ == "__main__":
    main()