package com.workpulse.service;

import com.workpulse.dto.HourlyStatsDto;
import com.workpulse.dto.StatsSummaryDto;
import com.workpulse.dto.TopAppDto;
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
}