package com.workpulse.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    private String id = "default";

    private String name = "WorkPulse User";
    private String email = "user@workpulse.local";
    private String roleTitle = "Productivity Champion";
    private Double dailyGoalHours = 6.0;
    private Integer workStartHour = 9;
    private Integer workEndHour = 18;
    private String theme = "dark";

    public UserProfile() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }

    public Double getDailyGoalHours() { return dailyGoalHours; }
    public void setDailyGoalHours(Double dailyGoalHours) { this.dailyGoalHours = dailyGoalHours; }

    public Integer getWorkStartHour() { return workStartHour; }
    public void setWorkStartHour(Integer workStartHour) { this.workStartHour = workStartHour; }

    public Integer getWorkEndHour() { return workEndHour; }
    public void setWorkEndHour(Integer workEndHour) { this.workEndHour = workEndHour; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
}