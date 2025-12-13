package com.resolveit.enums;

/**
 * Enum representing user roles in the ResolveIT system.
 * Defines the three main roles with their respective permissions.
 */
public enum Role {
    USER("ROLE_USER"),
    OFFICER("ROLE_OFFICER"),
    ADMIN("ROLE_ADMIN");
    
    private final String authority;
    
    Role(String authority) {
        this.authority = authority;
    }
    
    public String getAuthority() {
        return authority;
    }
    
    /**
     * Get role name without ROLE_ prefix
     */
    public String getRoleName() {
        return this.name();
    }
    
    /**
     * Convert string to Role enum
     */
    public static Role fromString(String roleStr) {
        if (roleStr == null) return null;
        
        // Handle both "USER" and "ROLE_USER" formats
        String cleanRole = roleStr.toUpperCase();
        if (cleanRole.startsWith("ROLE_")) {
            cleanRole = cleanRole.substring(5);
        }
        
        try {
            return Role.valueOf(cleanRole);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}