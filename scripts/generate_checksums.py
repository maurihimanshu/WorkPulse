#!/usr/bin/env python3
"""Generate SHA256SUMS.txt for all release packages in dist/."""

import hashlib
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"


def calculate_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    if not DIST_DIR.exists():
        print(f"[ERROR] Directory {DIST_DIR} not found.")
        return

    checksum_entries = []
    # Collect all release files: .zip, .tar.gz, .exe, .deb, .dmg, .AppImage
    valid_exts = {".zip", ".gz", ".exe", ".deb", ".dmg", ".appimage"}
    for item in sorted(DIST_DIR.iterdir()):
        if item.is_file() and item.name != "SHA256SUMS.txt":
            # Exclude loose non-setup .exe
            if item.name.lower().endswith(".exe") and not item.name.endswith("-Setup.exe"):
                continue
            if any(item.name.lower().endswith(ext) for ext in valid_exts):
                sha = calculate_sha256(item)
                size_mb = item.stat().st_size / (1024 * 1024)
                checksum_entries.append((sha, item.name, size_mb))

    checksum_file = DIST_DIR / "SHA256SUMS.txt"
    with open(checksum_file, "w", encoding="utf-8") as f:
        for sha, name, _ in checksum_entries:
            f.write(f"{sha}  {name}\n")

    print("=" * 65)
    print(f"  Consolidated Release Packages ({len(checksum_entries)} files):")
    for sha, name, size_mb in checksum_entries:
        print(f"  - {name} ({size_mb:.2f} MB)")
        print(f"    SHA-256: {sha}")
    print("=" * 65)
    print(f"\n[SUCCESS] Checksums written to {checksum_file.name}")


if __name__ == "__main__":
    main()
