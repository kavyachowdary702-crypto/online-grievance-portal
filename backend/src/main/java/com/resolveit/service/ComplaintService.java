package com.resolveit.service;

import com.resolveit.dto.*;
import com.resolveit.entity.Complaint;
import com.resolveit.entity.ComplaintTimeline;
import com.resolveit.entity.User;
import com.resolveit.enums.Role;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.ComplaintTimelineRepository;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.UserDetailsImpl;
import com.resolveit.util.RoleUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ComplaintService {
    
    @Autowired
    private ComplaintRepository complaintRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ComplaintTimelineRepository timelineRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    public ComplaintResponse createComplaint(ComplaintRequest request, MultipartFile file) throws IOException {
        Complaint complaint = new Complaint();
        complaint.setCategory(request.getCategory());
        complaint.setDescription(request.getDescription());
        complaint.setUrgency(request.getUrgency());
        complaint.setAnonymous(request.isAnonymous());
        complaint.setStatus(Complaint.ComplaintStatus.NEW);
        
        if (!request.isAnonymous()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
                User user = userRepository.findById(userDetails.getId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                complaint.setUser(user);
            }
        }
        
        if (file != null && !file.isEmpty()) {
            String filename = saveFile(file);
            complaint.setAttachmentPath(filename);
        }
        
        Complaint savedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(savedComplaint);
    }
    
    public ComplaintResponse createAnonymousComplaint(ComplaintRequest request, MultipartFile file) throws IOException {
        Complaint complaint = new Complaint();
        complaint.setCategory(request.getCategory());
        complaint.setDescription(request.getDescription());
        complaint.setUrgency(request.getUrgency());
        complaint.setAnonymous(true);
        complaint.setStatus(Complaint.ComplaintStatus.NEW);
        
        if (file != null && !file.isEmpty()) {
            String filename = saveFile(file);
            complaint.setAttachmentPath(filename);
        }
        
        Complaint savedComplaint = complaintRepository.save(complaint);
        complaint.addTimelineEntry(Complaint.ComplaintStatus.NEW, "Anonymous complaint submitted", false, null);
        complaintRepository.save(complaint);
        return new ComplaintResponse(savedComplaint);
    }
    
    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    public List<ComplaintResponse> getMyComplaints() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        return complaintRepository.findByUserId(userDetails.getId()).stream()
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        return new ComplaintResponse(complaint);
    }
    
    public ComplaintResponse updateComplaintStatus(Long id, String status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Complaint.ComplaintStatus parsed = parseStatus(status);
        if (parsed != null) {
            complaint.setStatus(parsed);
        }
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    public ComplaintResponse updateComplaint(Long id, ComplaintUpdateRequest updateRequest) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (updateRequest.getStatus() != null) {
            Complaint.ComplaintStatus parsed = parseStatus(updateRequest.getStatus());
            if (parsed != null) complaint.setStatus(parsed);
        }
        
        if (updateRequest.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(updateRequest.getAssignedToUserId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
            complaint.setAssignedTo(assignedUser);
        }
        
        if (updateRequest.getEscalatedToUserId() != null) {
            User escalatedUser = userRepository.findById(updateRequest.getEscalatedToUserId())
                    .orElseThrow(() -> new RuntimeException("Escalated user not found"));
            complaint.setEscalatedTo(escalatedUser);
            complaint.setEscalated(true);
            complaint.setEscalatedAt(LocalDateTime.now());
        }
        
        complaint.addTimelineEntry(complaint.getStatus(), updateRequest.getComment(), 
                updateRequest.isInternalNote(), currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Edit complaint - USER (own complaints) or ADMIN
     */
    public ComplaintResponse editComplaint(Long id, ComplaintUpdateRequest updateRequest) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if USER is editing their own complaint or if it's an ADMIN
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        boolean isOwner = complaint.getUser() != null && complaint.getUser().getId().equals(userDetails.getId());
        
        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You can only edit your own complaints");
        }
        
        // Users can only edit NEW or UNDER_REVIEW complaints
        if (!isAdmin && complaint.getStatus() != Complaint.ComplaintStatus.NEW 
                && complaint.getStatus() != Complaint.ComplaintStatus.UNDER_REVIEW) {
            throw new RuntimeException("Cannot edit complaint in current status");
        }
        
        // Update complaint fields
        if (updateRequest.getStatus() != null) {
            Complaint.ComplaintStatus parsed = parseStatus(updateRequest.getStatus());
            if (parsed != null) complaint.setStatus(parsed);
        }
        
        complaint.addTimelineEntry(complaint.getStatus(), 
                updateRequest.getComment() != null ? updateRequest.getComment() : "Complaint updated", 
                false, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Assign complaint - OFFICER or ADMIN
     */
    public ComplaintResponse assignComplaint(Long id, AssignComplaintRequest assignRequest) {
        System.out.println("=== ASSIGN COMPLAINT DEBUG ===");
        System.out.println("Complaint ID: " + id);
        System.out.println("Assign Request: " + assignRequest);
        System.out.println("Assign To User ID: " + assignRequest.getAssignToUserId());
        System.out.println("Deadline: " + assignRequest.getDeadline());
        System.out.println("Comment: " + assignRequest.getComment());
        
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        System.out.println("Found complaint: " + complaint.getId());
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        System.out.println("Current user: " + currentUser.getUsername() + " with roles: " + currentUser.getRoles());
        
        User assignToUser = userRepository.findById(assignRequest.getAssignToUserId())
                .orElseThrow(() -> new RuntimeException("User to assign not found"));
        
        System.out.println("Assigning to user: " + assignToUser.getUsername() + " with roles: " + assignToUser.getRoles());
        
        // Check if assigning to an OFFICER (OFFICERs can only assign to other OFFICERs)
        boolean isCurrentUserOfficer = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("OFFICER"));
        boolean isCurrentUserAdmin = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        boolean isTargetUserOfficer = assignToUser.getRoles() != null && assignToUser.getRoles().contains("OFFICER");
        
        // Admins can assign to anyone, Officers can only assign to other officers
        if (isCurrentUserOfficer && !isCurrentUserAdmin && !isTargetUserOfficer) {
            throw new RuntimeException("Officers can only assign complaints to other officers");
        }
        
        // Make sure we're assigning to an officer role
        if (!isTargetUserOfficer) {
            throw new RuntimeException("Can only assign complaints to users with OFFICER role");
        }
        
        complaint.setAssignedTo(assignToUser);
        complaint.setStatus(Complaint.ComplaintStatus.ASSIGNED);
        
        if (assignRequest.getDeadline() != null) {
            complaint.setDeadline(assignRequest.getDeadline());
        }
        
        String comment = assignRequest.getComment() != null ? 
                assignRequest.getComment() : 
                "Complaint assigned to " + assignToUser.getFullName();
        
        complaint.addTimelineEntry(Complaint.ComplaintStatus.ASSIGNED, comment, true, currentUser);
        
        System.out.println("About to save complaint with status: " + complaint.getStatus());
        System.out.println("Assigned to: " + complaint.getAssignedTo().getUsername());
        System.out.println("Deadline set: " + complaint.getDeadline());
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        System.out.println("Complaint saved successfully with ID: " + updatedComplaint.getId());
        
        // Send notifications for complaint assignment
        notificationService.notifyComplaintAssignment(updatedComplaint, assignToUser);
        
        System.out.println("=== ASSIGN COMPLAINT COMPLETE ===");
        
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Unassign complaint - ADMIN only
     */
    public ComplaintResponse unassignComplaint(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        complaint.setAssignedTo(null);
        complaint.setDeadline(null);
        complaint.setStatus(Complaint.ComplaintStatus.UNDER_REVIEW);
        
        complaint.addTimelineEntry(Complaint.ComplaintStatus.UNDER_REVIEW, 
                "Complaint unassigned", true, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Update deadline - OFFICER (for assigned complaints) or ADMIN
     */
    public ComplaintResponse updateDeadline(Long id, DeadlineUpdateRequest deadlineRequest) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if OFFICER is updating deadline for their assigned complaint
        boolean isOfficer = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("OFFICER"));
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        boolean isAssignedToCurrentUser = complaint.getAssignedTo() != null && 
                complaint.getAssignedTo().getId().equals(userDetails.getId());
        
        if (isOfficer && !isAssignedToCurrentUser) {
            throw new RuntimeException("Officers can only update deadlines for complaints assigned to them");
        }
        
        complaint.setDeadline(deadlineRequest.getDeadline());
        
        String comment = deadlineRequest.getComment() != null ? 
                deadlineRequest.getComment() : 
                "Deadline updated to " + deadlineRequest.getDeadline();
        
        complaint.addTimelineEntry(complaint.getStatus(), comment, true, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Mark completed - OFFICER only
     */
    public ComplaintResponse markCompleted(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        complaint.setStatus(Complaint.ComplaintStatus.COMPLETED);
        complaint.addTimelineEntry(Complaint.ComplaintStatus.COMPLETED, 
                "Complaint marked as completed", false, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Mark resolved - ADMIN only
     */
    public ComplaintResponse markResolved(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        complaint.setStatus(Complaint.ComplaintStatus.RESOLVED);
        complaint.addTimelineEntry(Complaint.ComplaintStatus.RESOLVED, 
                "Complaint resolved and closed", false, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Get public complaints - All roles (view only)
     */
    public List<ComplaintResponse> getPublicComplaints() {
        // Return all complaints with public timeline entries only
        return complaintRepository.findAll().stream()
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Add internal note - OFFICER or ADMIN
     */
    public ComplaintResponse addInternalNote(Long id, ComplaintNoteRequest noteRequest) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        complaint.addTimelineEntry(complaint.getStatus(), noteRequest.getComment(), 
                noteRequest.isInternalNote(), currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Get internal notes - OFFICER or ADMIN
     */
    public List<ComplaintTimelineResponse> getInternalNotes(Long id) {
        return getComplaintTimeline(id, true);
    }
    
    /**
     * Get assigned complaints - OFFICER
     */
    public List<ComplaintResponse> getAssignedComplaints() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        List<Complaint> assignedComplaints = complaintRepository.findByAssignedToId(userDetails.getId());
        
        // Sort by deadline - urgent ones first (nulls last)
        return assignedComplaints.stream()
                .sorted((c1, c2) -> {
                    if (c1.getDeadline() == null && c2.getDeadline() == null) return 0;
                    if (c1.getDeadline() == null) return 1;
                    if (c2.getDeadline() == null) return -1;
                    return c1.getDeadline().compareTo(c2.getDeadline());
                })
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Escalate complaint - ADMIN only
     */
    public ComplaintResponse escalateComplaint(Long id, EscalationRequest escalationRequest) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find the user to escalate to (should be ADMIN or higher authority)
        User escalateToUser = null;
        if (escalationRequest.getEscalateToUserId() != null) {
            escalateToUser = userRepository.findById(escalationRequest.getEscalateToUserId())
                    .orElseThrow(() -> new RuntimeException("Escalation target user not found"));
        }
        
        // Set escalation fields
        complaint.setEscalated(true);
        complaint.setEscalatedAt(LocalDateTime.now());
        complaint.setEscalatedTo(escalateToUser);
        complaint.setStatus(Complaint.ComplaintStatus.ESCALATED);
        
        // Build escalation comment
        String escalationComment = String.format(
            "Complaint escalated by %s. Reason: %s. Priority: %s", 
            currentUser.getFullName(),
            escalationRequest.getReason() != null ? escalationRequest.getReason() : "Not specified",
            escalationRequest.getPriority() != null ? escalationRequest.getPriority() : "NORMAL"
        );
        
        if (escalationRequest.getComment() != null && !escalationRequest.getComment().trim().isEmpty()) {
            escalationComment += ". Additional notes: " + escalationRequest.getComment().trim();
        }
        
        if (escalateToUser != null) {
            escalationComment += " (Escalated to: " + escalateToUser.getFullName() + ")";
        }
        
        complaint.addTimelineEntry(Complaint.ComplaintStatus.ESCALATED, escalationComment, false, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }
    
    /**
     * Get escalated complaints - ADMIN only
     */
    public List<ComplaintResponse> getEscalatedComplaints() {
        return complaintRepository.findByIsEscalated(true).stream()
                .sorted((c1, c2) -> {
                    // Sort by escalation date - most recent first
                    if (c1.getEscalatedAt() == null && c2.getEscalatedAt() == null) return 0;
                    if (c1.getEscalatedAt() == null) return 1;
                    if (c2.getEscalatedAt() == null) return -1;
                    return c2.getEscalatedAt().compareTo(c1.getEscalatedAt());
                })
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unresolved complaints (candidates for escalation) - ADMIN only
     */
    public List<ComplaintResponse> getUnresolvedComplaints() {
        return complaintRepository.findAll().stream()
                .filter(complaint -> {
                    // Candidates for escalation: assigned but overdue, or stuck in progress
                    boolean isOverdue = complaint.getDeadline() != null && 
                                      complaint.getDeadline().isBefore(LocalDateTime.now()) &&
                                      (complaint.getStatus() == Complaint.ComplaintStatus.ASSIGNED ||
                                       complaint.getStatus() == Complaint.ComplaintStatus.IN_PROGRESS);
                    
                    boolean isStuck = complaint.getStatus() == Complaint.ComplaintStatus.IN_PROGRESS &&
                                     complaint.getUpdatedAt() != null &&
                                     complaint.getUpdatedAt().plusDays(3).isBefore(LocalDateTime.now());
                    
                    boolean isUnassignedTooLong = complaint.getAssignedTo() == null &&
                                                complaint.getStatus() == Complaint.ComplaintStatus.NEW &&
                                                complaint.getCreatedAt().plusDays(2).isBefore(LocalDateTime.now());
                    
                    return (isOverdue || isStuck || isUnassignedTooLong) && 
                           !complaint.isEscalated() &&
                           complaint.getStatus() != Complaint.ComplaintStatus.RESOLVED &&
                           complaint.getStatus() != Complaint.ComplaintStatus.CLOSED;
                })
                .sorted((c1, c2) -> {
                    // Sort by priority: overdue first, then by creation date
                    boolean c1Overdue = c1.getDeadline() != null && c1.getDeadline().isBefore(LocalDateTime.now());
                    boolean c2Overdue = c2.getDeadline() != null && c2.getDeadline().isBefore(LocalDateTime.now());
                    
                    if (c1Overdue && !c2Overdue) return -1;
                    if (!c1Overdue && c2Overdue) return 1;
                    
                    return c1.getCreatedAt().compareTo(c2.getCreatedAt());
                })
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * De-escalate complaint - ADMIN only
     */
    public ComplaintResponse deEscalateComplaint(Long id, String comment) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!complaint.isEscalated()) {
            throw new RuntimeException("Complaint is not currently escalated");
        }
        
        complaint.setEscalated(false);
        complaint.setEscalatedTo(null);
        // Set status based on assignment
        if (complaint.getAssignedTo() != null) {
            complaint.setStatus(Complaint.ComplaintStatus.ASSIGNED);
        } else {
            complaint.setStatus(Complaint.ComplaintStatus.UNDER_REVIEW);
        }
        
        String deEscalationComment = "Complaint de-escalated by " + currentUser.getFullName();
        if (comment != null && !comment.trim().isEmpty()) {
            deEscalationComment += ". Reason: " + comment.trim();
        }
        
        complaint.addTimelineEntry(complaint.getStatus(), deEscalationComment, false, currentUser);
        
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return new ComplaintResponse(updatedComplaint);
    }

    /**
     * Get all officers and admins for escalation - ADMIN only
     */
    public List<UserResponse> getAllOfficersAndAdmins() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && 
                       (user.getRoles().contains("OFFICER") || user.getRoles().contains("ADMIN")))
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get all officers for assignment - ADMIN only
     */
    public List<UserResponse> getAllOfficers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains("OFFICER"))
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }
    
    public List<ComplaintTimelineResponse> getComplaintTimeline(Long complaintId, boolean includeInternal) {
        List<ComplaintTimeline> timeline;
        if (includeInternal) {
            timeline = timelineRepository.findByComplaintIdOrderByTimestampAsc(complaintId);
        } else {
            timeline = timelineRepository.findByComplaintIdAndIsInternalNoteOrderByTimestampAsc(complaintId, false);
        }
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return timeline.stream().map(entry -> {
            ComplaintTimelineResponse response = new ComplaintTimelineResponse();
            response.setId(entry.getId());
            response.setStatus(entry.getStatus().toString());
            response.setComment(entry.getComment());
            response.setInternalNote(entry.isInternalNote());
            response.setUpdatedByUsername(entry.getUpdatedBy() != null ? 
                    entry.getUpdatedBy().getUsername() : "System");
            response.setTimestamp(entry.getTimestamp().format(formatter));
            return response;
        }).collect(Collectors.toList());
    }
    
    public List<ComplaintResponse> filterComplaints(String status, String category, String urgency) {
        List<Complaint> complaints;
        
        if (status != null && !status.isEmpty()) {
            Complaint.ComplaintStatus parsed = parseStatus(status);
            if (parsed != null) {
                complaints = complaintRepository.findByStatus(parsed);
            } else {
                complaints = complaintRepository.findAll();
            }
        } else if (category != null && !category.isEmpty()) {
            complaints = complaintRepository.findByCategory(category);
        } else if (urgency != null && !urgency.isEmpty()) {
            complaints = complaintRepository.findByUrgency(urgency);
        } else {
            complaints = complaintRepository.findAll();
        }
        
        return complaints.stream()
                .map(ComplaintResponse::new)
                .collect(Collectors.toList());
    }
    
    private String saveFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return filename;
    }

    private Complaint.ComplaintStatus parseStatus(String statusStr) {
        if (statusStr == null) return null;
        String s = statusStr.trim().toUpperCase();
        try {
            return Complaint.ComplaintStatus.valueOf(s);
        } catch (IllegalArgumentException ex) {
            // map legacy or alternate values
            switch (s) {
                case "PENDING":
                    return Complaint.ComplaintStatus.NEW;
                case "UNDER_REVIEW":
                case "UNDER-REVIEW":
                    return Complaint.ComplaintStatus.UNDER_REVIEW;
                case "IN_PROGRESS":
                case "IN-PROGRESS":
                    return Complaint.ComplaintStatus.IN_PROGRESS;
                case "ESCALATED":
                    return Complaint.ComplaintStatus.ESCALATED;
                case "RESOLVED":
                    return Complaint.ComplaintStatus.RESOLVED;
                case "CLOSED":
                    return Complaint.ComplaintStatus.CLOSED;
                default:
                    return null;
            }
        }
    }
    
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> getFile(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return org.springframework.http.ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error loading file: " + filename, e);
        }
    }
}
