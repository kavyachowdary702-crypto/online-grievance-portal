package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for exporting complaint data to CSV/PDF
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintExportData {
    
    private Long id;
    private String category;
    private String description;
    private String urgency;
    private String status;
    private String submittedBy;
    private String assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deadline;
    private LocalDateTime resolvedAt;
    private Boolean isEscalated;
    private String escalatedTo;
    private Integer resolutionDays;
    private String attachmentPath;
    private Boolean isAnonymous;
    
    // Helper method to format for CSV
    public String[] toCSVArray() {
        return new String[]{
            String.valueOf(id),
            category,
            description.length() > 100 ? description.substring(0, 97) + "..." : description,
            urgency,
            status,
            submittedBy != null ? submittedBy : "Anonymous",
            assignedTo,
            createdAt != null ? createdAt.toString() : "",
            updatedAt != null ? updatedAt.toString() : "",
            deadline != null ? deadline.toString() : "",
            resolvedAt != null ? resolvedAt.toString() : "",
            String.valueOf(isEscalated),
            escalatedTo,
            resolutionDays != null ? String.valueOf(resolutionDays) : "",
            attachmentPath != null ? "Yes" : "No",
            String.valueOf(isAnonymous)
        };
    }
    
    public static String[] getCSVHeaders() {
        return new String[]{
            "ID", "Category", "Description", "Urgency", "Status", 
            "Submitted By", "Assigned To", "Created At", "Updated At", 
            "Deadline", "Resolved At", "Is Escalated", "Escalated To", 
            "Resolution Days", "Has Attachment", "Is Anonymous"
        };
    }
}