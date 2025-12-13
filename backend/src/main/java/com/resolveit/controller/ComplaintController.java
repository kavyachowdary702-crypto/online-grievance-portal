package com.resolveit.controller;

import com.resolveit.dto.*;
import com.resolveit.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST Controller for Complaint Management with Role-Based Access Control (RBAC)
 * 
 * Role Permissions:
 * - USER: Submit complaints, edit/withdraw own complaints, view public updates
 * - OFFICER: Assign complaints to other officers, set deadlines, mark completed, view/reply internal notes
 * - ADMIN: All permissions, unassign complaints, mark resolved, edit any complaint
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {
    
    @Autowired
    private ComplaintService complaintService;
    
    /**
     * Submit Anonymous Complaint - No authentication required
     */
    @PostMapping("/submit/anonymous")
    public ResponseEntity<?> createAnonymousComplaint(
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("urgency") String urgency,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            ComplaintRequest request = new ComplaintRequest();
            request.setCategory(category);
            request.setDescription(description);
            request.setUrgency(urgency);
            request.setAnonymous(true);
            
            ComplaintResponse response = complaintService.createAnonymousComplaint(request, file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Submit Complaint - USER only
     */
    @PostMapping("/submit")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<?> createComplaint(
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("urgency") String urgency,
            @RequestParam(value = "anonymous", defaultValue = "false") boolean anonymous,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            ComplaintRequest request = new ComplaintRequest();
            request.setCategory(category);
            request.setDescription(description);
            request.setUrgency(urgency);
            request.setAnonymous(anonymous);
            
            ComplaintResponse response = complaintService.createComplaint(request, file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Edit/Withdraw Complaint - USER (own complaints) or ADMIN
     */
    @PutMapping("/edit/{id}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> editComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintUpdateRequest updateRequest) {
        try {
            ComplaintResponse complaint = complaintService.editComplaint(id, updateRequest);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Assign Complaint - OFFICER or ADMIN
     */
    @PutMapping("/assign/{id}")
    @PreAuthorize("hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> assignComplaint(
            @PathVariable Long id,
            @Valid @RequestBody AssignComplaintRequest assignRequest) {
        try {
            ComplaintResponse complaint = complaintService.assignComplaint(id, assignRequest);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Unassign Complaint - ADMIN only
     */
    @PutMapping("/unassign/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> unassignComplaint(@PathVariable Long id) {
        try {
            ComplaintResponse complaint = complaintService.unassignComplaint(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Set/Update Deadline - OFFICER (for assigned complaints) or ADMIN
     */
    @PutMapping("/deadline/{id}")
    @PreAuthorize("hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> updateDeadline(
            @PathVariable Long id,
            @Valid @RequestBody DeadlineUpdateRequest deadlineRequest) {
        try {
            ComplaintResponse complaint = complaintService.updateDeadline(id, deadlineRequest);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Mark Completed - OFFICER only
     */
    @PutMapping("/complete/{id}")
    @PreAuthorize("hasAuthority('OFFICER')")
    public ResponseEntity<?> markCompleted(@PathVariable Long id) {
        try {
            ComplaintResponse complaint = complaintService.markCompleted(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Mark Resolved (Final Closure) - ADMIN only
     */
    @PutMapping("/resolve/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> markResolved(@PathVariable Long id) {
        try {
            ComplaintResponse complaint = complaintService.markResolved(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Update Complaint Status - ADMIN only
     */
    @PutMapping("/status/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateComplaintStatus(@PathVariable Long id, @RequestBody ComplaintUpdateRequest updateRequest) {
        try {
            ComplaintResponse complaint = complaintService.updateComplaintStatus(id, updateRequest.getStatus());
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Public Updates - All roles (view only)
     */
    @GetMapping("/public")
    public ResponseEntity<?> getPublicComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getPublicComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Internal Notes - OFFICER or ADMIN
     */
    @PostMapping("/notes/{id}")
    @PreAuthorize("hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> addInternalNote(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintNoteRequest noteRequest) {
        try {
            ComplaintResponse complaint = complaintService.addInternalNote(id, noteRequest);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Internal Notes - OFFICER or ADMIN
     */
    @GetMapping("/notes/{id}")
    @PreAuthorize("hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> getInternalNotes(@PathVariable Long id) {
        try {
            List<ComplaintTimelineResponse> notes = complaintService.getInternalNotes(id);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get My Complaints - USER
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<?> getMyComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getMyComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get All Complaints - ADMIN
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAllComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getAllComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Assigned Complaints - OFFICER
     */
    @GetMapping("/assigned")
    @PreAuthorize("hasAuthority('OFFICER')")
    public ResponseEntity<?> getAssignedComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getAssignedComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Complaint by ID - All authenticated users
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id) {
        try {
            ComplaintResponse complaint = complaintService.getComplaintById(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Complaint Timeline - Public timeline for all, internal notes for OFFICER/ADMIN
     */
    @GetMapping("/{id}/timeline")
    public ResponseEntity<?> getComplaintTimeline(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeInternal) {
        try {
            List<ComplaintTimelineResponse> timeline = complaintService.getComplaintTimeline(id, includeInternal);
            return ResponseEntity.ok(timeline);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Filter Complaints - ADMIN/OFFICER
     */
    @GetMapping("/filter")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('OFFICER')")
    public ResponseEntity<?> filterComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String urgency) {
        try {
            List<ComplaintResponse> complaints = complaintService.filterComplaints(status, category, urgency);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Escalate Complaint - ADMIN only
     */
    @PostMapping("/escalate/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> escalateComplaint(
            @PathVariable Long id,
            @Valid @RequestBody EscalationRequest escalationRequest) {
        try {
            ComplaintResponse complaint = complaintService.escalateComplaint(id, escalationRequest);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * De-escalate Complaint - ADMIN only
     */
    @PutMapping("/de-escalate/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deEscalateComplaint(
            @PathVariable Long id,
            @RequestParam(required = false) String comment) {
        try {
            ComplaintResponse complaint = complaintService.deEscalateComplaint(id, comment);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Escalated Complaints - ADMIN only
     */
    @GetMapping("/admin/escalated")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getEscalatedComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getEscalatedComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get Unresolved Complaints (escalation candidates) - ADMIN only
     */
    @GetMapping("/admin/unresolved")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getUnresolvedComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getUnresolvedComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Get all officers and admins for escalation - ADMIN only
     */
    @GetMapping("/officers-and-admins")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAllOfficersAndAdmins() {
        try {
            List<UserResponse> users = complaintService.getAllOfficersAndAdmins();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Get all officers for assignment - ADMIN only
     */
    @GetMapping("/officers")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAllOfficers() {
        try {
            List<UserResponse> officers = complaintService.getAllOfficers();
            return ResponseEntity.ok(officers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    /**
     * Download/View uploaded file - Authenticated users only
     */
    @GetMapping("/files/{filename:.+}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('OFFICER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> getFile(@PathVariable String filename) {
        try {
            return complaintService.getFile(filename);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
