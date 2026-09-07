package com.workpulse.controller;

import com.workpulse.service.SseStreamService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamController {

    private final SseStreamService sseStreamService;

    public StreamController(SseStreamService sseStreamService) {
        this.sseStreamService = sseStreamService;
    }

    @GetMapping(value = "/live", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLiveEvents() {
        return sseStreamService.subscribe();
    }
}