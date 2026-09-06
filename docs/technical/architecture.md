# WorkPulse Technical Architecture

## Overview
WorkPulse is an intelligent, privacy-first activity tracking platform with a multi-tier design:
1. **Core OS Information Gathering Engine (Python)**
2. **Backend System (Java 21, Spring Boot 3, Persistent SQLite Database)**
3. **Presentation Layer (React 19, TypeScript, Tailwind CSS)**

---

## 1. Core OS Collector (Python)
- **Location**: `collector/`
- **Responsibilities**:
  - Monitors active foreground window (`window_title`, `app_name`, `process_id`, `executable_path`).
  - Measures true hardware idle time via OS APIs (`GetLastInputInfo` on Windows, `xprintidle` on Linux, `CGEventSource` on macOS).
  - Detects desktop lock and workstation state.
  - Streams heartbeats (`POST /api/ingest/heartbeat`) and completed sessions (`POST /api/ingest/activity`).
  - Buffers activities locally in memory if backend is temporarily unreachable.

---

## 2. Backend System (Java 21 + Spring Boot 3)
- **Location**: `backend/`
- **Database**: Local persistent SQLite database at `data/workpulse.db`.
- **Key Modules**:
  - `IngestionController` / `IngestionService`: Handles incoming telemetry from Python agent and manages default categories.
  - `ActivityController` / `ActivityService`: Searchable, paginated activity query interface.
  - `StatsController` / `StatsService`: Aggregates hourly breakdown, top applications, category distributions, and productivity scores.
  - `ProfileController` / `ProfileService`: User preferences, daily goals, and work schedules.
  - `SettingsController` / `SettingsService`: Idle thresholds, poll frequencies, and category matching rules.
  - `ControlController`: System monitoring state toggle and live health.

---

## 3. Presentation Layer (React + Vite)
- **Location**: `frontend/` (production bundle bundled inside `backend/src/main/resources/static/`).
- **Pages**:
  - **Dashboard**: Live telemetry card, focus metric cards, 24h hourly distribution bar chart, top applications breakdown, category distribution.
  - **Timeline**: Chronological log of recorded activities with date range filters, search, and deletion.
  - **Settings**: Idle threshold slider, poll frequency, category rules, and database management.
  - **Profile**: Daily productivity target progress meter, user goals, and Dark/Light theme toggle.

---

## 4. Execution & Launch Lifecycle
- Running `python run.py`:
  1. Verifies Java 21 runtime.
  2. Ensures `data/` directory exists for SQLite database.
  3. Boots the Spring Boot backend JAR on port 8080.
  4. Waits for `/api/control/status` health check.
  5. Spawns the Python OS collector agent.
  6. Automatically opens `http://localhost:8080` in the user's default browser.