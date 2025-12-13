package com.resolveit.service;

import com.resolveit.entity.Complaint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.mail.from:noreply@resolveit.com}")
    private String fromEmail;
    
    @Value("${app.name:ResolveIT Smart}")
    private String appName;
    
    /**
     * Send notification email for complaint updates
     */
    @Async
    public void sendNotificationEmail(String toEmail, String subject, String message, Complaint complaint) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            
            String htmlContent = buildNotificationEmailContent(subject, message, complaint);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            log.info("Notification email sent successfully to: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Failed to send notification email to: {}", toEmail, e);
            // Fall back to simple text email
            sendSimpleNotificationEmail(toEmail, subject, message);
        }
    }
    
    /**
     * Send simple text notification email as fallback
     */
    @Async
    public void sendSimpleNotificationEmail(String toEmail, String subject, String message) {
        try {
            SimpleMailMessage simpleMessage = new SimpleMailMessage();
            simpleMessage.setFrom(fromEmail);
            simpleMessage.setTo(toEmail);
            simpleMessage.setSubject(subject);
            simpleMessage.setText(message);
            
            mailSender.send(simpleMessage);
            log.info("Simple notification email sent successfully to: {}", toEmail);
            
        } catch (Exception e) {
            log.error("Failed to send simple notification email to: {}", toEmail, e);
        }
    }
    
    /**
     * Send escalation alert email to admins
     */
    @Async
    public void sendEscalationAlert(String toEmail, Complaint complaint, String escalationReason) {
        try {
            String subject = String.format("[URGENT] Complaint #%d Escalated - %s", 
                    complaint.getId(), appName);
            
            String message = String.format(
                "A complaint has been automatically escalated and requires immediate attention.\n\n" +
                "Complaint Details:\n" +
                "- ID: #%d\n" +
                "- Category: %s\n" +
                "- Urgency: %s\n" +
                "- Status: %s\n" +
                "- User: %s\n" +
                "- Escalation Reason: %s\n\n" +
                "Please log into the system to review and take appropriate action.\n\n" +
                "Best regards,\n%s System",
                complaint.getId(),
                complaint.getCategory(),
                complaint.getUrgency(),
                complaint.getStatus(),
                complaint.getUser() != null ? complaint.getUser().getUsername() : "Anonymous",
                escalationReason,
                appName
            );
            
            sendNotificationEmail(toEmail, subject, message, complaint);
            
        } catch (Exception e) {
            log.error("Failed to send escalation alert email to: {}", toEmail, e);
        }
    }
    
    /**
     * Build HTML email content for notifications
     */
    private String buildNotificationEmailContent(String subject, String message, Complaint complaint) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'></head><body>");
        html.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>");
        
        // Header
        html.append("<div style='background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>");
        html.append("<h2 style='margin: 0;'>").append(appName).append("</h2>");
        html.append("</div>");
        
        // Content
        html.append("<div style='background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;'>");
        html.append("<h3 style='color: #333; margin-top: 0;'>").append(subject).append("</h3>");
        html.append("<p style='color: #555; line-height: 1.6;'>").append(message).append("</p>");
        
        // Complaint details if available
        if (complaint != null) {
            html.append("<div style='background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;'>");
            html.append("<h4 style='color: #2196F3; margin-top: 0;'>Complaint Details</h4>");
            html.append("<p><strong>ID:</strong> #").append(complaint.getId()).append("</p>");
            html.append("<p><strong>Category:</strong> ").append(complaint.getCategory()).append("</p>");
            html.append("<p><strong>Urgency:</strong> ").append(complaint.getUrgency()).append("</p>");
            html.append("<p><strong>Status:</strong> ").append(complaint.getStatus()).append("</p>");
            if (complaint.getDeadline() != null) {
                html.append("<p><strong>Deadline:</strong> ").append(complaint.getDeadline()).append("</p>");
            }
            html.append("</div>");
        }
        
        html.append("<p style='color: #666; font-size: 14px; margin-top: 20px;'>");
        html.append("Please log into the system to view full details and take appropriate action.");
        html.append("</p>");
        html.append("</div>");
        
        // Footer
        html.append("<div style='background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;'>");
        html.append("<p style='margin: 0; font-size: 12px;'>This is an automated notification from ").append(appName).append("</p>");
        html.append("</div>");
        
        html.append("</div>");
        html.append("</body></html>");
        
        return html.toString();
    }
}