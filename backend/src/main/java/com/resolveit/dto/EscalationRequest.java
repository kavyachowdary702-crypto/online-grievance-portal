package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EscalationRequest {
    private Long escalateToUserId;
    private String reason;
    private String priority; // HIGH, URGENT, CRITICAL
    private String comment;
    private boolean notifyImmediately = true;
}