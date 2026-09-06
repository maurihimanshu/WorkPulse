package com.workpulse.dto;

import java.time.LocalDateTime;

public class HeartbeatDto {
    private String appName;
    private String windowTitle;
    private Integer processId;
    private String executablePath;
    private Double idleSeconds;
    private Boolean isIdle;
    private Double currentSessionActiveSeconds;
    private Boolean isMonitoring;
    private LocalDateTime timestamp;

    public HeartbeatDto() {}

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public String getWindowTitle() { return windowTitle; }
    public void setWindowTitle(String windowTitle) { this.windowTitle = windowTitle; }

    public Integer getProcessId() { return processId; }
    public void setProcessId(Integer processId) { this.processId = processId; }

    public String getExecutablePath() { return executablePath; }
    public void setExecutablePath(String executablePath) { this.executablePath = executablePath; }

    public Double getIdleSeconds() { return idleSeconds; }
    public void setIdleSeconds(Double idleSeconds) { this.idleSeconds = idleSeconds; }

    public Boolean getIsIdle() { return isIdle; }
    public void setIsIdle(Boolean isIdle) { this.isIdle = isIdle; }

    public Double getCurrentSessionActiveSeconds() { return currentSessionActiveSeconds; }
    public void setCurrentSessionActiveSeconds(Double currentSessionActiveSeconds) { this.currentSessionActiveSeconds = currentSessionActiveSeconds; }

    public Boolean getIsMonitoring() { return isMonitoring; }
    public void setIsMonitoring(Boolean isMonitoring) { this.isMonitoring = isMonitoring; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}