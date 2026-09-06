package com.workpulse.dto;

import java.time.LocalDateTime;

public class IngestActivityDto {
    private String appName;
    private String windowTitle;
    private Integer processId;
    private String executablePath;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double activeTime;
    private Double idleTime;
    private String category;

    public IngestActivityDto() {}

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public String getWindowTitle() { return windowTitle; }
    public void setWindowTitle(String windowTitle) { this.windowTitle = windowTitle; }

    public Integer getProcessId() { return processId; }
    public void setProcessId(Integer processId) { this.processId = processId; }

    public String getExecutablePath() { return executablePath; }
    public void setExecutablePath(String executablePath) { this.executablePath = executablePath; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Double getActiveTime() { return activeTime; }
    public void setActiveTime(Double activeTime) { this.activeTime = activeTime; }

    public Double getIdleTime() { return idleTime; }
    public void setIdleTime(Double idleTime) { this.idleTime = idleTime; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}