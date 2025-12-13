package com.resolveit.service;

import com.resolveit.entity.Complaint;
import com.resolveit.entity.Notification;
import com.resolveit.entity.User;
import com.resolveit.enums.NotificationType;
import com.resolveit.enums.Role;
import com.resolveit.repository.NotificationRepository;
import com.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    /**
     * Create and send notification for complaint escalation
     */
    @Async
    @Transactional
    public void notifyComplaintEscalation(Complaint complaint) {
        try {
            log.info("Sending escalation notifications for complaint ID: {}", complaint.getId());
            
            // Notify the original user
            if (complaint.getUser() != null) {
                createNotification(
                    complaint.getUser(),
                    complaint,
                    NotificationType.COMPLAINT_ESCALATED,
                    "Your Complaint Has Been Escalated",
                    String.format("Your complaint #%d has been escalated to a higher authority due to urgency or deadline concerns. " +
                            "A senior officer will review it shortly.", complaint.getId())
                );
            }
            
            // Notify all admins about the escalation
            List<User> admins = userRepository.findByRolesContaining("ROLE_ADMIN");
            for (User admin : admins) {
                createNotification(
                    admin,
                    complaint,
                    NotificationType.ESCALATION_ALERT,
                    "Complaint Escalated - Action Required",
                    String.format("Complaint #%d has been automatically escalated and requires immediate attention. " +
                            "Category: %s, Urgency: %s", 
                            complaint.getId(), complaint.getCategory(), complaint.getUrgency())
                );
            }
            
            // Notify the assigned officer if present
            if (complaint.getAssignedTo() != null) {
                createNotification(
                    complaint.getAssignedTo(),
                    complaint,
                    NotificationType.ESCALATION_ALERT,
                    "Complaint Under Your Review Has Been Escalated",
                    String.format("Complaint #%d that was assigned to you has been escalated. " +
                            "Please coordinate with senior management for resolution.", complaint.getId())
                );
            }
            
            log.info("Escalation notifications sent successfully for complaint ID: {}", complaint.getId());
            
        } catch (Exception e) {
            log.error("Error sending escalation notifications for complaint ID: {}", complaint.getId(), e);
        }
    }
    
    /**
     * Create and send notification for complaint assignment
     */
    @Async
    @Transactional
    public void notifyComplaintAssignment(Complaint complaint, User assignedOfficer) {
        try {
            log.info("Sending assignment notification for complaint ID: {} to officer: {}", 
                    complaint.getId(), assignedOfficer.getUsername());
            
            createNotification(
                assignedOfficer,
                complaint,
                NotificationType.COMPLAINT_ASSIGNED,
                "New Complaint Assigned to You",
                String.format("You have been assigned complaint #%d. Category: %s, Urgency: %s. " +
                        "Please review and take appropriate action.", 
                        complaint.getId(), complaint.getCategory(), complaint.getUrgency())
            );
            
            // Notify the user that their complaint has been assigned
            if (complaint.getUser() != null) {
                createNotification(
                    complaint.getUser(),
                    complaint,
                    NotificationType.COMPLAINT_STATUS_UPDATE,
                    "Your Complaint Has Been Assigned",
                    String.format("Your complaint #%d has been assigned to an officer and is being reviewed. " +
                            "You will be notified of any updates.", complaint.getId())
                );
            }
            
        } catch (Exception e) {
            log.error("Error sending assignment notification for complaint ID: {}", complaint.getId(), e);
        }
    }
    
    /**
     * Create a notification and send email if applicable
     */
    @Transactional
    public Notification createNotification(User user, Complaint complaint, NotificationType type, 
                                         String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .complaint(complaint)
                    .type(type)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .emailSent(false)
                    .build();
            
            notification = notificationRepository.save(notification);
            log.info("Created notification ID: {} for user: {}", notification.getId(), user.getUsername());
            
            // Send email notification asynchronously
            sendEmailNotification(notification);
            
            return notification;
            
        } catch (Exception e) {
            log.error("Error creating notification for user: {}", user.getUsername(), e);
            throw e;
        }
    }
    
    /**
     * Send email notification
     */
    @Async
    public void sendEmailNotification(Notification notification) {
        try {
            if (notification.getUser().getEmail() != null && !notification.getUser().getEmail().isEmpty()) {
                emailService.sendNotificationEmail(
                    notification.getUser().getEmail(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getComplaint()
                );
                
                // Mark email as sent
                notification.setEmailSent(true);
                notificationRepository.save(notification);
                
                log.info("Email notification sent successfully to: {}", notification.getUser().getEmail());
            }
        } catch (Exception e) {
            log.error("Error sending email notification to: {}", notification.getUser().getEmail(), e);
        }
    }
    
    /**
     * Get notifications for a user
     */
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findUnreadByUserId(userId);
    }
    
    /**
     * Get unread notification count for a user
     */
    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
    
    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            if (notification.getUser().getId().equals(userId)) {
                notification.markAsRead();
                notificationRepository.save(notification);
                log.info("Marked notification {} as read for user {}", notificationId, userId);
            } else {
                log.warn("User {} attempted to mark notification {} belonging to another user", userId, notificationId);
            }
        }
    }
    
    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
        }
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked all notifications as read for user {}", userId);
    }
    
    /**
     * Delete old notifications (older than specified days)
     */
    @Transactional
    public void cleanupOldNotifications(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        // This would need a custom query to delete old notifications
        log.info("Cleanup task would delete notifications older than {}", cutoffDate);
    }
}