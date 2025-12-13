package com.resolveit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintRequest {
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Urgency is required")
    private String urgency;
    
    private boolean anonymous = false;
}
