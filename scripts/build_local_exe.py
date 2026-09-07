"""Local Builder for WorkPulse Windows Executable (No release/push required)."""

import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"
BACKEND_DIR = ROOT_DIR / "backend"


def main():
    print("\n========================================================")
    print("  Building WorkPulse.exe Locally for Testing")
    print("========================================================\n")

    # 1. Check Backend JAR
    target_dir = BACKEND_DIR / "target"
    backend_jars = list(target_dir.glob("workpulse-backend-*.jar"))
    backend_jars = [j for j in backend_jars if not j.name.endswith(".original")]

    if not backend_jars:
        print("[INFO] Building Backend JAR with Maven...")
        res = subprocess.run(["mvn", "clean", "package", "-DskipTests"], cwd=BACKEND_DIR, shell=True)
        if res.returncode != 0:
            print("[ERROR] Maven build failed.")
            sys.exit(1)
        backend_jars = list(target_dir.glob("workpulse-backend-*.jar"))
        backend_jars = [j for j in backend_jars if not j.name.endswith(".original")]

    jar_file = backend_jars[0]
    print(f"[SUCCESS] Backend JAR found: {jar_file.name}")

    # 2. Build via PyInstaller
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    icon_path = ROOT_DIR / "assets" / "icon.ico"
    icon_arg = ["--icon", str(icon_path)] if icon_path.exists() else []

    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--noconsole",
        "--name", "WorkPulse",
        "--distpath", str(DIST_DIR / "bin"),
        "--add-data", f"{jar_file};backend/target",
        *icon_arg,
        str(ROOT_DIR / "run.py"),
    ]

    print("[INFO] Running PyInstaller...")
    res = subprocess.run(pyinstaller_cmd, cwd=ROOT_DIR)
    if res.returncode != 0:
        print("[ERROR] PyInstaller failed.")
        sys.exit(1)

    # 3. Copy WorkPulse.exe to dist/ for easy access
    exe_src = DIST_DIR / "bin" / "WorkPulse.exe"
    exe_dst = DIST_DIR / "WorkPulse.exe"
    if exe_src.exists():
        # Stop any running WorkPulse test process so the file can be cleanly replaced
        try:
            subprocess.run(["taskkill", "/F", "/IM", "WorkPulse.exe"], capture_output=True)
            import time
            time.sleep(1)
        except Exception:
            pass

        size_mb = exe_src.stat().st_size / (1024 * 1024)
        target_final = exe_dst
        try:
            shutil.copy2(exe_src, exe_dst)
        except PermissionError:
            target_final = exe_src

        print("\n========================================================")
        print(f"  [SUCCESS] Local executable ready!")
        print(f"  Location: {target_final}")
        print(f"  Size:     {size_mb:.2f} MB")
        print("  You can now test the new version 0.2.1 executable.")
        print("========================================================\n")


if __name__ == "__main__":
    main()
