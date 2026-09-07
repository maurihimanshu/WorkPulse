#!/usr/bin/env python3
"""WorkPulse Unified Launcher.

Starts the Spring Boot backend (with persistent SQLite database),
spawns the Python OS Information Gathering collector,
and launches the System Tray resident application in the taskbar notification area.
"""

import argparse
import datetime
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

_job_handle = None

def assign_process_to_job(proc_handle):
    """Ensure child Java backend process is automatically killed if launcher is terminated."""
    global _job_handle
    if sys.platform != "win32":
        return
    try:
        import ctypes
        from ctypes import wintypes
        kernel32 = ctypes.windll.kernel32
        if _job_handle is None:
            _job_handle = kernel32.CreateJobObjectW(None, None)
            if not _job_handle:
                return
            class IO_COUNTERS(ctypes.Structure):
                _fields_ = [
                    ("ReadOperationCount", ctypes.c_uint64),
                    ("WriteOperationCount", ctypes.c_uint64),
                    ("OtherOperationCount", ctypes.c_uint64),
                    ("ReadTransferCount", ctypes.c_uint64),
                    ("WriteTransferCount", ctypes.c_uint64),
                    ("OtherTransferCount", ctypes.c_uint64),
                ]
            class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
                _fields_ = [
                    ("PerProcessUserTimeLimit", ctypes.c_int64),
                    ("PerJobUserTimeLimit", ctypes.c_int64),
                    ("LimitFlags", wintypes.DWORD),
                    ("MinimumWorkingSetSize", ctypes.c_size_t),
                    ("MaximumWorkingSetSize", ctypes.c_size_t),
                    ("ActiveProcessLimit", wintypes.DWORD),
                    ("Affinity", ctypes.c_size_t),
                    ("PriorityClass", wintypes.DWORD),
                    ("SchedulingClass", wintypes.DWORD),
                ]
            class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
                _fields_ = [
                    ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                    ("IoInfo", IO_COUNTERS),
                    ("ProcessMemoryLimit", ctypes.c_size_t),
                    ("JobMemoryLimit", ctypes.c_size_t),
                    ("PeakProcessMemoryLimit", ctypes.c_size_t),
                    ("PeakJobMemoryLimit", ctypes.c_size_t),
                ]
            info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
            info.BasicLimitInformation.LimitFlags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            kernel32.SetInformationJobObject(_job_handle, 9, ctypes.byref(info), ctypes.sizeof(info))

        kernel32.AssignProcessToJobObject(_job_handle, int(proc_handle))
    except Exception as e:
        pass

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
    """Locate Java executable, prioritizing branded workpulse-runtime.exe, javaw.exe, and private bundled JRE."""
    exe_names = ["workpulse-runtime.exe", "javaw.exe", "java.exe"] if sys.platform == "win32" else ["workpulse-runtime", "java"]
    for exe_name in exe_names:
        search_paths = [
            BUNDLE_DIR / "jre" / "bin" / exe_name,
            ROOT_DIR / "jre" / "bin" / exe_name,
            ROOT_DIR / "backend" / "jre" / "bin" / exe_name,
            ROOT_DIR.parent / "jre" / "bin" / exe_name,
            # macOS .app bundle structure (Contents/PlugIns/jre/bin/java)
            ROOT_DIR.parent / "PlugIns" / "jre" / "bin" / exe_name,
            BUNDLE_DIR.parent / "PlugIns" / "jre" / "bin" / exe_name,
            # Linux system installation (/opt/workpulse/jre/bin/java)
            Path("/opt/workpulse/jre/bin") / exe_name,
        ]
        for p in search_paths:
            if p.exists() and p.is_file():
                return str(p)

    # Check JAVA_HOME environment variable
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        for exe_name in exe_names:
            cand = Path(java_home) / "bin" / exe_name
            if cand.exists() and cand.is_file():
                return str(cand)

    # Fallback to system PATH
    for exe_name in exe_names:
        sys_java = shutil.which(exe_name)
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
        # macOS .app bundle paths
        ROOT_DIR.parent / "Java",
        ROOT_DIR.parent / "Resources" / "backend" / "target",
        # Linux system installation
        Path("/opt/workpulse/backend/target"),
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


def wait_for_backend(url="http://localhost:9876/api/control/status", timeout=180, proc=None):
    """Wait until Spring Boot backend is responding."""
    start = time.time()
    last_tick = 0
    print(f"[INFO] Waiting for WorkPulse backend to initialize (timeout={timeout}s)...")
    while time.time() - start < timeout:
        if proc and proc.poll() is not None:
            print(f"[ERROR] Backend process terminated prematurely with exit code {proc.returncode}.")
            return False
        elapsed = int(time.time() - start)
        if elapsed > 0 and elapsed % 5 == 0 and elapsed != last_tick:
            last_tick = elapsed
            print(f"[INFO] Waiting for backend... ({elapsed}s elapsed)")
        try:
            with urllib.request.urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    print(f"[INFO] WorkPulse backend is healthy and ready ({elapsed}s).")
                    return True
        except Exception:
            time.sleep(1)
    return False


def acquire_instance_lock(port: int):
    lock_file = DATA_DIR / "workpulse.lock"
    try:
        if lock_file.exists():
            with open(lock_file, "r") as f:
                data = json.load(f)
            old_pid = data.get("pid")
            import psutil
            if old_pid and psutil.pid_exists(old_pid):
                print(f"[WARN] Existing WorkPulse instance detected (PID {old_pid}) on port {data.get('port', 9876)}.")
    except Exception:
        pass
    try:
        with open(lock_file, "w") as f:
            json.dump({"pid": os.getpid(), "port": port, "time": datetime.datetime.now().isoformat()}, f)
    except Exception:
        pass

def release_instance_lock():
    lock_file = DATA_DIR / "workpulse.lock"
    try:
        if lock_file.exists():
            lock_file.unlink(missing_ok=True)
    except Exception:
        pass


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
    acquire_instance_lock(args.port)

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
        backend_cmd = [
            java_bin,
            "-jar",
            str(jar_path),
            f"--server.port={args.port}",
            "--server.address=127.0.0.1",
        ]
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
                "Please make sure 'workpulse-backend-0.2.1.jar' is located in the "
                "'backend/target' folder or in the same directory as WorkPulse.exe."
            )
            show_fatal_error("WorkPulse - Missing Backend JAR", msg)
            sys.exit(1)

    backend_log = open(LOGS_DIR / "backend.log", "w", encoding="utf-8", buffering=1)
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = subprocess.CREATE_NO_WINDOW
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(backend_cwd),
        stdout=backend_log,
        stderr=subprocess.STDOUT,
        creationflags=creation_flags,
    )
    if sys.platform == "win32" and hasattr(backend_proc, "_handle"):
        assign_process_to_job(backend_proc._handle)

    collector_agent = None
    collector_thread = None
    _shutdown_done = False

    def shutdown_services():
        nonlocal collector_agent, backend_proc, _shutdown_done
        if _shutdown_done:
            return
        _shutdown_done = True
        print("\n[INFO] Shutting down WorkPulse...")
        release_instance_lock()
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
        if not wait_for_backend(f"{backend_url}/api/control/status", timeout=180, proc=backend_proc):
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