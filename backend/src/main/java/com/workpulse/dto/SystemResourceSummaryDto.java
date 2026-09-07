package com.workpulse.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SystemResourceSummaryDto {
    private LocalDateTime timestamp;
    private Double totalCpuPercent = 0.0;
    private Double totalMemoryMb = 0.0;
    private Double usedMemoryMb = 0.0;
    private Double totalMemoryPercent = 0.0;
    private Double foregroundCpuPercent = 0.0;
    private Double backgroundCpuPercent = 0.0;
    private Double foregroundMemoryMb = 0.0;
    private Double backgroundMemoryMb = 0.0;
    private Double backgroundDrainRatio = 0.0;
    private Integer resourceHogsCount = 0;
    private List<ProcessResourceDto> topProcesses = new ArrayList<>();

    public SystemResourceSummaryDto() {}

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

    public Double getForegroundCpuPercent() {
        return foregroundCpuPercent;
    }

    public void setForegroundCpuPercent(Double foregroundCpuPercent) {
        this.foregroundCpuPercent = foregroundCpuPercent;
    }

    public Double getBackgroundCpuPercent() {
        return backgroundCpuPercent;
    }

    public void setBackgroundCpuPercent(Double backgroundCpuPercent) {
        this.backgroundCpuPercent = backgroundCpuPercent;
    }

    public Double getForegroundMemoryMb() {
        return foregroundMemoryMb;
    }

    public void setForegroundMemoryMb(Double foregroundMemoryMb) {
        this.foregroundMemoryMb = foregroundMemoryMb;
    }

    public Double getBackgroundMemoryMb() {
        return backgroundMemoryMb;
    }

    public void setBackgroundMemoryMb(Double backgroundMemoryMb) {
        this.backgroundMemoryMb = backgroundMemoryMb;
    }

    public Double getBackgroundDrainRatio() {
        return backgroundDrainRatio;
    }

    public void setBackgroundDrainRatio(Double backgroundDrainRatio) {
        this.backgroundDrainRatio = backgroundDrainRatio;
    }

    public Integer getResourceHogsCount() {
        return resourceHogsCount;
    }

    public void setResourceHogsCount(Integer resourceHogsCount) {
        this.resourceHogsCount = resourceHogsCount;
    }

    public List<ProcessResourceDto> getTopProcesses() {
        return topProcesses;
    }

    public void setTopProcesses(List<ProcessResourceDto> topProcesses) {
        this.topProcesses = topProcesses;
    }
}