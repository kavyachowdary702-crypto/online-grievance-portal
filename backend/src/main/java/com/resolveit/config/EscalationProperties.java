package com.resolveit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.escalation")
public class EscalationProperties {
    
    // Default escalation thresholds (in hours)
    private int unassignedThresholdHours = 48; // 2 days
    private int overdueThresholdHours = 24; // 1 day after deadline
    private int stuckThresholdHours = 72; // 3 days without update
    private int highUrgencyThresholdHours = 24; // 1 day for high urgency
    private int mediumUrgencyThresholdHours = 72; // 3 days for medium urgency
    private int lowUrgencyThresholdHours = 120; // 5 days for low urgency
    
    // Scheduling configuration
    private long schedulingIntervalMs = 3600000; // 1 hour in milliseconds
    private boolean enableAutoEscalation = true;
    
    // Email notification settings (for future implementation)
    private boolean enableEmailNotifications = true;
    private String notificationEmailSubject = "ResolveIT - Complaint Auto-Escalated";
    
    // Getters and Setters
    public int getUnassignedThresholdHours() {
        return unassignedThresholdHours;
    }
    
    public void setUnassignedThresholdHours(int unassignedThresholdHours) {
        this.unassignedThresholdHours = unassignedThresholdHours;
    }
    
    public int getOverdueThresholdHours() {
        return overdueThresholdHours;
    }
    
    public void setOverdueThresholdHours(int overdueThresholdHours) {
        this.overdueThresholdHours = overdueThresholdHours;
    }
    
    public int getStuckThresholdHours() {
        return stuckThresholdHours;
    }
    
    public void setStuckThresholdHours(int stuckThresholdHours) {
        this.stuckThresholdHours = stuckThresholdHours;
    }
    
    public int getHighUrgencyThresholdHours() {
        return highUrgencyThresholdHours;
    }
    
    public void setHighUrgencyThresholdHours(int highUrgencyThresholdHours) {
        this.highUrgencyThresholdHours = highUrgencyThresholdHours;
    }
    
    public int getMediumUrgencyThresholdHours() {
        return mediumUrgencyThresholdHours;
    }
    
    public void setMediumUrgencyThresholdHours(int mediumUrgencyThresholdHours) {
        this.mediumUrgencyThresholdHours = mediumUrgencyThresholdHours;
    }
    
    public int getLowUrgencyThresholdHours() {
        return lowUrgencyThresholdHours;
    }
    
    public void setLowUrgencyThresholdHours(int lowUrgencyThresholdHours) {
        this.lowUrgencyThresholdHours = lowUrgencyThresholdHours;
    }
    
    public long getSchedulingIntervalMs() {
        return schedulingIntervalMs;
    }
    
    public void setSchedulingIntervalMs(long schedulingIntervalMs) {
        this.schedulingIntervalMs = schedulingIntervalMs;
    }
    
    public boolean isEnableAutoEscalation() {
        return enableAutoEscalation;
    }
    
    public void setEnableAutoEscalation(boolean enableAutoEscalation) {
        this.enableAutoEscalation = enableAutoEscalation;
    }
    
    public boolean isEnableEmailNotifications() {
        return enableEmailNotifications;
    }
    
    public void setEnableEmailNotifications(boolean enableEmailNotifications) {
        this.enableEmailNotifications = enableEmailNotifications;
    }
    
    public String getNotificationEmailSubject() {
        return notificationEmailSubject;
    }
    
    public void setNotificationEmailSubject(String notificationEmailSubject) {
        this.notificationEmailSubject = notificationEmailSubject;
    }
}