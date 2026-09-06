package com.workpulse.dto;

public class TopAppDto {
    private String appName;
    private double activeSeconds;
    private double idleSeconds;
    private double percentage;
    private String category;

    public TopAppDto() {}

    public TopAppDto(String appName, double activeSeconds, double idleSeconds, double percentage, String category) {
        this.appName = appName;
        this.activeSeconds = activeSeconds;
        this.idleSeconds = idleSeconds;
        this.percentage = percentage;
        this.category = category;
    }

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public double getActiveSeconds() { return activeSeconds; }
    public void setActiveSeconds(double activeSeconds) { this.activeSeconds = activeSeconds; }

    public double getIdleSeconds() { return idleSeconds; }
    public void setIdleSeconds(double idleSeconds) { this.idleSeconds = idleSeconds; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}