package com.workpulse.dto;

public class DeepWorkStatsDto {
    private double deepWorkSeconds;
    private double longestStreakSeconds;
    private String longestStreakApp;
    private double contextSwitchesPerHour;
    private String focusRating; // "Flow State", "Balanced", "Fragmented"
    private int flowScore; // 0 - 100

    public DeepWorkStatsDto() {}

    public DeepWorkStatsDto(double deepWorkSeconds, double longestStreakSeconds,
                            String longestStreakApp, double contextSwitchesPerHour,
                            String focusRating, int flowScore) {
        this.deepWorkSeconds = deepWorkSeconds;
        this.longestStreakSeconds = longestStreakSeconds;
        this.longestStreakApp = longestStreakApp;
        this.contextSwitchesPerHour = contextSwitchesPerHour;
        this.focusRating = focusRating;
        this.flowScore = flowScore;
    }

    public double getDeepWorkSeconds() { return deepWorkSeconds; }
    public void setDeepWorkSeconds(double deepWorkSeconds) { this.deepWorkSeconds = deepWorkSeconds; }

    public double getLongestStreakSeconds() { return longestStreakSeconds; }
    public void setLongestStreakSeconds(double longestStreakSeconds) { this.longestStreakSeconds = longestStreakSeconds; }

    public String getLongestStreakApp() { return longestStreakApp; }
    public void setLongestStreakApp(String longestStreakApp) { this.longestStreakApp = longestStreakApp; }

    public double getContextSwitchesPerHour() { return contextSwitchesPerHour; }
    public void setContextSwitchesPerHour(double contextSwitchesPerHour) { this.contextSwitchesPerHour = contextSwitchesPerHour; }

    public String getFocusRating() { return focusRating; }
    public void setFocusRating(String focusRating) { this.focusRating = focusRating; }

    public int getFlowScore() { return flowScore; }
    public void setFlowScore(int flowScore) { this.flowScore = flowScore; }
}
