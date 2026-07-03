package com.skillmarket.skill_marketplace.controller;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.dto.AuthResponse;
import com.skillmarket.skill_marketplace.dto.LoginRequest;
import com.skillmarket.skill_marketplace.dto.RegisterRequest;
import com.skillmarket.skill_marketplace.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.Map<String, Object> profile = new java.util.HashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name());
        profile.put("phoneNumber", user.getPhoneNumber());
        profile.put("profileImageUrl", user.getProfileImageUrl());
        profile.put("latitude", user.getLatitude());
        profile.put("longitude", user.getLongitude());
        profile.put("address", user.getAddress());
        profile.put("isProviderVerified", user.getIsProviderVerified());

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.skillmarket.skill_marketplace.dto.UpdateProfileRequest request) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(userService.refreshAccessToken(body.get("refreshToken")));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(userService.verifyOtp(body.get("email"), body.get("otp")));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(userService.resendOtp(body.get("email")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(userService.forgotPassword(body.get("email")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(userService.resetPassword(
                body.get("email"),
                body.get("otp"),
                body.get("newPassword")
        ));
    }

    @PutMapping("/verification-details")
    public ResponseEntity<?> submitVerificationDetails(@RequestBody java.util.Map<String, String> body) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.submitVerificationDetails(email, body.get("aadhaarNumber"), body.get("panNumber")));
    }

    @PostMapping("/provider-setup")
    public ResponseEntity<?> providerSetup(@RequestBody java.util.Map<String, Object> body) {
        String email = (String) body.get("email");
        String address = (String) body.get("address");
        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        return ResponseEntity.ok(userService.saveProviderSetup(email, address, latitude, longitude));
    }
}
