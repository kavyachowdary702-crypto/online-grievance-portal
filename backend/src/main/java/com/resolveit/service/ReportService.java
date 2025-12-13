package com.resolveit.service;

import com.resolveit.dto.*;
import com.resolveit.entity.Complaint;
import com.resolveit.entity.User;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating reports and analytics on complaint data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {
    
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    
    /**
     * Generate comprehensive dashboard statistics
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse generateDashboardStats(ReportFilterRequest filter) {
        log.info("Generating dashboard stats for period: {} to {}", filter.getStartDate(), filter.getEndDate());
        
        LocalDateTime startDateTime = filter.getStartDate().atStartOfDay();
        LocalDateTime endDateTime = filter.getEndDate().atTime(23, 59, 59);
        
        // Get filtered complaints
        List<Complaint> filteredComplaints = getFilteredComplaints(filter);
        
        return DashboardStatsResponse.builder()
                .totalComplaints((long) filteredComplaints.size())
                .pendingComplaints(countByStatus(filteredComplaints, Arrays.asList("NEW", "ASSIGNED", "IN_PROGRESS")))
                .resolvedComplaints(countByStatus(filteredComplaints, Arrays.asList("COMPLETED", "RESOLVED")))
                .escalatedComplaints(filteredComplaints.stream().mapToLong(c -> c.isEscalated() ? 1 : 0).sum())
                .resolutionRate(calculateResolutionRate(filteredComplaints))
                .averageResolutionDays(calculateAverageResolutionDays(filteredComplaints))
                .complaintsByDate(generateDateTrends(filteredComplaints, filter))
                .complaintsByCategory(generateCategoryStats(filteredComplaints))
                .complaintsByStatus(generateStatusStats(filteredComplaints))
                .complaintsByUrgency(generateUrgencyStats(filteredComplaints))
                .officerPerformance(generateOfficerStats(filteredComplaints))
                .monthlyTrends(generateMonthlyTrends(filteredComplaints))
                .weeklyTrends(generateWeeklyTrends(filteredComplaints))
                .build();
    }
    
    /**
     * Get export data for complaints
     */
    @Transactional(readOnly = true)
    public List<ComplaintExportData> getExportData(ReportFilterRequest filter) {
        List<Complaint> complaints = getFilteredComplaints(filter);
        
        return complaints.stream()
                .map(this::mapToExportData)
                .collect(Collectors.toList());
    }
    
    /**
     * Filter complaints based on criteria
     */
    private List<Complaint> getFilteredComplaints(ReportFilterRequest filter) {
        LocalDateTime startDateTime = filter.getStartDate().atStartOfDay();
        LocalDateTime endDateTime = filter.getEndDate().atTime(23, 59, 59);
        
        List<Complaint> allComplaints = complaintRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        return allComplaints.stream()
                .filter(complaint -> filterByCategories(complaint, filter.getCategories()))
                .filter(complaint -> filterByStatuses(complaint, filter.getStatuses()))
                .filter(complaint -> filterByUrgencies(complaint, filter.getUrgencies()))
                .filter(complaint -> filterByOfficer(complaint, filter.getAssignedTo()))
                .filter(complaint -> filterByAnonymous(complaint, filter.getIncludeAnonymous()))
                .collect(Collectors.toList());
    }
    
    private boolean filterByCategories(Complaint complaint, List<String> categories) {
        return categories == null || categories.isEmpty() || categories.contains(complaint.getCategory());
    }
    
    private boolean filterByStatuses(Complaint complaint, List<String> statuses) {
        return statuses == null || statuses.isEmpty() || statuses.contains(complaint.getStatus().toString());
    }
    
    private boolean filterByUrgencies(Complaint complaint, List<String> urgencies) {
        return urgencies == null || urgencies.isEmpty() || urgencies.contains(complaint.getUrgency());
    }
    
    private boolean filterByOfficer(Complaint complaint, String officerUsername) {
        if (officerUsername == null || officerUsername.trim().isEmpty()) {
            return true;
        }
        return complaint.getAssignedTo() != null && 
               complaint.getAssignedTo().getUsername().equals(officerUsername);
    }
    
    private boolean filterByAnonymous(Complaint complaint, Boolean includeAnonymous) {
        if (includeAnonymous == null || includeAnonymous) {
            return true;
        }
        return !complaint.isAnonymous();
    }
    
    private Long countByStatus(List<Complaint> complaints, List<String> statuses) {
        return complaints.stream()
                .mapToLong(c -> statuses.contains(c.getStatus().toString()) ? 1 : 0)
                .sum();
    }
    
    private Double calculateResolutionRate(List<Complaint> complaints) {
        if (complaints.isEmpty()) return 0.0;
        
        long resolved = complaints.stream()
                .mapToLong(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()) ? 1 : 0)
                .sum();
        
        return (double) resolved / complaints.size() * 100;
    }
    
    private Double calculateAverageResolutionDays(List<Complaint> complaints) {
        List<Complaint> resolvedComplaints = complaints.stream()
                .filter(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()))
                .filter(c -> c.getUpdatedAt() != null)
                .collect(Collectors.toList());
        
        if (resolvedComplaints.isEmpty()) return 0.0;
        
        double totalDays = resolvedComplaints.stream()
                .mapToDouble(c -> ChronoUnit.DAYS.between(c.getCreatedAt(), c.getUpdatedAt()))
                .sum();
        
        return totalDays / resolvedComplaints.size();
    }
    
    private List<DashboardStatsResponse.TrendDataPoint> generateDateTrends(List<Complaint> complaints, ReportFilterRequest filter) {
        Map<LocalDate, List<Complaint>> complaintsByDate = complaints.stream()
                .collect(Collectors.groupingBy(c -> c.getCreatedAt().toLocalDate()));
        
        List<DashboardStatsResponse.TrendDataPoint> trends = new ArrayList<>();
        LocalDate current = filter.getStartDate();
        
        while (!current.isAfter(filter.getEndDate())) {
            List<Complaint> dayComplaints = complaintsByDate.getOrDefault(current, Collections.emptyList());
            long resolved = dayComplaints.stream()
                    .mapToLong(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()) ? 1 : 0)
                    .sum();
            
            trends.add(DashboardStatsResponse.TrendDataPoint.builder()
                    .date(current.format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .count((long) dayComplaints.size())
                    .resolved(resolved)
                    .pending((long) dayComplaints.size() - resolved)
                    .build());
            
            current = current.plusDays(1);
        }
        
        return trends;
    }
    
    private List<DashboardStatsResponse.CategoryStatsPoint> generateCategoryStats(List<Complaint> complaints) {
        Map<String, List<Complaint>> complaintsByCategory = complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory));
        
        return complaintsByCategory.entrySet().stream()
                .map(entry -> {
                    String category = entry.getKey();
                    List<Complaint> categoryComplaints = entry.getValue();
                    long resolved = categoryComplaints.stream()
                            .mapToLong(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()) ? 1 : 0)
                            .sum();
                    
                    return DashboardStatsResponse.CategoryStatsPoint.builder()
                            .category(category)
                            .count((long) categoryComplaints.size())
                            .resolved(resolved)
                            .resolutionRate(categoryComplaints.isEmpty() ? 0.0 : (double) resolved / categoryComplaints.size() * 100)
                            .build();
                })
                .sorted(Comparator.comparing(DashboardStatsResponse.CategoryStatsPoint::getCount).reversed())
                .collect(Collectors.toList());
    }
    
    private List<DashboardStatsResponse.StatusStatsPoint> generateStatusStats(List<Complaint> complaints) {
        Map<String, Long> statusCounts = complaints.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getStatus().toString(),
                    Collectors.counting()
                ));
        
        long total = complaints.size();
        
        return statusCounts.entrySet().stream()
                .map(entry -> DashboardStatsResponse.StatusStatsPoint.builder()
                        .status(entry.getKey())
                        .count(entry.getValue())
                        .percentage(total == 0 ? 0.0 : (double) entry.getValue() / total * 100)
                        .build())
                .sorted(Comparator.comparing(DashboardStatsResponse.StatusStatsPoint::getCount).reversed())
                .collect(Collectors.toList());
    }
    
    private List<DashboardStatsResponse.UrgencyStatsPoint> generateUrgencyStats(List<Complaint> complaints) {
        Map<String, List<Complaint>> complaintsByUrgency = complaints.stream()
                .collect(Collectors.groupingBy(Complaint::getUrgency));
        
        return complaintsByUrgency.entrySet().stream()
                .map(entry -> {
                    String urgency = entry.getKey();
                    List<Complaint> urgencyComplaints = entry.getValue();
                    
                    double avgDays = urgencyComplaints.stream()
                            .filter(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()))
                            .filter(c -> c.getUpdatedAt() != null)
                            .mapToDouble(c -> ChronoUnit.DAYS.between(c.getCreatedAt(), c.getUpdatedAt()))
                            .average()
                            .orElse(0.0);
                    
                    return DashboardStatsResponse.UrgencyStatsPoint.builder()
                            .urgency(urgency)
                            .count((long) urgencyComplaints.size())
                            .averageResolutionDays(avgDays)
                            .build();
                })
                .sorted(Comparator.comparing(DashboardStatsResponse.UrgencyStatsPoint::getCount).reversed())
                .collect(Collectors.toList());
    }
    
    private List<DashboardStatsResponse.OfficerStatsPoint> generateOfficerStats(List<Complaint> complaints) {
        Map<User, List<Complaint>> complaintsByOfficer = complaints.stream()
                .filter(c -> c.getAssignedTo() != null)
                .collect(Collectors.groupingBy(Complaint::getAssignedTo));
        
        return complaintsByOfficer.entrySet().stream()
                .map(entry -> {
                    User officer = entry.getKey();
                    List<Complaint> officerComplaints = entry.getValue();
                    
                    long resolved = officerComplaints.stream()
                            .mapToLong(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()) ? 1 : 0)
                            .sum();
                    
                    double avgDays = officerComplaints.stream()
                            .filter(c -> Arrays.asList("COMPLETED", "RESOLVED").contains(c.getStatus().toString()))
                            .filter(c -> c.getUpdatedAt() != null)
                            .mapToDouble(c -> ChronoUnit.DAYS.between(c.getCreatedAt(), c.getUpdatedAt()))
                            .average()
                            .orElse(0.0);
                    
                    return DashboardStatsResponse.OfficerStatsPoint.builder()
                            .officerName(officer.getFullName())
                            .assignedComplaints((long) officerComplaints.size())
                            .resolvedComplaints(resolved)
                            .resolutionRate(officerComplaints.isEmpty() ? 0.0 : (double) resolved / officerComplaints.size() * 100)
                            .averageResolutionDays(avgDays)
                            .build();
                })
                .sorted(Comparator.comparing(DashboardStatsResponse.OfficerStatsPoint::getResolutionRate).reversed())
                .collect(Collectors.toList());
    }
    
    private Map<String, Long> generateMonthlyTrends(List<Complaint> complaints) {
        return complaints.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    Collectors.counting()
                ));
    }
    
    private Map<String, Long> generateWeeklyTrends(List<Complaint> complaints) {
        return complaints.stream()
                .collect(Collectors.groupingBy(
                    c -> "Week " + c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-ww")),
                    Collectors.counting()
                ));
    }
    
    private ComplaintExportData mapToExportData(Complaint complaint) {
        ComplaintExportData exportData = new ComplaintExportData();
        exportData.setId(complaint.getId());
        exportData.setCategory(complaint.getCategory());
        exportData.setDescription(complaint.getDescription());
        exportData.setUrgency(complaint.getUrgency());
        exportData.setStatus(complaint.getStatus().toString());
        exportData.setSubmittedBy(complaint.getUser() != null ? complaint.getUser().getUsername() : "Anonymous");
        exportData.setAssignedTo(complaint.getAssignedTo() != null ? complaint.getAssignedTo().getFullName() : "");
        exportData.setCreatedAt(complaint.getCreatedAt());
        exportData.setUpdatedAt(complaint.getUpdatedAt());
        exportData.setDeadline(complaint.getDeadline());
        exportData.setIsEscalated(complaint.isEscalated());
        exportData.setEscalatedTo(complaint.getEscalatedTo() != null ? complaint.getEscalatedTo().getFullName() : "");
        exportData.setAttachmentPath(complaint.getAttachmentPath());
        exportData.setIsAnonymous(complaint.isAnonymous());
        
        // Calculate resolution days if resolved
        if (Arrays.asList("COMPLETED", "RESOLVED").contains(complaint.getStatus().toString()) && 
            complaint.getUpdatedAt() != null) {
            exportData.setResolvedAt(complaint.getUpdatedAt());
            exportData.setResolutionDays((int) ChronoUnit.DAYS.between(complaint.getCreatedAt(), complaint.getUpdatedAt()));
        }
        
        return exportData;
    }
}