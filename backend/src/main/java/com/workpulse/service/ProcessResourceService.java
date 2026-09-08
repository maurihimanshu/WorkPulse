package com.workpulse.service;

import com.workpulse.dto.IngestProcessResourcesDto;
import com.workpulse.dto.ProcessResourceDto;
import com.workpulse.dto.SystemResourceSummaryDto;
import com.workpulse.model.ProcessMetric;
import com.workpulse.repository.ProcessMetricRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
public class ProcessResourceService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessResourceService.class);

    private final ProcessMetricRepository processMetricRepository;
    private final SseStreamService sseStreamService;
    private final AtomicReference<SystemResourceSummaryDto> latestSnapshot = new AtomicReference<>(new SystemResourceSummaryDto());
    private final ConcurrentLinkedQueue<ProcessMetric> metricBuffer = new ConcurrentLinkedQueue<>();
    private final AtomicInteger ingestionCounter = new AtomicInteger(0);

    public ProcessResourceService(ProcessMetricRepository processMetricRepository, SseStreamService sseStreamService) {
        this.processMetricRepository = processMetricRepository;
        this.sseStreamService = sseStreamService;
    }

    public void processAndStore(IngestProcessResourcesDto dto) {
        if (dto == null) {
            return;
        }

        LocalDateTime ts = dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now();
        List<ProcessResourceDto> processes = dto.getProcesses() != null ? dto.getProcesses() : new ArrayList<>();

        double fgCpu = 0.0;
        double bgCpu = 0.0;
        double fgMem = 0.0;
        double bgMem = 0.0;
        int hogsCount = 0;

        List<ProcessResourceDto> cleanProcesses = new ArrayList<>();

        for (ProcessResourceDto p : processes) {
            if (p.getPid() != null && p.getPid() == 0) {
                continue;
            }
            if (p.getName() != null && (p.getName().equalsIgnoreCase("System Idle Process") || p.getName().equalsIgnoreCase("idle"))) {
                continue;
            }

            cleanProcesses.add(p);

            double cpu = p.getCpuPercent() != null ? p.getCpuPercent() : 0.0;
            double mem = p.getMemoryMb() != null ? p.getMemoryMb() : 0.0;
            boolean isFg = Boolean.TRUE.equals(p.getIsForeground());

            if (isFg) {
                fgCpu += cpu;
                fgMem += mem;
            } else {
                bgCpu += cpu;
                bgMem += mem;
            }

            if (cpu >= 25.0 || mem >= 1500.0) {
                hogsCount++;
            }

            // Buffer notable processes for background batch persistence
            if (isFg || cpu >= 1.0 || mem >= 100.0) {
                metricBuffer.add(new ProcessMetric(
                    UUID.randomUUID().toString(),
                    ts,
                    p.getPid(),
                    p.getName() != null ? p.getName() : "Unknown",
                    cpu,
                    mem,
                    isFg
                ));
            }
        }

        double totalProcCpu = fgCpu + bgCpu;
        double bgDrainRatio = totalProcCpu > 0.0 ? (bgCpu / totalProcCpu) * 100.0 : 0.0;

        SystemResourceSummaryDto summary = new SystemResourceSummaryDto();
        summary.setTimestamp(ts);
        summary.setTotalCpuPercent(dto.getTotalCpuPercent() != null ? dto.getTotalCpuPercent() : 0.0);
        summary.setTotalMemoryMb(dto.getTotalMemoryMb() != null ? dto.getTotalMemoryMb() : 0.0);
        summary.setUsedMemoryMb(dto.getUsedMemoryMb() != null ? dto.getUsedMemoryMb() : 0.0);
        summary.setTotalMemoryPercent(dto.getTotalMemoryPercent() != null ? dto.getTotalMemoryPercent() : 0.0);
        summary.setForegroundCpuPercent(Math.round(fgCpu * 10.0) / 10.0);
        summary.setBackgroundCpuPercent(Math.round(bgCpu * 10.0) / 10.0);
        summary.setForegroundMemoryMb(Math.round(fgMem * 10.0) / 10.0);
        summary.setBackgroundMemoryMb(Math.round(bgMem * 10.0) / 10.0);
        summary.setBackgroundDrainRatio(Math.round(bgDrainRatio * 10.0) / 10.0);
        summary.setResourceHogsCount(hogsCount);
        summary.setTopProcesses(cleanProcesses);

        latestSnapshot.set(summary);
        // Push reactive SSE update to frontend
        sseStreamService.broadcast("resources", summary);

        // Clean up data older than 24 hours every 120 ingest cycles (~10 minutes)
        if (ingestionCounter.incrementAndGet() % 120 == 0) {
            try {
                LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
                processMetricRepository.deleteByTimestampBefore(cutoff);
            } catch (Exception e) {
                logger.warn("Failed to clean up old process metrics: {}", e.getMessage());
            }
        }
    }

    @Scheduled(fixedRate = 20000)
    public void flushMetricBuffer() {
        if (metricBuffer.isEmpty()) {
            return;
        }

        int totalFlushed = 0;
        while (!metricBuffer.isEmpty() && totalFlushed < 1000) {
            List<ProcessMetric> batch = new ArrayList<>();
            ProcessMetric m;
            while (batch.size() < 250 && (m = metricBuffer.poll()) != null) {
                batch.add(m);
            }

            if (!batch.isEmpty()) {
                try {
                    processMetricRepository.saveAll(batch);
                    totalFlushed += batch.size();
                } catch (Exception e) {
                    logger.warn("Failed to batch save process metrics: {}", e.getMessage());
                    break;
                }
            }
        }
        if (totalFlushed > 0) {
            logger.debug("Flushed {} process metrics to database.", totalFlushed);
        }
    }

    public SystemResourceSummaryDto getLatestSnapshot() {
        return latestSnapshot.get();
    }

    public List<ProcessResourceDto> getResourceHogs() {
        SystemResourceSummaryDto current = latestSnapshot.get();
        if (current == null || current.getTopProcesses() == null) {
            return List.of();
        }
        return current.getTopProcesses().stream()
                .filter(p -> (p.getCpuPercent() != null && p.getCpuPercent() >= 20.0)
                        || (p.getMemoryMb() != null && p.getMemoryMb() >= 1000.0))
                .collect(Collectors.toList());
    }
}