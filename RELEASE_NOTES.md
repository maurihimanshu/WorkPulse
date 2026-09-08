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

## 👥 Project Information & Contributors

* **Repository**: [https://github.com/maurihimanshu/WorkPulse](https://github.com/maurihimanshu/WorkPulse)
* **License**: MIT License
* **CODEOWNERS**: `@maurihimanshu`, `@himanshumauri`, `@githubofhimanshu`
