package com.workpulse.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activities", indexes = {
    @Index(name = "idx_act_start_time", columnList = "startTime"),
    @Index(name = "idx_act_app_name", columnList = "appName"),
    @Index(name = "idx_act_category", columnList = "category")
})
public class Activity {

    @Id
    private String id;

    @Column(nullable = false)
    private String appName;

    @Column(length = 1024)
    private String windowTitle;

    private Integer processId;

    @Column(length = 1024)
    private String executablePath;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Double activeTime = 0.0;

    private Double idleTime = 0.0;

    private String category = "Uncategorized";

    private LocalDateTime createdAt = LocalDateTime.now();

    public Activity() {}

    public Activity(String id, String appName, String windowTitle, Integer processId,
                    String executablePath, LocalDateTime startTime, LocalDateTime endTime,
                    Double activeTime, Double idleTime, String category) {
        this.id = id;
        this.appName = appName;
        this.windowTitle = windowTitle;
        this.processId = processId;
        this.executablePath = executablePath;
        this.startTime = startTime;
        this.endTime = endTime;
        this.activeTime = activeTime;
        this.idleTime = idleTime;
        this.category = category;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}