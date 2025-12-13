package com.resolveit.util;

import com.resolveit.enums.Role;
import com.resolveit.security.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for role-based permission checks
 */
public class RoleUtil {
    
    /**
     * Check if current user has the specified role
     */
    public static boolean hasRole(Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return false;
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(role.getRoleName()));
    }
    
    /**
     * Check if current user has any of the specified roles
     */
    public static boolean hasAnyRole(Role... roles) {
        for (Role role : roles) {
            if (hasRole(role)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get current user details
     */
    public static UserDetailsImpl getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return null;
        }
        return (UserDetailsImpl) auth.getPrincipal();
    }
    
    /**
     * Check if current user is admin
     */
    public static boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }
    
    /**
     * Check if current user is officer
     */
    public static boolean isOfficer() {
        return hasRole(Role.OFFICER);
    }
    
    /**
     * Check if current user is regular user
     */
    public static boolean isUser() {
        return hasRole(Role.USER);
    }
}