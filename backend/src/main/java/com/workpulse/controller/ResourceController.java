package com.workpulse.controller;

import com.workpulse.dto.ProcessResourceDto;
import com.workpulse.dto.SystemResourceSummaryDto;
import com.workpulse.service.ProcessResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stats/resources")
@CrossOrigin(origins = "*")
public class ResourceController {

    private final ProcessResourceService processResourceService;

    public ResourceController(ProcessResourceService processResourceService) {
        this.processResourceService = processResourceService;
    }

    @GetMapping("/current")
    public ResponseEntity<SystemResourceSummaryDto> getCurrentResources() {
        return ResponseEntity.ok(processResourceService.getLatestSnapshot());
    }

    @GetMapping("/hogs")
    public ResponseEntity<List<ProcessResourceDto>> getResourceHogs() {
        return ResponseEntity.ok(processResourceService.getResourceHogs());
    }
}