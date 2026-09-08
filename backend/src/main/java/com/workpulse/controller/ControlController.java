package com.workpulse.controller;

import com.workpulse.dto.HeartbeatDto;
import com.workpulse.dto.StatsSummaryDto;
import com.workpulse.service.IngestionService;
import com.workpulse.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/control")
@CrossOrigin(origins = "*")
public class ControlController {

    private final IngestionService ingestionService;
    private final StatsService statsService;
    private final com.workpulse.service.SseStreamService sseStreamService;
    private final AtomicBoolean isMonitoring = new AtomicBoolean(true);
    private final long appStartTime = System.currentTimeMillis();

    public ControlController(IngestionService ingestionService,
                             StatsService statsService,
                             com.workpulse.service.SseStreamService sseStreamService) {
        this.ingestionService = ingestionService;
        this.statsService = statsService;
        this.sseStreamService = sseStreamService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        HeartbeatDto hb = ingestionService.getLatestHeartbeat();
        Map<String, Object> status = new HashMap<>();
        status.put("isMonitoring", isMonitoring.get());
        status.put("currentApp", (hb != null && hb.getAppName() != null) ? hb.getAppName() : "Unknown");
        status.put("currentTitle", (hb != null && hb.getWindowTitle() != null) ? hb.getWindowTitle() : "Unknown");
        status.put("idleSeconds", (hb != null && hb.getIdleSeconds() != null) ? hb.getIdleSeconds() : 0.0);
        status.put("isIdle", (hb != null && hb.getIsIdle() != null) ? hb.getIsIdle() : false);

        double currentAppSec = (hb != null && hb.getCurrentSessionActiveSeconds() != null) ? hb.getCurrentSessionActiveSeconds() : 0.0;
        status.put("currentSessionActiveSeconds", currentAppSec);

        // Overall WorkPulse process / application uptime session seconds
        double workpulseSessionSeconds = (System.currentTimeMillis() - appStartTime) / 1000.0;
        status.put("workpulseSessionSeconds", workpulseSessionSeconds);

        // Calculate today's total active work time tracked by WorkPulse
        double todayActive = 0.0;
        if (statsService != null) {
            try {
                LocalDate today = LocalDate.now();
                StatsSummaryDto summary = statsService.getSummary(today, today);
                if (summary != null) {
                    todayActive = summary.getTotalActiveSeconds();
                }
            } catch (Exception ignored) {
            }
        }
        // Incorporate currently running slice active seconds
        status.put("todayActiveSeconds", todayActive + currentAppSec);
        status.put("status", "HEALTHY");
        return ResponseEntity.ok(status);
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleMonitoring() {
        boolean newState = !isMonitoring.get();
        isMonitoring.set(newState);
        Map<String, Object> resp = new HashMap<>();
        resp.put("isMonitoring", newState);
        sseStreamService.broadcast("control", resp);
        return ResponseEntity.ok(resp);
    }
}