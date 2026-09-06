package com.workpulse.controller;

import com.workpulse.dto.HeartbeatDto;
import com.workpulse.service.IngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/control")
@CrossOrigin(origins = "*")
public class ControlController {

    private final IngestionService ingestionService;
    private final AtomicBoolean isMonitoring = new AtomicBoolean(true);

    public ControlController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
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
        status.put("currentSessionActiveSeconds", (hb != null && hb.getCurrentSessionActiveSeconds() != null) ? hb.getCurrentSessionActiveSeconds() : 0.0);
        status.put("status", "HEALTHY");
        return ResponseEntity.ok(status);
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleMonitoring() {
        boolean newState = !isMonitoring.get();
        isMonitoring.set(newState);
        Map<String, Object> resp = new HashMap<>();
        resp.put("isMonitoring", newState);
        return ResponseEntity.ok(resp);
    }
}