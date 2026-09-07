package com.workpulse.dto;

public class ProcessResourceDto {
    private Integer pid;
    private String name;
    private Double cpuPercent;
    private Double memoryMb;
    private Boolean isForeground;

    public ProcessResourceDto() {}

    public ProcessResourceDto(Integer pid, String name, Double cpuPercent, Double memoryMb, Boolean isForeground) {
        this.pid = pid;
        this.name = name;
        this.cpuPercent = cpuPercent;
        this.memoryMb = memoryMb;
        this.isForeground = isForeground;
    }

    public Integer getPid() {
        return pid;
    }

    public void setPid(Integer pid) {
        this.pid = pid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getCpuPercent() {
        return cpuPercent;
    }

    public void setCpuPercent(Double cpuPercent) {
        this.cpuPercent = cpuPercent;
    }

    public Double getMemoryMb() {
        return memoryMb;
    }

    public void setMemoryMb(Double memoryMb) {
        this.memoryMb = memoryMb;
    }

    public Boolean getIsForeground() {
        return isForeground;
    }

    public void setIsForeground(Boolean isForeground) {
        this.isForeground = isForeground;
    }
}