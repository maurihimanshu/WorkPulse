package com.workpulse.dto;

public class HourlyStatsDto {
    private int hour;
    private double activeSeconds;
    private double idleSeconds;

    public HourlyStatsDto() {}

    public HourlyStatsDto(int hour, double activeSeconds, double idleSeconds) {
        this.hour = hour;
        this.activeSeconds = activeSeconds;
        this.idleSeconds = idleSeconds;
    }

    public int getHour() { return hour; }
    public void setHour(int hour) { this.hour = hour; }

    public double getActiveSeconds() { return activeSeconds; }
    public void setActiveSeconds(double activeSeconds) { this.activeSeconds = activeSeconds; }

    public double getIdleSeconds() { return idleSeconds; }
    public void setIdleSeconds(double idleSeconds) { this.idleSeconds = idleSeconds; }
}