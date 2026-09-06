# ⚡ WorkPulse

<p align="center">
  <strong>Privacy-First Intelligent Activity Telemetry &amp; Productivity Intelligence Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/maurihimanshu/workpulse/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/maurihimanshu/workpulse/ci.yml?branch=main&style=flat-square&logo=github&label=CI" alt="CI Status" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/Java-21%20LTS-orange.svg?style=flat-square&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg?style=flat-square&logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-19%20%2B%20Vite-blue.svg?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Database-SQLite%20(Persistent)-blue.svg?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Python-3.9%2B-yellow.svg?style=flat-square&logo=python" alt="Python" />
</p>

---

## 📖 Overview

**WorkPulse** is a modern, privacy-first activity tracking and productivity platform designed for developers, creators, and professionals. It operates **100% locally and offline** on your workstation.

Unlike traditional trackers that upload your activity data to third-party cloud servers, WorkPulse stores all telemetry locally in a persistent **SQLite** database on your disk (`data/workpulse.db`).

---

## 🏗️ Architecture

WorkPulse is designed with a high-performance multi-tier architecture:

```
+------------------------------------+       HTTP REST       +------------------------------------+
|     Core OS Collector (Python)     | --------------------> |     Backend System (Java 21)       |
|                                    |   POST /api/ingest    | - Spring Boot 3.2.5                |
| - Windows Win32 API                |                       | - Spring Data JPA (Hibernate 6)    |
| - Linux X11 / Wayland              |                       | - Persistent SQLite Database       |
| - macOS Quartz                     |                       |   (data/workpulse.db)              |
| - Sub-second idle calculation      |                       | - High-throughput REST API         |
| - Desktop lock detection           |                       | - Bundled React Static Server      |
+------------------------------------+                       +------------------------------------+
                                                                               |
                                                                               | Serves Web App
                                                                               v
                                                             +------------------------------------+
                                                             |  Presentation Layer (React + Vite) |
                                                             |                                    |
                                                             | - Auto-launched in Default Browser |
                                                             | - Live Real-Time Dashboard         |
                                                             | - Searchable Activity Timeline     |
                                                             | - Category Rules & Settings        |
                                                             | - User Productivity Profile        |
                                                             +------------------------------------+
```

---

## ✨ Key Features

* **⚡ Core OS Gathering (Python)**:
  * Native OS foreground window detection (app name, window title, process ID, executable path).
  * True hardware-level idle time calculation (`GetLastInputInfo` on Windows, `xprintidle` on Linux, `CGEventSource` on macOS).
  * Auto-detection of locked screens and workstation switches.
* **🛡️ Persistent SQLite Database (Java Spring Boot)**:
  * Robust, local SQL database at `data/workpulse.db` using `sqlite-jdbc` and Hibernate `SQLiteDialect`.
  * Fully ACID compliant with zero external database configuration or server setups.
  * Preserves your activity logs, profile goals, and custom category mappings permanently across reboots.
* **🎨 Modern React Presentation Layer**:
  * **Dashboard**: Real-time active window telemetry, active vs. idle duration cards, productivity score gauge, 24h hourly distribution bar chart, and top applications ranking.
  * **Timeline**: Searchable, filterable activity history with quick date pickers (Today, Yesterday, Last 7 Days, All Time) and deletion actions.
  * **Settings**: Real-time adjustable idle threshold slider, polling frequency selector, category keyword mappings, and data clearance.
  * **Profile**: Personal productivity targets, daily focus goal progress bar, working hours, and instant Dark/Light theme switching.
* **🌐 Zero-Friction Browser Launch**:
  * Running `python run.py` automatically initializes the backend, starts the OS collector, and launches your default web browser to `http://localhost:8080`.

---

## 🚀 Quick Start

### Prerequisites
* **Java 21+** (`java -version`)
* **Python 3.9+** (`python --version`)
* **Node.js 18+** (`node -v`) *(only if rebuilding frontend from source)*
* **Maven 3.8+** (`mvn -version`) *(only if rebuilding backend from source)*

### 1. Installation
Clone the repository and install the lightweight Python collector dependencies:
```bash
git clone https://github.com/maurihimanshu/workpulse.git
cd workpulse

# Install Python collector dependencies
pip install -r requirements.txt
```

### 2. Launching WorkPulse
Run the master launcher:
```bash
python run.py
```
> WorkPulse will start the Java Spring Boot backend, launch the Python OS information collector, and automatically open **`http://localhost:8080`** in your default web browser!

---

## 📡 REST API Reference

The Spring Boot backend exposes comprehensive REST endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/control/status` | Current monitoring status, live active app, window title, idle seconds |
| `POST` | `/api/control/toggle` | Pause or resume activity monitoring |
| `POST` | `/api/ingest/activity` | Ingest closed activity session (used by Python collector) |
| `POST` | `/api/ingest/heartbeat` | Ingest live foreground heartbeat telemetry |
| `GET` | `/api/stats/summary` | Aggregated total active time, idle time, and productivity score |
| `GET` | `/api/stats/top-apps` | Ranked top applications by duration and percentage |
| `GET` | `/api/stats/hourly` | 24-hour activity distribution for charts |
| `GET` | `/api/stats/categories` | Breakdown of time across categories |
| `GET` | `/api/activities` | Paginated and searchable activity history |
| `DELETE`| `/api/activities/{id}` | Delete a specific activity record |
| `GET` | `/api/profile` | Retrieve user productivity profile and target goals |
| `PUT` | `/api/profile` | Update user productivity profile |
| `GET` | `/api/settings` | Retrieve system settings (idle threshold, poll interval) |
| `PUT` | `/api/settings` | Update system settings |
| `GET` | `/api/settings/categories` | List all categorization rules |
| `POST`| `/api/settings/categories` | Add or update a categorization rule |

---

## 🛠️ Development & Building from Source

### Rebuild React Frontend
```bash
cd frontend
npm install
npm run build
# Copy static bundle to Spring Boot
cp -r dist/* ../backend/src/main/resources/static/
```

### Rebuild Java Backend
```bash
cd backend
mvn clean package
```

### Run Automated Tests
```bash
# Backend tests (Spring Boot + SQLite)
cd backend && mvn test

# Python collector tests
pytest tests/test_collector.py -v
```

---

## 👥 Ownership & Maintainers
- **@maurihimanshu**
- **@himanshumauri**
- **@githubofhimanshu**

## 📄 License
This project is licensed under the [MIT License](LICENSE).