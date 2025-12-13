package com.resolveit.dto;

import lombok.Data;

@Data
public class ComplaintTimelineResponse {
    private Long id;
    private String status;
    private String comment;
    private boolean isInternalNote;
    private String updatedByUsername;
    private String timestamp;
}