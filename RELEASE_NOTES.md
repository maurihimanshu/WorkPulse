# ⚡ WorkPulse v0.2.0 Release Notes

> **First Official Open Source Release**  
> *Privacy-First Intelligent Activity Telemetry & Productivity Platform*

WorkPulse v0.2.0 is a complete, ground-up overhaul that transitions from legacy single-script tracking into a robust, enterprise-grade multi-tier architecture. It operates **100% locally and offline** on your machine with zero cloud telemetry.

---

## 🌟 What's New in v0.2.0

### 1. 🛡️ Persistent Local SQLite Database (Java Spring Boot 3)
* **ACID-Compliant Local Storage**: All telemetry, user profiles, categories, and settings are persisted locally in `data/workpulse.db` using `sqlite-jdbc` and Hibernate 6 `SQLiteDialect`.
* **Zero Configuration**: Database and directory structures are auto-created on initial startup with zero external server dependencies.

### 2. ⚡ Native OS Telemetry Collector (Python Engine)
* **Deep OS Window Tracking**: Real-time foreground application detection, window titles, process IDs, and executable paths.
  * **Windows**: Native Win32 API (`GetForegroundWindow`, `GetWindowThreadProcessId`, `QueryFullProcessImageNameW`).
  * **Linux**: Dual X11/Wayland support via `xdotool`, `xprintidle`, and `loginctl`.
  * **macOS**: Native AppleScript / Quartz event integration.
* **Hardware-Level Idle Detection**: Sub-second idle calculation (`GetLastInputInfo`) and screen-lock detection.
* **Resilient Outbox Buffer**: Telemetry is buffered locally during offline intervals and safely flushed when the backend is accessible.

### 3. 🎨 Modern React Presentation Layer (Embedded in Software)
* **Single-Page Application**: Bundled directly into the backend distribution and auto-launched at `http://localhost:9876`.
* **Interactive Dashboard**: Real-time telemetry card, active vs. idle duration cards, productivity score gauge, 24-hour distribution bar chart, and ranked top applications.
* **Activity Timeline**: Searchable and filterable history with date range selectors (Today, Yesterday, 7 Days, All Time) and deletion controls.
* **User Profile & Goals**: Set daily focus hours, working schedule, and live target progress bar.
* **Theme Switching**: Instant toggle between Dark Mode and Light Mode.

### 4. 📌 Taskbar System Tray & Quick-Action Dialog
* **Taskbar Hidden Icons Tray**: Quietly resides in the Windows Notification Area via `pystray`.
* **Compact Quick-Action Dialog**: Clicking the tray icon opens a sleek dark-slate status window:
  * Shows app version (`v0.2.0`) and live connection status (`● Active` / `⏸ Paused`).
  * Displays currently tracked foreground application and session duration.
  * One-click action buttons: **Open Dashboard**, **Pause / Resume Monitoring**, and **Close to Tray**.

### 5. 🚀 Silent Boot Autostart
* Automatically registers into system startup:
  * **Windows**: Windows Registry `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` executing silently via `pythonw.exe`.
  * **Linux**: `~/.config/autostart/workpulse.desktop`.
  * **macOS**: `~/Library/LaunchAgents/com.workpulse.launcher.plist`.
* Starts silently on boot in the system tray without popping up any command prompt window.

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
