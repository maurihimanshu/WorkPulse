package com.workpulse.dto;

public class WellbeingStatsDto {
    private double coreHoursSeconds; // 9 AM - 6 PM
    private double overtimeSeconds;  // Before 9 AM or after 6 PM
    private double longestStretchWithoutBreakSeconds;
    private int breakCount;
    private String burnoutRisk;      // "Low / Healthy", "Moderate", "High Fatigue"
    private boolean fatigueWarning;

    public WellbeingStatsDto() {}

    public WellbeingStatsDto(double coreHoursSeconds, double overtimeSeconds,
                             double longestStretchWithoutBreakSeconds, int breakCount,
                             String burnoutRisk, boolean fatigueWarning) {
        this.coreHoursSeconds = coreHoursSeconds;
        this.overtimeSeconds = overtimeSeconds;
        this.longestStretchWithoutBreakSeconds = longestStretchWithoutBreakSeconds;
        this.breakCount = breakCount;
        this.burnoutRisk = burnoutRisk;
        this.fatigueWarning = fatigueWarning;
    }

    public double getCoreHoursSeconds() { return coreHoursSeconds; }
    public void setCoreHoursSeconds(double coreHoursSeconds) { this.coreHoursSeconds = coreHoursSeconds; }

    public double getOvertimeSeconds() { return overtimeSeconds; }
    public void setOvertimeSeconds(double overtimeSeconds) { this.overtimeSeconds = overtimeSeconds; }

    public double getLongestStretchWithoutBreakSeconds() { return longestStretchWithoutBreakSeconds; }
    public void setLongestStretchWithoutBreakSeconds(double longestStretchWithoutBreakSeconds) { this.longestStretchWithoutBreakSeconds = longestStretchWithoutBreakSeconds; }

    public int getBreakCount() { return breakCount; }
    public void setBreakCount(int breakCount) { this.breakCount = breakCount; }

    public String getBurnoutRisk() { return burnoutRisk; }
    public void setBurnoutRisk(String burnoutRisk) { this.burnoutRisk = burnoutRisk; }

    public boolean isFatigueWarning() { return fatigueWarning; }
    public void setFatigueWarning(boolean fatigueWarning) { this.fatigueWarning = fatigueWarning; }
}
