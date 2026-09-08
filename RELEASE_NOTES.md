# ⚡ WorkPulse v0.2.1 Release Notes

> **Maintenance & Reliability Release**  
> *Windows Autostart Restoration, Analytics Engine Hardening, and Subsystem Optimization*

WorkPulse v0.2.1 delivers critical fixes for system startup on Windows, addresses edge-case bugs in telemetry streak calculations, enhances ingestion throughput, and ensures clean local date handling.

---

## 🌟 What's New & Fixed in v0.2.1

### 1. 🚀 Windows Autostart & Installation Fix
* **Fixed Executable Crash on Boot**: Resolved an issue where standalone `.exe` distributions configured autostart with a trailing script argument (`WorkPulse.exe run.py --autostart`). The compiled PyInstaller executable was failing on `argparse` with `unrecognized arguments`, silently aborting during Windows login.
* **Direct Binary Execution**: Updated `get_default_command()` in `collector/autostart.py` so frozen executables register `"{sys.executable}" --autostart` directly without extraneous `.py` references.
* **Resilient CLI Parser & Self-Healing**: Enhanced `run.py` argument parsing to absorb legacy script arguments gracefully via `parse_known_args()`, and added automatic detection and self-healing for legacy Windows registry `Run` entries.
* **Installer Defaults**: Enabled Windows Startup (`startup`) task by default in the Inno Setup installer script (`installer/WorkPulse.iss`).

### 2. 🧠 Analytics & Deep Work Engine Hardening
* **Deep Work Detection Overhaul**: Fixed a bug where deep work time always reported as zero. Individual collector flushes range from 5s to 300s, preventing any single activity from meeting a raw 20-minute threshold. The calculation now aggregates contiguous productive focus intervals ($\le 180\text{s}$ gap), accurately capturing streaks $\ge 1200\text{s}$ (20 minutes).
* **Weighted Productivity Scoring**: Replaced the crude active vs. idle ratio with a formula incorporating category-level classifications (`isProductive`) and custom productivity weights.
* **Dynamic Wellbeing Hours**: Replaced hardcoded 09:00–18:00 working hours with the user's custom start and end hours configured in their profile.
* **Date-Filtered Hourly Distribution**: Overloaded `/api/stats/hourly` to support arbitrary date ranges (`startDate` and `endDate`).
* **Locale-Safe CSV Exports**: Enforced `Locale.US` in floating-point formatting to prevent decimal comma separators from breaking CSV exports on international systems.

### 3. ⚡ Ingestion Throughput & Storage Reliability
* **Thread-Safe In-Memory Category Cache**: Eliminated N+1 database queries during high-frequency collector ingestion bursts using a cached `CopyOnWriteArrayList<Category>` in `IngestionService`, automatically invalidated upon category updates.
* **Bounded Metric Drain**: Refactored process resource flushing in `ProcessResourceService` to drain in bounded batches of up to 1,000 items, eliminating unbounded memory spikes under load.
* **Automated Data Retention**: Added a daily `@Scheduled` background cleanup task in `SettingsService` that purges raw activity records older than the user-configured retention period (`retentionDays`, default 90 days).
* **JPA Open-In-View Hygiene**: Disabled `spring.jpa.open-in-view` in `application.yml` to prevent warning spam and enforce strict transaction boundaries.

### 4. 🎨 Frontend & UX Enhancements
* **Timezone-Safe Date Utility**: Replaced `toISOString().split('T')[0]` with local calendar date calculation (`formatLocalDate`) across all views, eliminating date shifting bugs during evening work sessions in local timezones.
* **Unified Live SSE Stream**: Lifted `useLiveStream` connection management to the root `App` component to eliminate redundant stream reconnections across page transitions.
* **Dynamic Daily Goal Integration**: Connected profile daily goal settings directly into dashboard goal progress rings with instantaneous updates.
* **Resource Monitor Controls**: Connected manual refresh and unified background process polling with real-time stream status.

---

## 📦 Updated Executable Details (v0.2.1)

| Package | Platform | Size | SHA-256 Checksum |
|---|---|---|---|
| **`WorkPulse.exe`** | Windows 10 / 11 (Standalone x64) | 84.82 MB | `880988AC9A497B42E3E4B125EFB7E7FFE902762CCFE7EEBCD1D08DF51EC5A4DB` |

---

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
