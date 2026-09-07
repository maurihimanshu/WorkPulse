package com.workpulse.dto;

public class ProjectBreakdownDto {
    private String projectName;
    private String category;
    private double activeSeconds;
    private double percentage;
    private String primaryApp;

    public ProjectBreakdownDto() {}

    public ProjectBreakdownDto(String projectName, String category, double activeSeconds,
                               double percentage, String primaryApp) {
        this.projectName = projectName;
        this.category = category;
        this.activeSeconds = activeSeconds;
        this.percentage = percentage;
        this.primaryApp = primaryApp;
    }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getActiveSeconds() { return activeSeconds; }
    public void setActiveSeconds(double activeSeconds) { this.activeSeconds = activeSeconds; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public String getPrimaryApp() { return primaryApp; }
    public void setPrimaryApp(String primaryApp) { this.primaryApp = primaryApp; }
}
