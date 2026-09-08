#!/usr/bin/env python3
"""WorkPulse macOS Enterprise Packaging Script.

Produces:
1. WorkPulse.app (Native macOS application bundle)
2. WorkPulse-v{VERSION}-macos-universal.dmg (Apple Disk Image with drag-to-Applications)
3. WorkPulse-v{VERSION}-macos-universal.tar.gz (Portable archive with private JRE)
"""

import hashlib
import os
from pathlib import Path
import plistlib
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


def generate_icns() -> Path | None:
    """Generate macOS icon.icns from assets/icon.png."""
    icns_path = ROOT_DIR / "assets" / "icon.icns"
    if icns_path.exists():
        return icns_path

    png_path = ROOT_DIR / "assets" / "icon.png"
    if not png_path.exists():
        print("[WARN] assets/icon.png not found. Skipping .icns generation.")
        return None

    iconset_dir = DIST_DIR / "WorkPulse.iconset"
    iconset_dir.mkdir(parents=True, exist_ok=True)

    sizes = [16, 32, 64, 128, 256, 512]
    try:
        from PIL import Image
        img = Image.open(png_path)
        for s in sizes:
            resized = img.resize((s, s), Image.Resampling.LANCZOS)
            resized.save(iconset_dir / f"icon_{s}x{s}.png")
            if s <= 256:
                resized_2x = img.resize((s * 2, s * 2), Image.Resampling.LANCZOS)
                resized_2x.save(iconset_dir / f"icon_{s}x{s}@2x.png")

        subprocess.run(["iconutil", "-c", "icns", str(iconset_dir), "-o", str(icns_path)], check=True)
        shutil.rmtree(iconset_dir, ignore_errors=True)
        print(f"[SUCCESS] Generated Apple ICNS icon: {icns_path.name}")
        return icns_path
    except Exception as e:
        print(f"[WARN] Failed to create .icns via iconutil: {e}")
        return None


def ensure_macos_jre(target_jre_dir: Path) -> bool:
    """Bundle minimal macOS private JRE into target_jre_dir."""
    if (target_jre_dir / "bin" / "java").exists():
        return True

    dist_jre = DIST_DIR / "jre"
    if (dist_jre / "bin" / "java").exists():
        print(f"[INFO] Copying macOS private JRE from {dist_jre}...")
        shutil.copytree(dist_jre, target_jre_dir, dirs_exist_ok=True)
        return True

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
            "--output", str(target_jre_dir),
        ]
        print("[INFO] Generating minimal private macOS JRE via jlink...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print("[INFO] Embedded private macOS JRE generated.")
            return True
        else:
            print(f"[WARN] macOS jlink failed: {res.stderr.strip() or res.stdout.strip()}")

    return False


def build_app_bundle() -> Path:
    """Assemble native WorkPulse.app bundle."""
    app_dir = DIST_DIR / f"{APP_NAME}.app"
    if app_dir.exists():
        shutil.rmtree(app_dir)

    contents = app_dir / "Contents"
    macos_dir = contents / "MacOS"
    resources_dir = contents / "Resources"
    plugins_dir = contents / "PlugIns"

    macos_dir.mkdir(parents=True, exist_ok=True)
    resources_dir.mkdir(parents=True, exist_ok=True)
    plugins_dir.mkdir(parents=True, exist_ok=True)

    # 1. Info.plist
    info_plist = {
        "CFBundleDevelopmentRegion": "English",
        "CFBundleDisplayName": APP_NAME,
        "CFBundleExecutable": APP_NAME,
        "CFBundleIconFile": "icon.icns",
        "CFBundleIdentifier": "com.workpulse.assistant",
        "CFBundleInfoDictionaryVersion": "6.0",
        "CFBundleName": APP_NAME,
        "CFBundlePackageType": "APPL",
        "CFBundleShortVersionString": VERSION,
        "CFBundleVersion": VERSION,
        "LSMinimumSystemVersion": "11.0",
        "NSHighResolutionCapable": True,
        "LSUIElement": False,
    }
    with open(contents / "Info.plist", "wb") as f:
        plistlib.dump(info_plist, f)

    # 2. Native Mach-O binary
    exe_candidates = [
        DIST_DIR / "bin" / APP_NAME,
        DIST_DIR / APP_NAME,
        ROOT_DIR / APP_NAME,
    ]
    binary_placed = False
    for ec in exe_candidates:
        if ec.exists() and ec.is_file():
            dest = macos_dir / APP_NAME
            shutil.copy2(ec, dest)
            dest.chmod(0o755)
            binary_placed = True
            print(f"[INFO] Installed native macOS executable into {APP_NAME}.app/Contents/MacOS/")
            break

    if not binary_placed:
        # Create launcher fallback script
        launcher = macos_dir / APP_NAME
        launcher.write_text(f"""#!/bin/sh
DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"
export PATH="$(cd "$(dirname "$0")/../PlugIns/jre/bin" && pwd):$PATH"
exec python3 "$DIR/run.py" "$@"
""", encoding="utf-8")
        launcher.chmod(0o755)

    # 3. Icon
    icns = generate_icns()
    if icns and icns.exists():
        shutil.copy2(icns, resources_dir / "icon.icns")

    # 4. macOS Private JRE
    ensure_macos_jre(plugins_dir / "jre")

    # 5. Resources: Backend JAR, collector, run.py
    backend_jar = find_backend_jar()
    backend_dest = resources_dir / "backend" / "target"
    backend_dest.mkdir(parents=True, exist_ok=True)
    if backend_jar.exists():
        shutil.copy2(backend_jar, backend_dest / backend_jar.name)

    collector_src = ROOT_DIR / "collector"
    if collector_src.exists():
        shutil.copytree(collector_src, resources_dir / "collector", dirs_exist_ok=True)

    for fname in ["run.py", "requirements.txt", "README.md", "LICENSE"]:
        src = ROOT_DIR / fname
        if src.exists():
            shutil.copy2(src, resources_dir / fname)

    print(f"[SUCCESS] Native macOS bundle assembled: {app_dir.name}")
    return app_dir


def build_dmg(app_bundle: Path) -> Path | None:
    """Create Apple Disk Image (.dmg) with drag-to-Applications symlink."""
    dmg_path = DIST_DIR / f"{APP_NAME}-v{VERSION}-macos-universal.dmg"
    dmg_staging = DIST_DIR / "dmg_staging"
    if dmg_staging.exists():
        shutil.rmtree(dmg_staging)
    dmg_staging.mkdir(parents=True, exist_ok=True)

    # Copy WorkPulse.app into staging
    shutil.copytree(app_bundle, dmg_staging / app_bundle.name, symlinks=True)

    # Create symlink to /Applications
    applications_link = dmg_staging / "Applications"
    try:
        os.symlink("/Applications", applications_link)
    except Exception as e:
        print(f"[WARN] Failed to create /Applications symlink: {e}")

    # Build DMG using native macOS hdiutil
    cmd = [
        "hdiutil", "create",
        "-volname", APP_NAME,
        "-srcfolder", str(dmg_staging),
        "-ov",
        "-format", "UDZO",
        str(dmg_path),
    ]
    print(f"[INFO] Compiling Apple Disk Image (DMG)...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    shutil.rmtree(dmg_staging, ignore_errors=True)

    if res.returncode == 0 and dmg_path.exists():
        print(f"[SUCCESS] Generated macOS DMG: {dmg_path.name} ({dmg_path.stat().st_size / (1024*1024):.2f} MB)")
        return dmg_path
    else:
        print(f"[WARN] hdiutil failed: {res.stderr or res.stdout}")
        return None


def build_tar_gz(app_bundle: Path) -> Path:
    """Create portable tar.gz of WorkPulse.app."""
    import tarfile
    tar_path = DIST_DIR / f"{APP_NAME}-v{VERSION}-macos-universal.tar.gz"
    print(f"[INFO] Compressing macOS portable tar.gz...")
    with tarfile.open(tar_path, "w:gz") as tf:
        tf.add(app_bundle, arcname=app_bundle.name)
    print(f"[SUCCESS] Generated macOS tar.gz: {tar_path.name} ({tar_path.stat().st_size / (1024*1024):.2f} MB)")
    return tar_path


def main():
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    print(f"========================================================")
    print(f"  Packaging {APP_NAME} v{VERSION} for macOS")
    print(f"========================================================")

    app_bundle = build_app_bundle()

    packages = []
    dmg_pkg = build_dmg(app_bundle)
    if dmg_pkg:
        packages.append(dmg_pkg)

    tar_pkg = build_tar_gz(app_bundle)
    if tar_pkg:
        packages.append(tar_pkg)

    print("\nGenerated macOS Packages:")
    for p in packages:
        sha = calculate_sha256(p)
        print(f"  - {p.name} ({p.stat().st_size / (1024*1024):.2f} MB) | SHA: {sha}")


if __name__ == "__main__":
    main()
