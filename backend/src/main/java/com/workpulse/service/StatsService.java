package com.workpulse.service;

import com.workpulse.dto.DeepWorkStatsDto;
import com.workpulse.dto.HourlyStatsDto;
import com.workpulse.dto.ProjectBreakdownDto;
import com.workpulse.dto.StatsSummaryDto;
import com.workpulse.dto.TopAppDto;
import com.workpulse.dto.WellbeingStatsDto;
import com.workpulse.model.Activity;
import com.workpulse.repository.ActivityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class StatsService {

    private final ActivityRepository activityRepository;

    public StatsService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public StatsSummaryDto getSummary(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        double totalActive = 0.0;
        double totalIdle = 0.0;
        Map<String, Double> appTotals = new HashMap<>();

        for (Activity a : list) {
            double active = a.getActiveTime() != null ? a.getActiveTime() : 0.0;
            double idle = a.getIdleTime() != null ? a.getIdleTime() : 0.0;
            totalActive += active;
            totalIdle += idle;
            appTotals.merge(a.getAppName(), active, Double::sum);
        }

        double totalTracked = totalActive + totalIdle;
        int score = totalTracked > 0 ? (int) Math.round((totalActive / totalTracked) * 100.0) : 100;
        String topApp = appTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        return new StatsSummaryDto(
                Math.round(totalActive * 10.0) / 10.0,
                Math.round(totalIdle * 10.0) / 10.0,
                Math.round(totalTracked * 10.0) / 10.0,
                score,
                list.size(),
                topApp
        );
    }

    public List<TopAppDto> getTopApplications(LocalDate startDate, LocalDate endDate, int limit) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Object[]> rows = activityRepository.findTopApplications(start, end);
        double grandTotal = rows.stream().mapToDouble(r -> ((Number) r[1]).doubleValue()).sum();

        List<TopAppDto> result = new ArrayList<>();
        int count = 0;
        for (Object[] r : rows) {
            if (count++ >= limit) break;
            String name = (String) r[0];
            double active = Math.round(((Number) r[1]).doubleValue() * 10.0) / 10.0;
            double idle = Math.round(((Number) r[2]).doubleValue() * 10.0) / 10.0;
            double pct = grandTotal > 0 ? Math.round((active / grandTotal) * 1000.0) / 10.0 : 0.0;
            result.add(new TopAppDto(name, active, idle, pct, "App"));
        }
        return result;
    }

    public List<HourlyStatsDto> getHourlyDistribution(LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        LocalDateTime start = target.atStartOfDay();
        LocalDateTime end = target.atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        double[] activeByHour = new double[24];
        double[] idleByHour = new double[24];

        for (Activity a : list) {
            int h = a.getStartTime().getHour();
            if (h >= 0 && h < 24) {
                activeByHour[h] += a.getActiveTime() != null ? a.getActiveTime() : 0.0;
                idleByHour[h] += a.getIdleTime() != null ? a.getIdleTime() : 0.0;
            }
        }

        List<HourlyStatsDto> result = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            result.add(new HourlyStatsDto(i, Math.round(activeByHour[i]), Math.round(idleByHour[i])));
        }
        return result;
    }

    public List<Map<String, Object>> getCategoryBreakdown(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Object[]> rows = activityRepository.findCategoryBreakdown(start, end);
        double grandTotal = rows.stream().mapToDouble(r -> ((Number) r[1]).doubleValue()).sum();

        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] r : rows) {
            String cat = (String) r[0];
            double sec = Math.round(((Number) r[1]).doubleValue() * 10.0) / 10.0;
            double pct = grandTotal > 0 ? Math.round((sec / grandTotal) * 1000.0) / 10.0 : 0.0;
            Map<String, Object> item = new HashMap<>();
            item.put("category", cat != null ? cat : "Uncategorized");
            item.put("activeSeconds", sec);
            item.put("percentage", pct);
            list.add(item);
        }
        return list;
    }

    public DeepWorkStatsDto getDeepWorkStats(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        if (list.isEmpty()) {
            return new DeepWorkStatsDto(0.0, 0.0, "None", 0.0, "No Activity", 0);
        }

        // Sort chronologically (ASC)
        List<Activity> chronological = new ArrayList<>(list);
        chronological.sort(Comparator.comparing(Activity::getStartTime));

        double totalActive = 0.0;
        double deepWorkSeconds = 0.0;
        double currentStreak = 0.0;
        double maxStreak = 0.0;
        String currentStreakApp = "";
        String maxStreakApp = "None";
        int contextSwitches = 0;
        String lastApp = null;
        LocalDateTime lastEnd = null;

        for (Activity a : chronological) {
            double active = a.getActiveTime() != null ? a.getActiveTime() : 0.0;
            totalActive += active;

            if (lastApp != null && !lastApp.equalsIgnoreCase(a.getAppName())) {
                contextSwitches++;
            }

            // Streak check: within same app and without long gap (> 3 minutes)
            boolean contiguous = lastEnd != null && java.time.Duration.between(lastEnd, a.getStartTime()).getSeconds() <= 180;
            if (lastApp != null && lastApp.equalsIgnoreCase(a.getAppName()) && contiguous) {
                currentStreak += active;
            } else {
                currentStreak = active;
                currentStreakApp = a.getAppName();
            }

            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
                maxStreakApp = currentStreakApp;
            }

            // Deep work session: continuous active block >= 20 minutes (1200 sec)
            if (active >= 1200.0) {
                deepWorkSeconds += active;
            }

            lastApp = a.getAppName();
            lastEnd = a.getEndTime() != null ? a.getEndTime() : a.getStartTime().plusSeconds((long) active);
        }

        double totalHours = Math.max(totalActive / 3600.0, 0.1);
        double switchesPerHour = Math.round((contextSwitches / totalHours) * 10.0) / 10.0;

        // Flow Score (0 - 100): Ratio of deep work + penalty for excessive switches
        double deepRatio = totalActive > 0 ? (deepWorkSeconds / totalActive) : 0.0;
        int flowScore = (int) Math.max(10, Math.min(100, Math.round((deepRatio * 70.0) + Math.max(0, 30.0 - (switchesPerHour * 1.5)))));
        String rating = flowScore >= 75 ? "Flow State" : (flowScore >= 50 ? "Balanced" : "Fragmented");

        return new DeepWorkStatsDto(
                Math.round(deepWorkSeconds * 10.0) / 10.0,
                Math.round(maxStreak * 10.0) / 10.0,
                maxStreakApp,
                switchesPerHour,
                rating,
                flowScore
        );
    }

    public List<ProjectBreakdownDto> getProjectBreakdown(LocalDate startDate, LocalDate endDate, int limit) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        Map<String, Double> projectTotals = new HashMap<>();
        Map<String, String> projectAppMap = new HashMap<>();
        Map<String, String> projectCategoryMap = new HashMap<>();
        double grandTotal = 0.0;

        for (Activity a : list) {
            double active = a.getActiveTime() != null ? a.getActiveTime() : 0.0;
            if (active <= 0.0) continue;
            grandTotal += active;

            String project = parseProjectFromActivity(a);
            projectTotals.merge(project, active, Double::sum);
            projectAppMap.putIfAbsent(project, a.getAppName());
            projectCategoryMap.putIfAbsent(project, a.getCategory() != null ? a.getCategory() : "Development");
        }

        List<ProjectBreakdownDto> result = new ArrayList<>();
        double finalGrand = grandTotal;
        projectTotals.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit > 0 ? limit : 6)
                .forEach(e -> {
                    String name = e.getKey();
                    double sec = Math.round(e.getValue() * 10.0) / 10.0;
                    double pct = finalGrand > 0 ? Math.round((sec / finalGrand) * 1000.0) / 10.0 : 0.0;
                    result.add(new ProjectBreakdownDto(
                            name,
                            projectCategoryMap.getOrDefault(name, "Development"),
                            sec,
                            pct,
                            projectAppMap.getOrDefault(name, "App")
                    ));
                });

        return result;
    }

    private String parseProjectFromActivity(Activity a) {
        String title = a.getWindowTitle();
        String app = a.getAppName();

        if (title == null || title.isBlank()) {
            return app != null ? app : "General Activity";
        }

        String lowerTitle = title.toLowerCase();
        String lowerApp = app != null ? app.toLowerCase() : "";

        // Meeting / Communication apps
        if (lowerApp.contains("zoom") || lowerApp.contains("teams") || lowerApp.contains("meet") || lowerTitle.contains("meeting") || lowerTitle.contains("meet.google.com")) {
            return "Meetings & Collaboration";
        }
        if (lowerApp.contains("slack") || lowerApp.contains("discord")) {
            return "Team Communications (" + app + ")";
        }

        // IDEs: VS Code, IntelliJ, PyCharm, WebStorm, Android Studio, Eclipse
        if (lowerApp.contains("code") || lowerApp.contains("idea") || lowerApp.contains("pycharm") || lowerApp.contains("studio")) {
            // VS Code typically: "filename - project - Visual Studio Code" or "filename - project"
            if (title.contains(" - ")) {
                String[] parts = title.split(" - ");
                if (parts.length >= 2) {
                    String candidate = parts[parts.length - 2].trim();
                    if (!candidate.equalsIgnoreCase("Visual Studio Code") && candidate.length() < 35) {
                        return candidate;
                    }
                    return parts[0].trim();
                }
            }
            if (title.contains(" [")) { // IntelliJ style: "project [path]"
                return title.substring(0, title.indexOf(" [")).trim();
            }
        }

        // Browsers: GitHub, Jira, Docs, StackOverflow
        if (lowerTitle.contains("github.com") || lowerTitle.contains("github")) {
            return "GitHub & Code Review";
        }
        if (lowerTitle.contains("jira") || lowerTitle.contains("confluence") || lowerTitle.contains("linear")) {
            return "Task & Project Management";
        }
        if (lowerTitle.contains("stackoverflow") || lowerTitle.contains("stack overflow")) {
            return "Technical Research (StackOverflow)";
        }
        if (lowerTitle.contains("google docs") || lowerTitle.contains("notion")) {
            return "Documentation & Notes";
        }

        // Default fallback: App name or shortened window title
        if (title.length() > 30) {
            return app != null ? app : title.substring(0, 27) + "...";
        }
        return title;
    }

    public WellbeingStatsDto getWellbeingStats(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        double coreHoursSeconds = 0.0;
        double overtimeSeconds = 0.0;
        double currentStretch = 0.0;
        double maxStretch = 0.0;
        int breakCount = 0;

        List<Activity> chronological = new ArrayList<>(list);
        chronological.sort(Comparator.comparing(Activity::getStartTime));

        LocalDateTime lastTime = null;
        for (Activity a : chronological) {
            double active = a.getActiveTime() != null ? a.getActiveTime() : 0.0;
            int hour = a.getStartTime().getHour();

            // Core Hours: 9:00 AM to 6:00 PM (18:00)
            if (hour >= 9 && hour < 18) {
                coreHoursSeconds += active;
            } else {
                overtimeSeconds += active;
            }

            // Break calculation (gap of >= 5 minutes / 300 seconds)
            if (lastTime != null) {
                long gap = java.time.Duration.between(lastTime, a.getStartTime()).getSeconds();
                if (gap >= 300) {
                    breakCount++;
                    currentStretch = active;
                } else {
                    currentStretch += active;
                }
            } else {
                currentStretch = active;
            }

            if (currentStretch > maxStretch) {
                maxStretch = currentStretch;
            }

            lastTime = a.getEndTime() != null ? a.getEndTime() : a.getStartTime().plusSeconds((long) active);
        }

        boolean fatigueWarning = maxStretch >= 7200.0; // >= 2 hours continuous
        double totalActive = coreHoursSeconds + overtimeSeconds;
        double overtimeRatio = totalActive > 0 ? (overtimeSeconds / totalActive) : 0.0;

        String risk;
        if (overtimeRatio >= 0.35 || maxStretch >= 9000.0) {
            risk = "High Fatigue Risk";
        } else if (overtimeRatio >= 0.15 || maxStretch >= 6000.0) {
            risk = "Moderate";
        } else {
            risk = "Low / Healthy";
        }

        return new WellbeingStatsDto(
                Math.round(coreHoursSeconds * 10.0) / 10.0,
                Math.round(overtimeSeconds * 10.0) / 10.0,
                Math.round(maxStretch * 10.0) / 10.0,
                breakCount,
                risk,
                fatigueWarning
        );
    }

    public String exportCsv(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Activity> list = activityRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        StringBuilder sb = new StringBuilder();
        sb.append("Timestamp,Application,Window Title,Category,Active Minutes,Idle Minutes\n");

        for (Activity a : list) {
            String time = a.getStartTime() != null ? a.getStartTime().toString() : "";
            String app = escapeCsv(a.getAppName());
            String title = escapeCsv(a.getWindowTitle());
            String cat = escapeCsv(a.getCategory());
            double activeMin = a.getActiveTime() != null ? Math.round((a.getActiveTime() / 60.0) * 10.0) / 10.0 : 0.0;
            double idleMin = a.getIdleTime() != null ? Math.round((a.getIdleTime() / 60.0) * 10.0) / 10.0 : 0.0;

            sb.append(String.format("%s,%s,%s,%s,%.1f,%.1f\n", time, app, title, cat, activeMin, idleMin));
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}