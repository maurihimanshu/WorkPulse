#!/usr/bin/env python3
"""WorkPulse Linux Enterprise Packaging Script.

Produces:
1. WorkPulse-v{VERSION}-linux-x64.deb (Native Debian/Ubuntu installer)
2. WorkPulse-v{VERSION}-linux-x64.tar.gz (Universal portable archive with private JRE)
"""

import hashlib
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys

APP_NAME = "WorkPulse"
VERSION = sys.argv[1].lstrip("v") if len(sys.argv) > 1 else "0.2.2"

ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"


def calculate_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def find_backend_jar() -> Path:
    target_dir = ROOT_DIR / "backend" / "target"
    jars = list(target_dir.glob("workpulse-backend-*.jar"))
    jars = [j for j in jars if not j.name.endswith(".original")]
    if jars:
        jars.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return jars[0]
    return target_dir / f"workpulse-backend-{VERSION}.jar"


def ensure_linux_jre(target_dir: Path) -> bool:
    """Bundle Linux JRE into target_dir."""
    target_jre = target_dir / "jre"
    if (target_jre / "bin" / "java").exists():
        return True

    # 1. Check pre-built dist/jre
    dist_jre = DIST_DIR / "jre"
    if (dist_jre / "bin" / "java").exists():
        print(f"[INFO] Copying bundled Linux JRE from {dist_jre}...")
        shutil.copytree(dist_jre, target_jre, dirs_exist_ok=True)
        return True

    # 2. Attempt jlink
    jlink = shutil.which("jlink") or (Path(os.environ.get("JAVA_HOME", "")) / "bin" / "jlink")
    if jlink and Path(jlink).exists():
        modules = [
            "java.base", "java.compiler", "java.desktop", "java.instrument",
            "java.management", "java.naming", "java.net.http", "java.prefs",
            "java.rmi", "java.scripting", "java.security.jgss", "java.security.sasl",
            "java.sql", "java.sql.rowset", "java.transaction.xa", "java.xml",
            "jdk.crypto.ec", "jdk.httpserver", "jdk.unsupported", "jdk.management",
        ]
        cmd = [
            str(jlink),
            "--no-header-files",
            "--no-man-pages",
            "--strip-debug",
            "--add-modules", ",".join(modules),
            "--output", str(target_jre),
        ]
        print("[INFO] Generating minimal private Linux JRE via jlink...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print("[INFO] Embedded private Linux JRE generated.")
            return True
        else:
            print(f"[WARN] jlink failed: {res.stderr.strip() or res.stdout.strip()}")

    print("[WARN] JRE could not be bundled for Linux.")
    return False


def copy_common_payload(target_dir: Path):
    """Copy backend JAR, collector, and metadata into target folder."""
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Backend JAR
    backend_jar = find_backend_jar()
    target_backend = target_dir / "backend" / "target"
    target_backend.mkdir(parents=True, exist_ok=True)
    if backend_jar.exists():
        shutil.copy2(backend_jar, target_backend / backend_jar.name)

    # 2. Collector
    collector_src = ROOT_DIR / "collector"
    if collector_src.exists():
        shutil.copytree(collector_src, target_dir / "collector", dirs_exist_ok=True)

    # 3. Assets
    assets_src = ROOT_DIR / "assets"
    if assets_src.exists():
        shutil.copytree(assets_src, target_dir / "assets", dirs_exist_ok=True)

    # 4. Executable or launcher
    exe_candidates = [
        DIST_DIR / "bin" / APP_NAME,
        DIST_DIR / APP_NAME,
        ROOT_DIR / APP_NAME,
    ]
    for ec in exe_candidates:
        if ec.exists() and ec.is_file():
            dest = target_dir / APP_NAME
            shutil.copy2(ec, dest)
            try:
                dest.chmod(dest.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
            except Exception:
                pass
            print(f"[INFO] Included native Linux binary {APP_NAME}.")
            break

    # 5. Core scripts and metadata
    for fname in ["run.py", "requirements.txt", "README.md", "LICENSE"]:
        src = ROOT_DIR / fname
        if src.exists():
            shutil.copy2(src, target_dir / fname)

    # 6. Linux desktop entry
    desktop_src = ROOT_DIR / "installer" / "linux" / "workpulse.desktop"
    if desktop_src.exists():
        target_installer = target_dir / "installer" / "linux"
        target_installer.mkdir(parents=True, exist_ok=True)
        shutil.copy2(desktop_src, target_installer / "workpulse.desktop")


def build_deb_package() -> Path | None:
    """Build native Debian / Ubuntu .deb package."""
    print(f"\n[INFO] Building Linux Debian package (.deb)...")
    deb_staging = DIST_DIR / "deb_staging"
    if deb_staging.exists():
        shutil.rmtree(deb_staging)

    opt_dir = deb_staging / "opt" / "workpulse"
    opt_dir.mkdir(parents=True, exist_ok=True)

    # Copy files into /opt/workpulse
    copy_common_payload(opt_dir)
    ensure_linux_jre(opt_dir)

    # Create DEBIAN control files
    debian_meta = deb_staging / "DEBIAN"
    debian_meta.mkdir(parents=True, exist_ok=True)

    control_content = f"""Package: workpulse
Version: {VERSION}
Section: utils
Priority: optional
Architecture: amd64
Maintainer: WorkPulse Team <contact@workpulse.io>
Depends: libc6
Description: WorkPulse - AI Work Assistant & Productivity Tracker
 WorkPulse is an enterprise-grade AI-powered work pulse and productivity
 tracking application. Zero external dependencies required.
"""
    (debian_meta / "control").write_text(control_content, encoding="utf-8")

    # Post-installation script
    postinst_content = """#!/bin/sh
set -e
# Create symlink in /usr/local/bin
if [ -f /opt/workpulse/WorkPulse ]; then
    ln -sf /opt/workpulse/WorkPulse /usr/local/bin/workpulse
    chmod +x /usr/local/bin/workpulse
fi

# Install desktop entry
if [ -d /usr/share/applications ] && [ -f /opt/workpulse/installer/linux/workpulse.desktop ]; then
    cp /opt/workpulse/installer/linux/workpulse.desktop /usr/share/applications/workpulse.desktop
    chmod 644 /usr/share/applications/workpulse.desktop
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database 2>/dev/null || true
    fi
fi
exit 0
"""
    postinst_file = debian_meta / "postinst"
    postinst_file.write_text(postinst_content, encoding="utf-8")
    postinst_file.chmod(0o755)

    # Post-removal script
    postrm_content = """#!/bin/sh
set -e
rm -f /usr/local/bin/workpulse
rm -f /usr/share/applications/workpulse.desktop
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database 2>/dev/null || true
fi
exit 0
"""
    postrm_file = debian_meta / "postrm"
    postrm_file.write_text(postrm_content, encoding="utf-8")
    postrm_file.chmod(0o755)

    # Fix permissions in staging
    for root, dirs, files in os.walk(deb_staging):
        for d in dirs:
            os.chmod(os.path.join(root, d), 0o755)
        for f in files:
            p = Path(root) / f
            if p.suffix in [".sh", ".py"] or p.name in ["WorkPulse", "java", "postinst", "postrm"]:
                p.chmod(0o755)

    deb_output = DIST_DIR / f"{APP_NAME}-v{VERSION}-linux-x64.deb"
    dpkg_cmd = ["dpkg-deb", "--build", str(deb_staging), str(deb_output)]
    try:
        res = subprocess.run(dpkg_cmd, capture_output=True, text=True)
        if res.returncode == 0 and deb_output.exists():
            print(f"[SUCCESS] Generated Debian package: {deb_output.name} ({deb_output.stat().st_size / (1024*1024):.2f} MB)")
            shutil.rmtree(deb_staging, ignore_errors=True)
            return deb_output
        else:
            print(f"[WARN] dpkg-deb failed: {res.stderr or res.stdout}")
    except FileNotFoundError:
        print("[WARN] dpkg-deb command not found. Skipping .deb packaging.")

    return None


def build_tar_gz_package() -> Path:
    """Build universal Linux portable .tar.gz bundle with embedded JRE."""
    print(f"\n[INFO] Building Linux portable .tar.gz bundle...")
    archive_base = f"{APP_NAME}-v{VERSION}-linux-x64"
    staging_dir = DIST_DIR / f"staging_linux-x64"
    bundle_root = staging_dir / archive_base
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    bundle_root.mkdir(parents=True, exist_ok=True)

    copy_common_payload(bundle_root)
    ensure_linux_jre(bundle_root)

    # Launcher shell script
    sh_content = """#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Prioritize private bundled JRE
if [ -d "$DIR/jre/bin" ]; then
    export PATH="$DIR/jre/bin:$PATH"
fi

if [ -f "$DIR/WorkPulse" ]; then
    exec "$DIR/WorkPulse" "$@"
else
    exec python3 run.py "$@"
fi
"""
    sh_file = bundle_root / "start_workpulse.sh"
    sh_file.write_text(sh_content, encoding="utf-8")
    try:
        sh_file.chmod(0o755)
    except Exception:
        pass

    import tarfile
    tar_path = DIST_DIR / f"{archive_base}.tar.gz"
    with tarfile.open(tar_path, "w:gz") as tf:
        for root, _, files in os.walk(bundle_root):
            for f in files:
                file_path = Path(root) / f
                arcname = file_path.relative_to(staging_dir)
                tf.add(file_path, arcname=str(arcname))

    shutil.rmtree(staging_dir, ignore_errors=True)
    print(f"[SUCCESS] Generated portable tar.gz: {tar_path.name} ({tar_path.stat().st_size / (1024*1024):.2f} MB)")
    return tar_path


def main():
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    print(f"========================================================")
    print(f"  Packaging {APP_NAME} v{VERSION} for Linux")
    print(f"========================================================")

    packages = []
    # 1. Debian Package
    deb_pkg = build_deb_package()
    if deb_pkg:
        packages.append(deb_pkg)

    # 2. Portable tar.gz
    tar_pkg = build_tar_gz_package()
    if tar_pkg:
        packages.append(tar_pkg)

    print("\nGenerated Linux Packages:")
    for p in packages:
        sha = calculate_sha256(p)
        print(f"  - {p.name} ({p.stat().st_size / (1024*1024):.2f} MB) | SHA: {sha}")


if __name__ == "__main__":
    main()
