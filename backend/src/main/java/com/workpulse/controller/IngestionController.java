package com.workpulse.controller;

import com.workpulse.dto.HeartbeatDto;
import com.workpulse.dto.IngestActivityDto;
import com.workpulse.model.Activity;
import com.workpulse.service.IngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ingest")
@CrossOrigin(origins = "*")
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/activity")
    public ResponseEntity<Activity> ingestActivity(@RequestBody IngestActivityDto dto) {
        Activity saved = ingestionService.ingestActivity(dto);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> updateHeartbeat(@RequestBody HeartbeatDto dto) {
        ingestionService.updateHeartbeat(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/heartbeat")
    public ResponseEntity<HeartbeatDto> getLatestHeartbeat() {
        return ResponseEntity.ok(ingestionService.getLatestHeartbeat());
    }
}