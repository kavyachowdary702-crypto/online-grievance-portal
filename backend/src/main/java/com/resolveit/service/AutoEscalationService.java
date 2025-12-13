package com.resolveit.service;

import com.resolveit.entity.Complaint;
import com.resolveit.entity.User;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AutoEscalationService {
    
    @Autowired
    private ComplaintRepository complaintRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    // Escalation thresholds (in hours) - as per requirements
    private static final int UNASSIGNED_ESCALATION_THRESHOLD = 48;  // 2 days for unassigned complaints
    private static final int OVERDUE_ESCALATION_THRESHOLD = 24;     // 1 day after deadline
    private static final int STUCK_ESCALATION_THRESHOLD = 72;       // 3 days without update for in-progress
    private static final int HIGH_URGENCY_THRESHOLD = 24;           // 1 day for HIGH urgency
    private static final int MEDIUM_URGENCY_THRESHOLD = 72;         // 3 days for MEDIUM urgency  
    private static final int LOW_URGENCY_THRESHOLD = 120;           // 5 days for LOW urgency
    
    /**
     * Scheduled task to run auto-escalation every hour
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    public void performAutoEscalation() {
        System.out.println("=== Running Auto-Escalation Check at " + LocalDateTime.now() + " ===");
        
        try {
            List<Complaint> candidatesForEscalation = findEscalationCandidates();
            System.out.println("Found " + candidatesForEscalation.size() + " complaints for auto-escalation");
            
            for (Complaint complaint : candidatesForEscalation) {
                escalateComplaint(complaint);
            }
            
            System.out.println("Auto-escalation process completed successfully");
        } catch (Exception e) {
            System.err.println("Error during auto-escalation: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Find complaints that need automatic escalation
     */
    public List<Complaint> findEscalationCandidates() {
        LocalDateTime now = LocalDateTime.now();
        
        List<Complaint> allComplaints = complaintRepository.findAll();
        System.out.println("Total complaints in system: " + allComplaints.size());
        
        List<Complaint> candidates = allComplaints.stream()
                .filter(complaint -> {
                    // Exclude already escalated complaints
                    if (complaint.isEscalated()) {
                        System.out.println("Excluding complaint #" + complaint.getId() + " - already escalated");
                        return false;
                    }
                    
                    // Exclude final status complaints
                    if (complaint.getStatus() == Complaint.ComplaintStatus.COMPLETED ||
                        complaint.getStatus() == Complaint.ComplaintStatus.RESOLVED ||
                        complaint.getStatus() == Complaint.ComplaintStatus.CLOSED) {
                        System.out.println("Excluding complaint #" + complaint.getId() + " - final status: " + complaint.getStatus());
                        return false;
                    }
                    
                    return true;
                })
                .filter(complaint -> {
                    boolean shouldEscalate = shouldEscalate(complaint, now);
                    if (shouldEscalate) {
                        System.out.println("Complaint #" + complaint.getId() + " is candidate for escalation - Status: " + complaint.getStatus());
                    }
                    return shouldEscalate;
                })
                .collect(Collectors.toList());
                
        System.out.println("Found " + candidates.size() + " escalation candidates");
        return candidates;
    }
    
    /**
     * Determine if a complaint should be escalated based on various criteria
     */
    private boolean shouldEscalate(Complaint complaint, LocalDateTime now) {
        System.out.println("Evaluating complaint #" + complaint.getId() + " for escalation:");
        System.out.println("  - Status: " + complaint.getStatus());
        System.out.println("  - Created: " + complaint.getCreatedAt());
        System.out.println("  - Assigned to: " + (complaint.getAssignedTo() != null ? complaint.getAssignedTo().getUsername() : "UNASSIGNED"));
        System.out.println("  - Deadline: " + complaint.getDeadline());
        System.out.println("  - Urgency: " + complaint.getUrgency());
        
        // 1. Unassigned too long
        if (isUnassignedTooLong(complaint, now)) {
            System.out.println("  → ESCALATE: Unassigned too long");
            return true;
        }
        
        // 2. Overdue deadline
        if (isOverdueDeadline(complaint, now)) {
            System.out.println("  → ESCALATE: Overdue deadline");
            return true;
        }
        
        // 3. Stuck in progress without updates
        if (isStuckInProgress(complaint, now)) {
            System.out.println("  → ESCALATE: Stuck in progress");
            return true;
        }
        
        // 4. Urgency-based escalation
        if (isUrgencyBasedEscalation(complaint, now)) {
            System.out.println("  → ESCALATE: Urgency-based criteria met");
            return true;
        }
        
        System.out.println("  → NO ESCALATION: No criteria met");
        return false;
    }
    
    private boolean isUnassignedTooLong(Complaint complaint, LocalDateTime now) {
        // CRITERIA: Unassigned complaints → 48 hours (2 days)
        return complaint.getAssignedTo() == null && 
               complaint.getCreatedAt().plusHours(UNASSIGNED_ESCALATION_THRESHOLD).isBefore(now);
    }
    
    private boolean isOverdueDeadline(Complaint complaint, LocalDateTime now) {
        // CRITERIA: Overdue deadlines → 24 hours after deadline
        return complaint.getDeadline() != null && 
               complaint.getDeadline().plusHours(OVERDUE_ESCALATION_THRESHOLD).isBefore(now);
    }
    
    private boolean isStuckInProgress(Complaint complaint, LocalDateTime now) {
        // CRITERIA: Stuck in progress → 72 hours (3 days) without update
        return complaint.getStatus() == Complaint.ComplaintStatus.IN_PROGRESS &&
               complaint.getUpdatedAt() != null &&
               complaint.getUpdatedAt().plusHours(STUCK_ESCALATION_THRESHOLD).isBefore(now);
    }
    
    private boolean isUrgencyBasedEscalation(Complaint complaint, LocalDateTime now) {
        if (complaint.getUrgency() == null) return false;
        
        // CRITERIA: Urgency-based escalation - HIGH: 24 hours, MEDIUM: 72 hours, LOW: 120 hours
        int thresholdHours;
        switch (complaint.getUrgency().toUpperCase()) {
            case "HIGH":
                thresholdHours = HIGH_URGENCY_THRESHOLD;  // 24 hours
                break;
            case "MEDIUM":
                thresholdHours = MEDIUM_URGENCY_THRESHOLD; // 72 hours (3 days)
                break;
            case "LOW":
                thresholdHours = LOW_URGENCY_THRESHOLD; // 120 hours (5 days)
                break;
            default:
                return false;
        }
        
        return complaint.getCreatedAt().plusHours(thresholdHours).isBefore(now);
    }
    
    /**
     * Escalate a complaint automatically - assign to officer2
     */
    private void escalateComplaint(Complaint complaint) {
        try {
            System.out.println("Auto-escalating complaint ID: " + complaint.getId());
            
            // Find officer2 for special escalation
            User escalationHandler = findEscalationHandler();
            
            // Set escalation fields
            complaint.setEscalated(true);
            complaint.setEscalatedAt(LocalDateTime.now());
            complaint.setEscalatedTo(escalationHandler);
            complaint.setStatus(Complaint.ComplaintStatus.ESCALATED);
            
            // IMPORTANT: Also assign the complaint to officer2
            if (escalationHandler != null) {
                complaint.setAssignedTo(escalationHandler);
                System.out.println("Complaint assigned to: " + escalationHandler.getUsername());
            }
            
            // Determine escalation reason
            String reason = determineEscalationReason(complaint);
            String escalationComment = String.format(
                "AUTOMATED ESCALATION TO SPECIAL OFFICER: %s. System auto-escalated at %s.", 
                reason, 
                LocalDateTime.now()
            );
            
            if (escalationHandler != null) {
                escalationComment += " Escalated and assigned to: " + escalationHandler.getFullName() + " (" + escalationHandler.getUsername() + ")";
            }
            
            // Add timeline entry
            complaint.addTimelineEntry(
                Complaint.ComplaintStatus.ESCALATED, 
                escalationComment, 
                false, 
                null // System user
            );
            
            // Save the complaint
            complaintRepository.save(complaint);
            
            // Send notifications to relevant parties
            notificationService.notifyComplaintEscalation(complaint);
            
            System.out.println("Successfully auto-escalated complaint ID: " + complaint.getId() + 
                             " to " + (escalationHandler != null ? escalationHandler.getUsername() : "system") + 
                             ". Reason: " + reason + ". Notifications sent.");
            
        } catch (Exception e) {
            System.err.println("Error escalating complaint ID " + complaint.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Determine the reason for escalation
     */
    private String determineEscalationReason(Complaint complaint) {
        LocalDateTime now = LocalDateTime.now();
        
        if (isUnassignedTooLong(complaint, now)) {
            return "Unassigned for " + UNASSIGNED_ESCALATION_THRESHOLD + "+ hours";
        }
        
        if (isOverdueDeadline(complaint, now)) {
            return "Deadline overdue by " + OVERDUE_ESCALATION_THRESHOLD + "+ hours";
        }
        
        if (isStuckInProgress(complaint, now)) {
            return "No progress update for " + STUCK_ESCALATION_THRESHOLD + "+ hours";
        }
        
        if (isUrgencyBasedEscalation(complaint, now)) {
            String urgency = complaint.getUrgency();
            int threshold = urgency.equalsIgnoreCase("HIGH") ? HIGH_URGENCY_THRESHOLD :
                          urgency.equalsIgnoreCase("MEDIUM") ? MEDIUM_URGENCY_THRESHOLD :
                          LOW_URGENCY_THRESHOLD;
            return urgency + " urgency complaint unresolved for " + threshold + "+ hours";
        }
        
        return "System determined escalation required";
    }
    
    /**
     * Find the best escalation handler - specifically assign to officer2 for special escalation
     */
    private User findEscalationHandler() {
        // First, try to find the specific officer "officer2" for special escalation
        User officer2 = userRepository.findAll().stream()
                .filter(user -> "officer2".equalsIgnoreCase(user.getUsername()))
                .findFirst()
                .orElse(null);
        
        if (officer2 != null) {
            System.out.println("Assigning escalated complaint to special officer: " + officer2.getUsername());
            return officer2;
        }
        
        System.out.println("Warning: officer2 not found, falling back to admin escalation");
        
        // Fallback: Try to find a user with ADMIN role
        List<User> admins = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains("ADMIN"))
                .collect(Collectors.toList());
        
        if (!admins.isEmpty()) {
            // Return the first admin (could be enhanced with load balancing logic)
            System.out.println("Escalating to admin: " + admins.get(0).getUsername());
            return admins.get(0);
        }
        
        // If no admin found, try to find any senior officers
        List<User> officers = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains("OFFICER"))
                .collect(Collectors.toList());
        
        if (!officers.isEmpty()) {
            System.out.println("Escalating to officer: " + officers.get(0).getUsername());
            return officers.get(0);
        }
        
        System.out.println("Warning: No escalation handler found");
        // Return null for general escalation if no specific handler found
        return null;
    }
    
    /**
     * Get escalation statistics
     */
    public EscalationStats getEscalationStats() {
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        LocalDateTime lastWeek = LocalDateTime.now().minusWeeks(1);
        
        List<Complaint> escalatedComplaints = complaintRepository.findByIsEscalated(true);
        
        long totalEscalated = escalatedComplaints.size();
        long escalatedLast24Hours = escalatedComplaints.stream()
                .filter(c -> c.getEscalatedAt() != null && c.getEscalatedAt().isAfter(last24Hours))
                .count();
        long escalatedLastWeek = escalatedComplaints.stream()
                .filter(c -> c.getEscalatedAt() != null && c.getEscalatedAt().isAfter(lastWeek))
                .count();
        
        List<Complaint> currentCandidates = findEscalationCandidates();
        
        return new EscalationStats(
                totalEscalated,
                escalatedLast24Hours,
                escalatedLastWeek,
                currentCandidates.size()
        );
    }
    
    /**
     * Manual trigger for escalation check (for testing or immediate execution)
     */
    public void triggerManualEscalationCheck() {
        System.out.println("=== Manual escalation check triggered at " + LocalDateTime.now() + " ===");
        try {
            performAutoEscalation();
            System.out.println("Manual escalation check completed successfully");
        } catch (Exception e) {
            System.err.println("Error during manual escalation check: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Manual escalation check failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Inner class for escalation statistics
     */
    public static class EscalationStats {
        private final long totalEscalated;
        private final long escalatedLast24Hours;
        private final long escalatedLastWeek;
        private final long pendingEscalation;
        
        public EscalationStats(long totalEscalated, long escalatedLast24Hours, 
                             long escalatedLastWeek, long pendingEscalation) {
            this.totalEscalated = totalEscalated;
            this.escalatedLast24Hours = escalatedLast24Hours;
            this.escalatedLastWeek = escalatedLastWeek;
            this.pendingEscalation = pendingEscalation;
        }
        
        // Getters
        public long getTotalEscalated() { return totalEscalated; }
        public long getEscalatedLast24Hours() { return escalatedLast24Hours; }
        public long getEscalatedLastWeek() { return escalatedLastWeek; }
        public long getPendingEscalation() { return pendingEscalation; }
    }
}