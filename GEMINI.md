# WorkPulse Development Guidelines & Rules

## Component Boundaries & Scope

### 1. Collector (`collector/`) — Strictly Frozen / Scoped
* **Sole Purpose**: Collect raw telemetry, system metrics, and window activity data from the host operating system.
* **Strict Rule**: **DO NOT** modify, expand, or add business logic to the collector for upcoming requirements. Treat the collector strictly as a data collection daemon.

### 2. Backend (`backend/`) & Frontend (`frontend/`) — Active Development Focus
* **Active Scope**: Focus **exclusively** on the **Backend** and **Frontend** for all upcoming feature requirements:
  * **Backend (`backend/`)**: Spring Boot Java 21 REST APIs, data aggregation, analytics, database persistence, security, and enterprise services.
  * **Frontend (`frontend/`)**: React, Vite, Tailwind CSS, dashboard charts, real-time widgets, user settings, and control center UI.
