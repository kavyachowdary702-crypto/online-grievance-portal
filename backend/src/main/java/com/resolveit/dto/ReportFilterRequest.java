package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for filtering report data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportFilterRequest {
    
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> categories;
    private List<String> statuses;
    private List<String> urgencies;
    private String assignedTo; // Officer username
    private Boolean includeAnonymous;
    private String groupBy; // "category", "status", "urgency", "month", "week"
    
    // Default constructor sets last 30 days
    public ReportFilterRequest(LocalDate startDate, LocalDate endDate) {
        this.startDate = startDate != null ? startDate : LocalDate.now().minusDays(30);
        this.endDate = endDate != null ? endDate : LocalDate.now();
        this.includeAnonymous = true;
    }
}