package com.resolveit.controller;

import com.resolveit.dto.JwtResponse;
import com.resolveit.dto.LoginRequest;
import com.resolveit.dto.MessageResponse;
import com.resolveit.dto.SignupRequest;
import com.resolveit.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse jwtResponse = authService.login(loginRequest);
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            MessageResponse messageResponse = authService.signup(signupRequest);
            return ResponseEntity.ok(messageResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/signup/officer")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> signupOfficer(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            MessageResponse messageResponse = authService.signupOfficer(signupRequest);
            return ResponseEntity.ok(messageResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/signup/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> signupAdmin(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            MessageResponse messageResponse = authService.signupAdmin(signupRequest);
            return ResponseEntity.ok(messageResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
