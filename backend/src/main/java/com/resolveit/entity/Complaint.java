package com.resolveit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String urgency;
    
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    @Enumerated(EnumType.STRING)
    private ComplaintStatus status = ComplaintStatus.NEW;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    
    private LocalDateTime deadline;
    
    private boolean anonymous = false;
    
    private String attachmentPath;
    
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintTimeline> timeline = new ArrayList<>();
    
    private boolean isEscalated = false;
    
    @Column(nullable = true)
    private LocalDateTime escalatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalated_to")
    private User escalatedTo;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum ComplaintStatus {
        NEW,
        UNDER_REVIEW,
        IN_PROGRESS,
        ASSIGNED,
        COMPLETED,
        ESCALATED,
        RESOLVED,
        CLOSED
    }
    
    public void addTimelineEntry(ComplaintStatus status, String comment, boolean isInternalNote, User updatedBy) {
        ComplaintTimeline entry = new ComplaintTimeline();
        entry.setComplaint(this);
        entry.setStatus(status);
        entry.setComment(comment);
        entry.setInternalNote(isInternalNote);
        entry.setUpdatedBy(updatedBy);
        this.timeline.add(entry);
    }
}
