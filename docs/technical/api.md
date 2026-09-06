# WorkPulse REST API Reference

The Spring Boot backend exposes REST endpoints under `/api`.

## 1. System Control & Ingestion
- `GET /api/control/status`: Returns current monitoring state, active window telemetry, and idle status.
- `POST /api/control/toggle`: Toggles monitoring state (resumes or pauses recording).
- `POST /api/ingest/activity`: Ingests a completed application session.
- `POST /api/ingest/heartbeat`: Receives live telemetry from the Python OS collector.
- `GET /api/ingest/heartbeat`: Retrieves the most recent heartbeat.

## 2. Analytics & Statistics
- `GET /api/stats/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: Summary metrics (active, idle, total, productivity score, top app).
- `GET /api/stats/top-apps?limit=8`: Ranked applications by active duration and percentage.
- `GET /api/stats/hourly?date=YYYY-MM-DD`: 24-hour distribution of active vs. idle time.
- `GET /api/stats/categories`: Distribution of time across productivity categories.

## 3. Activities
- `GET /api/activities?page=0&size=20&search=term&startDate=...&endDate=...`: Paginated activity history.
- `DELETE /api/activities/{id}`: Delete a specific activity record.
- `DELETE /api/activities`: Delete all activity logs.

## 4. User Profile & Settings
- `GET /api/profile`: Retrieve user profile, daily goals, and schedule.
- `PUT /api/profile`: Update user profile.
- `GET /api/settings`: Retrieve configuration parameters.
- `PUT /api/settings`: Update configuration parameters.
- `GET /api/settings/categories`: List all categorization rules.
- `POST /api/settings/categories`: Add or update a categorization rule.
- `DELETE /api/settings/categories/{id}`: Delete a categorization rule.