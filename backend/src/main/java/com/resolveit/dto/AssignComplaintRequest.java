package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignComplaintRequest {
    
    @NotNull
    private Long assignToUserId;
    
    private LocalDateTime deadline;
    
    private String comment;
    
    @Override
    public String toString() {
        return "AssignComplaintRequest{" +
                "assignToUserId=" + assignToUserId +
                ", deadline=" + deadline +
                ", comment='" + comment + '\'' +
                '}';
    }
}