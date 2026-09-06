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
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

# Detect frozen PyInstaller mode
IS_FROZEN = getattr(sys, "frozen", False)
if IS_FROZEN:
    ROOT_DIR = Path(sys.executable).parent.resolve()
    BUNDLE_DIR = Path(getattr(sys, "_MEIPASS", ROOT_DIR)).resolve()
else:
    ROOT_DIR = Path(__file__).parent.resolve()
    BUNDLE_DIR = ROOT_DIR

# Ensure modules in ROOT_DIR and BUNDLE_DIR can be imported
for p in (str(ROOT_DIR), str(BUNDLE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

# Pre-import OS monitors so PyInstaller packages them statically
if sys.platform == "win32":
    try:
        import collector.os_monitors.windows_monitor  # noqa: F401
    except ImportError:
        pass
elif sys.platform == "linux":
    try:
        import collector.os_monitors.linux_monitor  # noqa: F401
    except ImportError:
        pass
elif sys.platform == "darwin":
    try:
        import collector.os_monitors.macos_monitor  # noqa: F401
    except ImportError:
        pass

BACKEND_DIR = ROOT_DIR / "backend"
DATA_DIR = ROOT_DIR / "data"
LOGS_DIR = ROOT_DIR / "logs"


def show_fatal_error(title: str, message: str):
    """Display a fatal error via console and native dialog if on Windows."""
    print(f"\n[FATAL ERROR] {title}\n{message}\n", file=sys.stderr)
    if sys.platform == "win32":
        try:
            import ctypes
            # MB_ICONERROR (0x10) | MB_OK (0x0)
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)
        except Exception:
            pass


def get_java_executable() -> str | None:
    """Locate Java executable, prioritizing private bundled JRE over system PATH."""
    exe_name = "java.exe" if sys.platform == "win32" else "java"
    search_paths = [
        BUNDLE_DIR / "jre" / "bin" / exe_name,
        ROOT_DIR / "jre" / "bin" / exe_name,
        ROOT_DIR / "backend" / "jre" / "bin" / exe_name,
        ROOT_DIR.parent / "jre" / "bin" / exe_name,
    ]
    for p in search_paths:
        if p.exists() and p.is_file():
            return str(p)

    # Check JAVA_HOME environment variable
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        cand = Path(java_home) / "bin" / exe_name
        if cand.exists() and cand.is_file():
            return str(cand)

    # Fallback to system PATH
    sys_java = shutil.which(exe_name) or shutil.which("java")
    if sys_java:
        return sys_java

    return None


def check_prerequisites():
    """Verify java runtime is available (bundled JRE or system PATH)."""
    java_bin = get_java_executable()
    if not java_bin:
        msg = (
            "Java runtime environment was not found.\n\n"
            "WorkPulse requires Java 21 or higher to run the backend.\n"
            "Please ensure the bundled 'jre/' folder is present, or install Java 21+ "
            "(e.g. from https://adoptium.net) and add it to your system PATH."
        )
        show_fatal_error("WorkPulse - Java Required", msg)
        sys.exit(1)


def find_backend_jar() -> Path | None:
    """Search for the Spring Boot backend JAR across bundle and root directories."""
    search_dirs = [
        BUNDLE_DIR / "backend" / "target",
        BUNDLE_DIR / "backend",
        BUNDLE_DIR,
        ROOT_DIR / "backend" / "target",
        ROOT_DIR / "backend",
        ROOT_DIR,
    ]
    seen = set()
    for d in search_dirs:
        try:
            resolved = d.resolve()
        except Exception:
            continue
        if resolved in seen or not resolved.is_dir():
            continue
        seen.add(resolved)
        jars = [
            j for j in resolved.glob("workpulse-backend-*.jar")
            if not j.name.endswith(".original")
        ]
        if jars:
            jars.sort(key=lambda p: p.stat().st_mtime, reverse=True)
            return jars[0]
    return None


def wait_for_backend(url="http://localhost:9876/api/control/status", timeout=50):
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
    parser.add_argument("--port", type=int, default=9876, help="Backend port (default: 9876)")
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

    # Ensure runtime data and logs directories exist in ROOT_DIR
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chdir(ROOT_DIR)
    except Exception:
        pass

    # 1. Start Spring Boot Backend
    jar_path = find_backend_jar()
    java_bin = get_java_executable()
    if jar_path and java_bin:
        backend_cmd = [java_bin, "-jar", str(jar_path), f"--server.port={args.port}"]
        backend_cwd = ROOT_DIR
        print(f"[INFO] Starting backend via JAR: {jar_path.name}")
        print(f"[INFO] Using Java runtime: {java_bin}")
    else:
        pom_file = BACKEND_DIR / "pom.xml"
        mvn_cmd = shutil.which("mvn.cmd" if sys.platform == "win32" else "mvn")
        if pom_file.exists() and mvn_cmd:
            backend_cmd = [
                mvn_cmd,
                "spring-boot:run",
                f"-Dspring-boot.run.arguments=--server.port={args.port}",
            ]
            backend_cwd = BACKEND_DIR
            print("[INFO] Starting backend via Maven spring-boot:run...")
        else:
            msg = (
                "WorkPulse backend JAR was not found.\n\n"
                "Please make sure 'workpulse-backend-0.2.0.jar' is located in the "
                "'backend/target' folder or in the same directory as WorkPulse.exe."
            )
            show_fatal_error("WorkPulse - Missing Backend JAR", msg)
            sys.exit(1)

    backend_log = open(LOGS_DIR / "backend.log", "w", encoding="utf-8", buffering=1)
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(backend_cwd),
        stdout=backend_log,
        stderr=subprocess.STDOUT,
    )

    collector_agent = None
    collector_thread = None

    def shutdown_services():
        nonlocal collector_agent, backend_proc
        print("\n[INFO] Shutting down WorkPulse...")
        if collector_agent:
            print("[INFO] Terminating collector agent...")
            try:
                collector_agent.stop()
            except Exception:
                pass
            collector_agent = None

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
            shutdown_services()
            sys.exit(1)

        # 2. Launch Default Browser (unless launched silently via autostart or --no-browser)
        if not args.autostart and not args.no_browser:
            print(f"[INFO] Launching WorkPulse Dashboard in default browser at {backend_url}...")
            webbrowser.open(backend_url)

        # 3. Start Python OS Collector Agent
        if not args.no_collector:
            try:
                from collector.agent import CollectorAgent
                collector_agent = CollectorAgent(api_url=backend_url)
                collector_thread = threading.Thread(
                    target=collector_agent.run,
                    name="WorkPulseCollectorAgentThread",
                    daemon=True,
                )
                collector_thread.start()
                print("[INFO] Python OS Information Gathering Collector started.")
            except Exception as e:
                print(f"[WARN] Failed to start collector agent: {e}")

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
                    on_exit_callback=shutdown_services,
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
        shutdown_services()
    finally:
        shutdown_services()


if __name__ == "__main__":
    main()