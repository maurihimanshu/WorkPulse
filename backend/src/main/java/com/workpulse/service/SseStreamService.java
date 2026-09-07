package com.workpulse.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseStreamService {

    private static final Logger logger = LoggerFactory.getLogger(SseStreamService.class);

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        // 0L creates an infinite timeout for long-lived real-time streaming
        SseEmitter emitter = new SseEmitter(0L);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        emitters.add(emitter);
        logger.debug("Client subscribed to SSE stream. Total active: {}", emitters.size());

        // Send an initial handshake event
        try {
            emitter.send(SseEmitter.event().name("init").data(Map.of("connected", true, "timestamp", System.currentTimeMillis())));
        } catch (Exception e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(String eventName, Object data) {
        if (emitters.isEmpty() || data == null) {
            return;
        }

        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            logger.debug("Removed {} disconnected SSE emitters. Active: {}", deadEmitters.size(), emitters.size());
        }
    }

    @Scheduled(fixedRate = 15000)
    public void sendHeartbeatPing() {
        broadcast("ping", Map.of("time", System.currentTimeMillis()));
    }
}