#!/usr/bin/env python3
"""WorkPulse Multi-Platform Distribution Packager.

Builds standalone release packages for:
- Windows: WorkPulse-v{version}-windows-x64.zip
- Linux:   WorkPulse-v{version}-linux-x64.tar.gz
- macOS:   WorkPulse-v{version}-macos-universal.tar.gz
Calculates SHA-256 checksums for release verification.
"""

import hashlib
import os
import shutil
import sys
import tarfile
import zipfile
from pathlib import Path

VERSION = os.environ.get("RELEASE_VERSION", "0.2.0")
if len(sys.argv) > 1 and sys.argv[1].strip():
    raw_v = sys.argv[1].strip()
    VERSION = raw_v.lstrip("v") if raw_v.startswith("v") else raw_v

APP_NAME = "WorkPulse"
ROOT_DIR = Path(__file__).parent.parent.resolve()
DIST_DIR = ROOT_DIR / "dist"


def find_backend_jar() -> Path:
    target_dir = ROOT_DIR / "backend" / "target"
    if target_dir.exists():
        jars = [
            j for j in target_dir.glob("workpulse-backend-*.jar")
            if not j.name.endswith(".original")
        ]
        if jars:
            matched = [j for j in jars if VERSION in j.name]
            return matched[0] if matched else jars[0]
    return target_dir / f"workpulse-backend-{VERSION}.jar"


BACKEND_JAR = find_backend_jar()


def calculate_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def create_windows_bundle(bundle_dir: Path):
    """Create Windows-specific launch scripts."""
    # 1. Interactive batch launcher
    bat_content = """@echo off
title WorkPulse
echo Starting WorkPulse...
python run.py %*
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to run WorkPulse. Please ensure Java 21+ and Python 3.9+ are installed.
    pause
)
"""
    (bundle_dir / "start_workpulse.bat").write_text(bat_content, encoding="utf-8")

    # 2. Silent VBS launcher (runs pythonw without opening any cmd prompt)
    vbs_content = """Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "pythonw.exe run.py --tray", 0, False
"""
    (bundle_dir / "start_workpulse_silent.vbs").write_text(vbs_content, encoding="utf-8")


def create_unix_bundle(bundle_dir: Path):
    """Create Linux / macOS launch scripts."""
    sh_content = """#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
python3 run.py "$@"
"""
    sh_file = bundle_dir / "start_workpulse.sh"
    sh_file.write_text(sh_content, encoding="utf-8")
    try:
        sh_file.chmod(0o755)
    except Exception:
        pass


def copy_common_files(target_dir: Path):
    """Copy runtime files into staging directory."""
    # 1. Copy Backend JAR
    target_backend = target_dir / "backend" / "target"
    target_backend.mkdir(parents=True, exist_ok=True)
    shutil.copy2(BACKEND_JAR, target_backend / BACKEND_JAR.name)

    # 2. Copy Python Collector
    shutil.copytree(ROOT_DIR / "collector", target_dir / "collector", dirs_exist_ok=True)

    # 3. Copy Root Runtime Files
    for file in ("run.py", "requirements.txt", "README.md", "LICENSE", "SECURITY.md"):
        src = ROOT_DIR / file
        if src.exists():
            shutil.copy2(src, target_dir / file)


def build_package(platform: str):
    """Assemble and archive package for specified platform."""
    archive_base = f"{APP_NAME}-v{VERSION}-{platform}"
    staging_dir = DIST_DIR / f"staging_{platform}"
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True, exist_ok=True)

    bundle_root = staging_dir / archive_base
    bundle_root.mkdir(parents=True, exist_ok=True)

    print(f"[INFO] Staging files for {platform}...")
    copy_common_files(bundle_root)

    if "windows" in platform:
        create_windows_bundle(bundle_root)
        zip_path = DIST_DIR / f"{archive_base}.zip"
        print(f"[INFO] Creating zip: {zip_path.name}...")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(bundle_root):
                for f in files:
                    file_path = Path(root) / f
                    arcname = file_path.relative_to(staging_dir)
                    zf.write(file_path, arcname)
        shutil.rmtree(staging_dir)
        return zip_path
    else:
        create_unix_bundle(bundle_root)
        tar_path = DIST_DIR / f"{archive_base}.tar.gz"
        print(f"[INFO] Creating tar.gz: {tar_path.name}...")
        with tarfile.open(tar_path, "w:gz") as tf:
            for root, _, files in os.walk(bundle_root):
                for f in files:
                    file_path = Path(root) / f
                    arcname = file_path.relative_to(staging_dir)
                    tf.add(file_path, arcname=str(arcname))
        shutil.rmtree(staging_dir)
        return tar_path


def main():
    if not BACKEND_JAR.exists():
        print(f"[ERROR] Backend JAR not found at {BACKEND_JAR}.")
        print("Please build it first: cd backend && mvn clean package -DskipTests")
        sys.exit(1)

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    platforms = [
        "windows-x64",
        "linux-x64",
        "macos-universal",
    ]

    checksums = []
    print(f"\n========================================================")
    print(f"  Packaging {APP_NAME} v{VERSION} for Release")
    print(f"========================================================\n")

    for p in platforms:
        pkg_path = build_package(p)
        size_mb = pkg_path.stat().st_size / (1024 * 1024)
        sha = calculate_sha256(pkg_path)
        checksums.append((pkg_path.name, f"{size_mb:.2f} MB", sha))
        print(f"  [SUCCESS] {pkg_path.name} ({size_mb:.2f} MB)")
        print(f"            SHA-256: {sha}\n")

    # Check if a standalone PyInstaller EXE was built in dist/bin/WorkPulse.exe
    exe_built = DIST_DIR / "bin" / f"{APP_NAME}.exe"
    if exe_built.exists():
        versioned_exe = DIST_DIR / f"{APP_NAME}-v{VERSION}-windows-x64.exe"
        shutil.copy2(exe_built, versioned_exe)
        size_mb = versioned_exe.stat().st_size / (1024 * 1024)
        sha = calculate_sha256(versioned_exe)
        checksums.append((versioned_exe.name, f"{size_mb:.2f} MB", sha))
        print(f"  [SUCCESS] {versioned_exe.name} ({size_mb:.2f} MB)")
        print(f"            SHA-256: {sha}\n")

    checksum_file = DIST_DIR / "SHA256SUMS.txt"
    with open(checksum_file, "w", encoding="utf-8") as f:
        for name, _, sha in checksums:
            f.write(f"{sha}  {name}\n")
    print(f"[INFO] Checksums written to {checksum_file.name}")

    print("\n" + "=" * 60)
    print("  All release packages generated in dist/:")
    for name, size, sha in checksums:
        print(f"  - {name} ({size})")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
