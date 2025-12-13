package com.resolveit.repository;

import com.resolveit.entity.ComplaintTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintTimelineRepository extends JpaRepository<ComplaintTimeline, Long> {
    List<ComplaintTimeline> findByComplaintIdOrderByTimestampAsc(Long complaintId);
    List<ComplaintTimeline> findByComplaintIdAndIsInternalNoteOrderByTimestampAsc(Long complaintId, boolean isInternalNote);
}