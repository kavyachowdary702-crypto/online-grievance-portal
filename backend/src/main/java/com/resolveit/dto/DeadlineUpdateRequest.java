package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineUpdateRequest {
    
    @NotNull
    private LocalDateTime deadline;
    
    private String comment;
}