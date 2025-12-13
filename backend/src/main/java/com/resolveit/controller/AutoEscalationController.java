package com.resolveit.controller;

import com.resolveit.dto.ComplaintResponse;
import com.resolveit.dto.MessageResponse;
import com.resolveit.service.AutoEscalationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Automated Escalation Management
 * 
 * Only ADMIN users can access these endpoints
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auto-escalation")
public class AutoEscalationController {
    
    @Autowired
    private AutoEscalationService autoEscalationService;
    
    /**
     * Get escalation statistics - ADMIN only
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getEscalationStats() {
        try {
            AutoEscalationService.EscalationStats stats = autoEscalationService.getEscalationStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get complaints that are candidates for escalation - ADMIN only
     */
    @GetMapping("/candidates")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getEscalationCandidates() {
        try {
            List<ComplaintResponse> candidates = autoEscalationService.findEscalationCandidates()
                    .stream()
                    .map(ComplaintResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Test endpoint to verify auto-escalation service is working - ADMIN only
     */
    @GetMapping("/test")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> testAutoEscalationService() {
        try {
            System.out.println("=== Auto-escalation test endpoint called ===");
            
            // Test basic service functionality
            AutoEscalationService.EscalationStats stats = autoEscalationService.getEscalationStats();
            int candidatesCount = autoEscalationService.findEscalationCandidates().size();
            
            System.out.println("Test endpoint - Stats: " + stats.getTotalEscalated() + ", Candidates: " + candidatesCount);
            
            return ResponseEntity.ok(new MessageResponse(
                String.format("Auto-escalation service is working. Stats: Total=%d, Candidates=%d", 
                    stats.getTotalEscalated(), candidatesCount)
            ));
        } catch (Exception e) {
            System.err.println("Error in auto-escalation test endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new MessageResponse("Test failed: " + e.getMessage()));
        }
    }

    /**
     * Manually trigger escalation check - ADMIN only
     */
    @PostMapping("/trigger")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> triggerEscalationCheck() {
        try {
            System.out.println("=== Manual escalation trigger endpoint called ===");
            autoEscalationService.triggerManualEscalationCheck();
            System.out.println("Manual escalation check completed successfully from endpoint");
            return ResponseEntity.ok(new MessageResponse("Manual escalation check triggered successfully"));
        } catch (Exception e) {
            System.err.println("Error in manual escalation trigger endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get escalation configuration/thresholds - ADMIN only
     */
    @GetMapping("/config")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getEscalationConfig() {
        try {
            EscalationConfig config = new EscalationConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Simple health check endpoint - no authentication required
     * This endpoint is publicly accessible to test basic connectivity
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            System.out.println("=== Auto-escalation health check called ===");
            
            // Basic health information
            String status = "Auto-escalation service is running";
            String timestamp = java.time.LocalDateTime.now().toString();
            
            // Create a simple health response
            java.util.Map<String, String> healthInfo = new java.util.HashMap<>();
            healthInfo.put("status", "UP");
            healthInfo.put("service", "Auto-escalation");
            healthInfo.put("timestamp", timestamp);
            healthInfo.put("message", status);
            
            return ResponseEntity.ok(healthInfo);
        } catch (Exception e) {
            System.err.println("Error in health check: " + e.getMessage());
            e.printStackTrace();
            
            java.util.Map<String, String> errorInfo = new java.util.HashMap<>();
            errorInfo.put("status", "DOWN");
            errorInfo.put("service", "Auto-escalation");
            errorInfo.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(errorInfo);
        }
    }
    
    /**
     * Inner class for escalation configuration
     */
    public static class EscalationConfig {
        private final int unassignedThresholdHours = 48;
        private final int overdueThresholdHours = 24;
        private final int stuckThresholdHours = 72;
        private final int highUrgencyThresholdHours = 24;
        private final int mediumUrgencyThresholdHours = 72;
        private final int lowUrgencyThresholdHours = 120;
        private final String schedulingInterval = "Every hour";
        
        // Getters
        public int getUnassignedThresholdHours() { return unassignedThresholdHours; }
        public int getOverdueThresholdHours() { return overdueThresholdHours; }
        public int getStuckThresholdHours() { return stuckThresholdHours; }
        public int getHighUrgencyThresholdHours() { return highUrgencyThresholdHours; }
        public int getMediumUrgencyThresholdHours() { return mediumUrgencyThresholdHours; }
        public int getLowUrgencyThresholdHours() { return lowUrgencyThresholdHours; }
        public String getSchedulingInterval() { return schedulingInterval; }
    }
}