package com.workpulse.dto;

public class StatsSummaryDto {
    private double totalActiveSeconds;
    private double totalIdleSeconds;
    private double totalTrackedSeconds;
    private int productivityScore;
    private long activitiesCount;
    private String topAppName;

    public StatsSummaryDto() {}

    public StatsSummaryDto(double totalActiveSeconds, double totalIdleSeconds,
                           double totalTrackedSeconds, int productivityScore,
                           long activitiesCount, String topAppName) {
        this.totalActiveSeconds = totalActiveSeconds;
        this.totalIdleSeconds = totalIdleSeconds;
        this.totalTrackedSeconds = totalTrackedSeconds;
        this.productivityScore = productivityScore;
        this.activitiesCount = activitiesCount;
        this.topAppName = topAppName;
    }

    public double getTotalActiveSeconds() { return totalActiveSeconds; }
    public void setTotalActiveSeconds(double totalActiveSeconds) { this.totalActiveSeconds = totalActiveSeconds; }

    public double getTotalIdleSeconds() { return totalIdleSeconds; }
    public void setTotalIdleSeconds(double totalIdleSeconds) { this.totalIdleSeconds = totalIdleSeconds; }

    public double getTotalTrackedSeconds() { return totalTrackedSeconds; }
    public void setTotalTrackedSeconds(double totalTrackedSeconds) { this.totalTrackedSeconds = totalTrackedSeconds; }

    public int getProductivityScore() { return productivityScore; }
    public void setProductivityScore(int productivityScore) { this.productivityScore = productivityScore; }

    public long getActivitiesCount() { return activitiesCount; }
    public void setActivitiesCount(long activitiesCount) { this.activitiesCount = activitiesCount; }

    public String getTopAppName() { return topAppName; }
    public void setTopAppName(String topAppName) { this.topAppName = topAppName; }
}