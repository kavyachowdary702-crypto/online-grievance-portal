package com.resolveit.repository;

import com.resolveit.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserId(Long userId);
    List<Complaint> findByAssignedToId(Long assignedToId);
    List<Complaint> findByStatus(Complaint.ComplaintStatus status);
    List<Complaint> findByCategory(String category);
    List<Complaint> findByUrgency(String urgency);
    List<Complaint> findByIsEscalated(boolean isEscalated);
    
    // For reports and analytics
    List<Complaint> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    Long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    Long countByStatusAndCreatedAtBetween(Complaint.ComplaintStatus status, LocalDateTime startDate, LocalDateTime endDate);
}
