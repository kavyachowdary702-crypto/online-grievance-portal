package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for dashboard analytics data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {
    
    // Overall Statistics
    private Long totalComplaints;
    private Long pendingComplaints;
    private Long resolvedComplaints;
    private Long escalatedComplaints;
    private Double resolutionRate;
    private Double averageResolutionDays;
    
    // Trend Data (for charts)
    private List<TrendDataPoint> complaintsByDate;
    private List<CategoryStatsPoint> complaintsByCategory;
    private List<StatusStatsPoint> complaintsByStatus;
    private List<UrgencyStatsPoint> complaintsByUrgency;
    
    // Officer Performance
    private List<OfficerStatsPoint> officerPerformance;
    
    // Monthly/Weekly trends
    private Map<String, Long> monthlyTrends;
    private Map<String, Long> weeklyTrends;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TrendDataPoint {
        private String date;
        private Long count;
        private Long resolved;
        private Long pending;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CategoryStatsPoint {
        private String category;
        private Long count;
        private Long resolved;
        private Double resolutionRate;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class StatusStatsPoint {
        private String status;
        private Long count;
        private Double percentage;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class UrgencyStatsPoint {
        private String urgency;
        private Long count;
        private Double averageResolutionDays;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class OfficerStatsPoint {
        private String officerName;
        private Long assignedComplaints;
        private Long resolvedComplaints;
        private Double resolutionRate;
        private Double averageResolutionDays;
    }
}