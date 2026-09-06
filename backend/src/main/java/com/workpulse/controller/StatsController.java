package com.workpulse.controller;

import com.workpulse.dto.HourlyStatsDto;
import com.workpulse.dto.StatsSummaryDto;
import com.workpulse.dto.TopAppDto;
import com.workpulse.service.StatsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<StatsSummaryDto> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(statsService.getSummary(startDate, endDate));
    }

    @GetMapping("/top-apps")
    public ResponseEntity<List<TopAppDto>> getTopApps(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(statsService.getTopApplications(startDate, endDate, limit));
    }

    @GetMapping("/hourly")
    public ResponseEntity<List<HourlyStatsDto>> getHourly(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(statsService.getHourlyDistribution(date));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(statsService.getCategoryBreakdown(startDate, endDate));
    }
}