package com.resolveit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintNoteRequest {
    
    private String comment;
    
    private boolean isInternalNote = true;
}