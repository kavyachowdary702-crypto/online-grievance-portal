package com.resolveit.controller;

import com.resolveit.dto.DashboardStatsResponse;
import com.resolveit.dto.ReportFilterRequest;
import com.resolveit.security.UserDetailsImpl;
import com.resolveit.service.ExportService;
import com.resolveit.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * REST Controller for Reports and Analytics
 * Provides endpoints for dashboard data and export functionality
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {
    
    private final ReportService reportService;
    private final ExportService exportService;
    
    /**
     * Get dashboard statistics for analytics
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('OFFICER')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) List<String> urgencies,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(defaultValue = "true") Boolean includeAnonymous,
            @RequestParam(defaultValue = "category") String groupBy,
            Authentication authentication) {
        
        // Default to last 30 days if no dates provided
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        ReportFilterRequest filter = new ReportFilterRequest();
        filter.setStartDate(start);
        filter.setEndDate(end);
        filter.setCategories(categories);
        filter.setStatuses(statuses);
        filter.setUrgencies(urgencies);
        filter.setAssignedTo(assignedTo);
        filter.setIncludeAnonymous(includeAnonymous);
        filter.setGroupBy(groupBy);
        
        DashboardStatsResponse stats = reportService.generateDashboardStats(filter);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Export complaints data as CSV
     */
    @GetMapping("/export/csv")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('OFFICER')")
    public ResponseEntity<String> exportCSV(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) List<String> urgencies,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(defaultValue = "true") Boolean includeAnonymous,
            Authentication authentication) {
        
        // Default to last 30 days if no dates provided
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        ReportFilterRequest filter = new ReportFilterRequest();
        filter.setStartDate(start);
        filter.setEndDate(end);
        filter.setCategories(categories);
        filter.setStatuses(statuses);
        filter.setUrgencies(urgencies);
        filter.setAssignedTo(assignedTo);
        filter.setIncludeAnonymous(includeAnonymous);
        
        String csvContent = exportService.exportToCSV(filter);
        
        String filename = String.format("complaints_report_%s_to_%s.csv", 
                start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                end.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent);
    }
    
    /**
     * Export complaints report as PDF
     */
    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('OFFICER')")
    public ResponseEntity<byte[]> exportPDF(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) List<String> urgencies,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(defaultValue = "true") Boolean includeAnonymous,
            Authentication authentication) {
        
        // Default to last 30 days if no dates provided
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        ReportFilterRequest filter = new ReportFilterRequest();
        filter.setStartDate(start);
        filter.setEndDate(end);
        filter.setCategories(categories);
        filter.setStatuses(statuses);
        filter.setUrgencies(urgencies);
        filter.setAssignedTo(assignedTo);
        filter.setIncludeAnonymous(includeAnonymous);
        
        byte[] pdfContent = exportService.exportToPDF(filter);
        
        String filename = String.format("complaints_report_%s_to_%s.pdf", 
                start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                end.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }
    
    /**
     * Get available filter options for reports
     */
    @GetMapping("/filters")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('OFFICER')")
    public ResponseEntity<?> getFilterOptions(Authentication authentication) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        return ResponseEntity.ok().body(java.util.Map.of(
            "categories", java.util.Arrays.asList(
                "Technical", "Billing", "Service Quality", "Delivery", 
                "Product Quality", "Customer Service", "Website", "Mobile App", 
                "Security", "Feedback", "Other"
            ),
            "statuses", java.util.Arrays.asList(
                "NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "RESOLVED", "ESCALATED"
            ),
            "urgencies", java.util.Arrays.asList(
                "Low", "Medium", "High", "Critical"
            ),
            "groupByOptions", java.util.Arrays.asList(
                "category", "status", "urgency", "month", "week", "assignedTo"
            )
        ));
    }
    
    /**
     * Get reports summary for admin dashboard
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getReportsSummary(Authentication authentication) {
        
        // Quick stats for admin overview
        LocalDate lastWeek = LocalDate.now().minusDays(7);
        LocalDate today = LocalDate.now();
        
        ReportFilterRequest weekFilter = new ReportFilterRequest(lastWeek, today);
        DashboardStatsResponse weekStats = reportService.generateDashboardStats(weekFilter);
        
        LocalDate lastMonth = LocalDate.now().minusDays(30);
        ReportFilterRequest monthFilter = new ReportFilterRequest(lastMonth, today);
        DashboardStatsResponse monthStats = reportService.generateDashboardStats(monthFilter);
        
        return ResponseEntity.ok().body(java.util.Map.of(
            "lastWeek", java.util.Map.of(
                "totalComplaints", weekStats.getTotalComplaints(),
                "resolutionRate", weekStats.getResolutionRate(),
                "escalatedComplaints", weekStats.getEscalatedComplaints()
            ),
            "lastMonth", java.util.Map.of(
                "totalComplaints", monthStats.getTotalComplaints(),
                "resolutionRate", monthStats.getResolutionRate(),
                "averageResolutionDays", monthStats.getAverageResolutionDays()
            ),
            "availableExportFormats", java.util.Arrays.asList("CSV", "PDF")
        ));
    }
}