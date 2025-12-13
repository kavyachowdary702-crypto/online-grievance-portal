package com.resolveit.dto;

import lombok.Data;

@Data
public class ComplaintUpdateRequest {
    private String status;
    private String comment;
    private boolean isInternalNote;
    private Long assignedToUserId;
    private Long escalatedToUserId;
}