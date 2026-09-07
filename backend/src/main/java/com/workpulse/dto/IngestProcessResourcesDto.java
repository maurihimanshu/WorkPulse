package com.workpulse.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class IngestProcessResourcesDto {
    private LocalDateTime timestamp;
    private Double totalCpuPercent;
    private Double totalMemoryMb;
    private Double usedMemoryMb;
    private Double totalMemoryPercent;
    private List<ProcessResourceDto> processes = new ArrayList<>();

    public IngestProcessResourcesDto() {}

    public IngestProcessResourcesDto(LocalDateTime timestamp, Double totalCpuPercent, Double totalMemoryMb,
                                     Double usedMemoryMb, Double totalMemoryPercent, List<ProcessResourceDto> processes) {
        this.timestamp = timestamp;
        this.totalCpuPercent = totalCpuPercent;
        this.totalMemoryMb = totalMemoryMb;
        this.usedMemoryMb = usedMemoryMb;
        this.totalMemoryPercent = totalMemoryPercent;
        this.processes = processes != null ? processes : new ArrayList<>();
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Double getTotalCpuPercent() {
        return totalCpuPercent;
    }

    public void setTotalCpuPercent(Double totalCpuPercent) {
        this.totalCpuPercent = totalCpuPercent;
    }

    public Double getTotalMemoryMb() {
        return totalMemoryMb;
    }

    public void setTotalMemoryMb(Double totalMemoryMb) {
        this.totalMemoryMb = totalMemoryMb;
    }

    public Double getUsedMemoryMb() {
        return usedMemoryMb;
    }

    public void setUsedMemoryMb(Double usedMemoryMb) {
        this.usedMemoryMb = usedMemoryMb;
    }

    public Double getTotalMemoryPercent() {
        return totalMemoryPercent;
    }

    public void setTotalMemoryPercent(Double totalMemoryPercent) {
        this.totalMemoryPercent = totalMemoryPercent;
    }

    public List<ProcessResourceDto> getProcesses() {
        return processes;
    }

    public void setProcesses(List<ProcessResourceDto> processes) {
        this.processes = processes;
    }
}