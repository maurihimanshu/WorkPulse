# ⚡ WorkPulse v0.2.2 Release Notes

> **Feature & Usability Release**  
> *In-App Software Update Checker, WorkPulse Session Tracking, and Autostart Resilience*

WorkPulse v0.2.2 introduces an integrated Software Update Checker with direct GitHub release integration, corrects system tray session tracking to report true continuous WorkPulse uptime and daily work totals, and hardens Windows autostart handling.

---

## 🌟 What's New & Fixed in v0.2.2

### 1. 🔄 In-App Software Update Checker
* **Live GitHub Releases Integration**: Added automated check against GitHub Releases API (`https://api.github.com/repos/maurihimanshu/WorkPulse/releases/latest`) with SemVer comparison and 1-hour in-memory cache to respect API rate limits.
* **Direct Windows Installer Resolution**: Automatically detects and extracts the direct download URL for the Windows Setup installer (`WorkPulse-*-windows-x64-Setup.exe`).
* **Update Notification Modal**: Sleek dialog displaying new version highlights, release date, download link, and release notes markdown.
* **Settings & Sidebar Badging**: "Check for Updates" button with animated status in Settings page, plus unobtrusive update badge in the sidebar footer.

### 2. ⏱️ System Tray Session & Work Time Tracking
* **WorkPulse Session Tracking**: Replaced misleading window-focus timer in the system tray with continuous WorkPulse application session uptime (`workpulseSessionSeconds`).
* **Today's Total Active Work**: Added real-time tracking for total daily active work time (`todayActiveSeconds`) aggregated via `StatsService`.
* **Focus Retention**: Filtered out self-focus events (`WorkPulse.exe`) so clicking the system tray does not reset or overwrite the active foreground application name.
* **Dynamic Hover Tooltip**: System tray hover tooltip dynamically reflects active monitoring status, WorkPulse session uptime, and today's work time.

### 3. 🚀 Windows Boot & Autostart Resilience
* **Direct Frozen Executable Registration**: Fixed PyInstaller binary path resolution to avoid spurious `run.py` arguments during Windows login.
* **Self-Healing Registry Migration**: Automatically detects and repairs legacy registry commands on startup.

---

## 📦 Downloadable Packages & Checksums

| Package | Platform | Architecture | Size | SHA-256 Checksum |
|---|---|---|---|---|
| **`WorkPulse-v0.2.0-windows-x64.exe`** | Windows 10 / 11 (Standalone Executable) | x64 | 30.82 MB | `d1844680327ac7012b6209f1d81d5208e0ce26cd851bd0ee20c985e5f6acdb0d` |
| **`WorkPulse-v0.2.0-windows-x64.zip`** | Windows 10 / 11 (Full Distribution) | x64 | 52.55 MB | `f1f7b7d0b127b61a9fed2bf1a7b656a862c9bae717b6d5056a24a3cfa9d8b047` |
| **`WorkPulse-v0.2.0-macos-universal.tar.gz`** | macOS 12+ (Monterey, Ventura, Sonoma, Sequoia) | Apple Silicon (M1–M4) & Intel | 52.54 MB | `a556b65623113f13a28d97f368c97e422a37d015bc9197741641d6ab823c914e` |
| **`WorkPulse-v0.2.0-linux-x64.tar.gz`** | Linux (Ubuntu, Debian, Fedora, Arch) | x64 | 52.54 MB | `1679354e32891a5821ab3004c4654638f91ca130dce9341e7b9b6f0f80d94ff8` |

---

## 💻 Installation & Quickstart

### 🪟 Windows 10 / 11

#### Option A: Standalone Executable (.exe)
1. Download **`WorkPulse-v0.2.0-windows-x64.exe`**.
2. Double-click **`WorkPulse.exe`** to run. It embeds the runtime and immediately docks in your Windows Taskbar tray.

#### Option B: Full Bundle (.zip)
1. **Prerequisites**: Ensure [Java 21+](https://adoptium.net/) and [Python 3.9+](https://www.python.org/downloads/) are installed.
2. Download and extract **`WorkPulse-v0.2.0-windows-x64.zip`**.
3. Install collector dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
4. **Launch**:
   * Double-click **`start_workpulse.bat`** (or `start_workpulse_silent.vbs` for completely silent background operation).
   * WorkPulse will appear in your Taskbar Notification Area ("hidden icons" tray) and open the Dashboard in your default browser!

---

### 🍎 macOS (Apple Silicon & Intel)

1. **Prerequisites**: Ensure Java 21+ (`brew install openjdk@21`) and Python 3.9+ are installed.
2. Download and extract **`WorkPulse-v0.2.0-macos-universal.tar.gz`**:
   ```bash
   tar -xzf WorkPulse-v0.2.0-macos-universal.tar.gz
   cd WorkPulse-v0.2.0-macos-universal
   ```
3. Install collector dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```
4. **Launch**:
   ```bash
   ./start_workpulse.sh
   ```

---

### 🐧 Linux (Ubuntu / Debian / Fedora / Arch)

1. **Prerequisites**: Ensure Java 21+ (`sudo apt install openjdk-21-jre`) and Python 3.9+ are installed.
   ```bash
   # On Ubuntu/Debian:
   sudo apt update && sudo apt install -y openjdk-21-jre python3-pip xdotool xprintidle
   ```
2. Download and extract **`WorkPulse-v0.2.0-linux-x64.tar.gz`**:
   ```bash
   tar -xzf WorkPulse-v0.2.0-linux-x64.tar.gz
   cd WorkPulse-v0.2.0-linux-x64
   ```
3. Install collector dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```
4. **Launch**:
   ```bash
   ./start_workpulse.sh
   ```

---

## 👥 Project Information & Contributors

* **Repository**: [https://github.com/maurihimanshu/WorkPulse](https://github.com/maurihimanshu/WorkPulse)
* **License**: MIT License
* **CODEOWNERS**: `@maurihimanshu`, `@himanshumauri`, `@githubofhimanshu`
