package com.workpulse.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_metrics", indexes = {
    @Index(name = "idx_proc_ts", columnList = "timestamp"),
    @Index(name = "idx_proc_name", columnList = "processName")
})
public class ProcessMetric {

    @Id
    private String id;

    private LocalDateTime timestamp;

    private Integer pid;

    private String processName;

    private Double cpuPercent;

    private Double memoryMb;

    private Boolean isForeground;

    public ProcessMetric() {}

    public ProcessMetric(String id, LocalDateTime timestamp, Integer pid, String processName,
                         Double cpuPercent, Double memoryMb, Boolean isForeground) {
        this.id = id;
        this.timestamp = timestamp;
        this.pid = pid;
        this.processName = processName;
        this.cpuPercent = cpuPercent;
        this.memoryMb = memoryMb;
        this.isForeground = isForeground;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Integer getPid() {
        return pid;
    }

    public void setPid(Integer pid) {
        this.pid = pid;
    }

    public String getProcessName() {
        return processName;
    }

    public void setProcessName(String processName) {
        this.processName = processName;
    }

    public Double getCpuPercent() {
        return cpuPercent;
    }

    public void setCpuPercent(Double cpuPercent) {
        this.cpuPercent = cpuPercent;
    }

    public Double getMemoryMb() {
        return memoryMb;
    }

    public void setMemoryMb(Double memoryMb) {
        this.memoryMb = memoryMb;
    }

    public Boolean getIsForeground() {
        return isForeground;
    }

    public void setIsForeground(Boolean isForeground) {
        this.isForeground = isForeground;
    }
}