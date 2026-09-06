#!/usr/bin/env python3
"""WorkPulse Multi-Platform Distribution Packager.

Builds self-contained, zero-dependency release packages for:
- Windows: WorkPulse-v{version}-windows-x64.zip (includes WorkPulse.exe + bundled JRE 21)
- Linux:   WorkPulse-v{version}-linux-x64.tar.gz
- macOS:   WorkPulse-v{version}-macos-universal.tar.gz
Calculates SHA-256 checksums for release verification.
"""

import hashlib
import os
import shutil
import subprocess
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


def find_or_build_jre(target_jre_dir: Path) -> bool:
    """Ensure a minimal, self-contained private JRE exists at target_jre_dir."""
    java_exe = "java.exe" if sys.platform == "win32" else "java"
    if (target_jre_dir / "bin" / java_exe).exists():
        return True

    # 1. Check if cached / prebuilt JRE exists in dist/jre or dist/test_jre
    for candidate in [DIST_DIR / "jre", DIST_DIR / "test_jre"]:
        if (candidate / "bin" / java_exe).exists():
            print(f"[INFO] Bundling private JRE from {candidate.name} into package...")
            shutil.copytree(candidate, target_jre_dir, dirs_exist_ok=True)
            javaw_src = target_jre_dir / "bin" / "javaw.exe"
            runtime_dst = target_jre_dir / "bin" / "workpulse-runtime.exe"
            if javaw_src.exists() and not runtime_dst.exists():
                shutil.copy2(javaw_src, runtime_dst)
            return True

    # 2. Attempt to generate via jlink
    jlink_name = "jlink.exe" if sys.platform == "win32" else "jlink"
    jlink_candidates = [
        Path(os.environ.get("JAVA_HOME", "")) / "bin" / jlink_name,
        Path(r"C:\Program Files\Java\jdk-21.0.11\bin\jlink.exe"),
        Path(shutil.which(jlink_name) or ""),
    ]
    jlink_bin = None
    for jc in jlink_candidates:
        if jc and jc.exists() and jc.is_file():
            jlink_bin = str(jc)
            break

    if not jlink_bin:
        print("[WARN] jlink executable not found. Proceeding without embedded JRE.")
        return False

    modules = [
        "java.base", "java.compiler", "java.desktop", "java.instrument",
        "java.management", "java.naming", "java.net.http", "java.prefs",
        "java.rmi", "java.scripting", "java.security.jgss", "java.security.sasl",
        "java.sql", "java.sql.rowset", "java.transaction.xa", "java.xml",
        "jdk.crypto.ec", "jdk.httpserver", "jdk.unsupported", "jdk.management",
    ]
    cmd = [
        jlink_bin,
        "--no-header-files",
        "--no-man-pages",
        "--strip-debug",
        "--add-modules", ",".join(modules),
        "--output", str(target_jre_dir),
    ]
    print(f"[INFO] Generating minimal private Java 21 runtime via jlink...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and (target_jre_dir / "bin" / java_exe).exists():
        print("[INFO] Embedded private JRE successfully created.")
        # Ensure branded workpulse-runtime.exe exists for windowless, clean process identification
        javaw_src = target_jre_dir / "bin" / "javaw.exe"
        runtime_dst = target_jre_dir / "bin" / "workpulse-runtime.exe"
        if javaw_src.exists() and not runtime_dst.exists():
            shutil.copy2(javaw_src, runtime_dst)
        return True
    else:
        print(f"[WARN] jlink failed: {res.stderr.strip() or res.stdout.strip()}")
        return False


def compile_inno_setup(version: str) -> Path | None:
    """Compile Inno Setup script into an enterprise Windows Setup installer."""
    iss_file = ROOT_DIR / "installer" / "WorkPulse.iss"
    if not iss_file.exists():
        return None

    iscc_candidates = [
        Path(r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"),
        Path(r"C:\Program Files\Inno Setup 6\ISCC.exe"),
        Path(shutil.which("ISCC.exe") or shutil.which("iscc") or ""),
    ]
    iscc_bin = None
    for cand in iscc_candidates:
        if cand and cand.exists() and cand.is_file():
            iscc_bin = str(cand)
            break

    if not iscc_bin:
        print("[INFO] Inno Setup compiler (ISCC.exe) not found. Skipping installer generation.")
        return None

    cmd = [
        iscc_bin,
        f"/DAppVersion={version}",
        str(iss_file),
    ]
    print(f"[INFO] Compiling Windows Enterprise Setup Installer with Inno Setup...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    installer_path = DIST_DIR / f"{APP_NAME}-v{version}-windows-x64-Setup.exe"
    if installer_path.exists():
        print(f"[SUCCESS] Inno Setup installer generated: {installer_path.name}")
        return installer_path
    else:
        print(f"[WARN] Inno Setup output not found ({res.stderr.strip() or res.stdout.strip()})")
        return None


def create_windows_bundle(bundle_dir: Path):
    """Create Windows-specific launch scripts."""
    # 1. Interactive batch launcher (launches WorkPulse.exe directly detached)
    bat_content = """@echo off
title WorkPulse
if exist "%~dp0WorkPulse.exe" (
    start "" "%~dp0WorkPulse.exe" %*
    exit /b 0
)
if exist "%~dp0jre\\bin\\javaw.exe" (
    set "PATH=%~dp0jre\\bin;%PATH%"
)
python run.py %*
if errorlevel 1 (
    echo [ERROR] Failed to run WorkPulse.
    pause
)
"""
    (bundle_dir / "start_workpulse.bat").write_text(bat_content, encoding="utf-8")

    # 2. Silent VBS launcher (runs without opening any cmd prompt)
    vbs_content = """Set WshShell = CreateObject("WScript.Shell")
If CreateObject("Scripting.FileSystemObject").FileExists("WorkPulse.exe") Then
    WshShell.Run "WorkPulse.exe --tray", 0, False
Else
    WshShell.Run "pythonw.exe run.py --tray", 0, False
End If
"""
    (bundle_dir / "start_workpulse_silent.vbs").write_text(vbs_content, encoding="utf-8")


def create_unix_bundle(bundle_dir: Path):
    """Create Linux / macOS launch scripts."""
    sh_content = """#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Prioritize bundled JRE if present
if [ -d "$DIR/jre/bin" ]; then
    export PATH="$DIR/jre/bin:$PATH"
fi

if [ -f "$DIR/WorkPulse" ]; then
    exec "$DIR/WorkPulse" "$@"
else
    exec python3 run.py "$@"
fi
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

        # 1. Include standalone WorkPulse.exe if available
        exe_candidates = [
            DIST_DIR / "bin" / f"{APP_NAME}.exe",
            DIST_DIR / f"{APP_NAME}-v{VERSION}-windows-x64.exe",
            DIST_DIR / f"{APP_NAME}.exe",
        ]
        for ec in exe_candidates:
            if ec.exists():
                shutil.copy2(ec, bundle_root / f"{APP_NAME}.exe")
                print(f"[INFO] Included {APP_NAME}.exe into Windows bundle.")
                break

        # 2. Include private bundled JRE
        find_or_build_jre(bundle_root / "jre")

        zip_path = DIST_DIR / f"{archive_base}.zip"
        print(f"[INFO] Creating zip: {zip_path.name}...")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(bundle_root):
                for f in files:
                    file_path = Path(root) / f
                    arcname = file_path.relative_to(staging_dir)
                    zf.write(file_path, arcname)

        # 3. Build Windows Inno Setup installer if compiler is available
        compile_inno_setup(VERSION)

        shutil.rmtree(staging_dir)
        return zip_path
    else:
        create_unix_bundle(bundle_root)
        if sys.platform != "win32":
            find_or_build_jre(bundle_root / "jre")
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
    print(f"  Packaging {APP_NAME} v{VERSION} (Zero-Dependency Edition)")
    print(f"========================================================\n")

    for p in platforms:
        pkg_path = build_package(p)
        size_mb = pkg_path.stat().st_size / (1024 * 1024)
        sha = calculate_sha256(pkg_path)
        checksums.append((pkg_path.name, f"{size_mb:.2f} MB", sha))
        print(f"  [SUCCESS] {pkg_path.name} ({size_mb:.2f} MB)")
        print(f"            SHA-256: {sha}\n")

    # Check if Windows Setup installer was built
    setup_built = DIST_DIR / f"{APP_NAME}-v{VERSION}-windows-x64-Setup.exe"
    if setup_built.exists():
        size_mb = setup_built.stat().st_size / (1024 * 1024)
        sha = calculate_sha256(setup_built)
        checksums.append((setup_built.name, f"{size_mb:.2f} MB", sha))
        print(f"  [SUCCESS] {setup_built.name} ({size_mb:.2f} MB)")
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
