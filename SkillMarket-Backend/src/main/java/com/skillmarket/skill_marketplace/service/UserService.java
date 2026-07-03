package com.skillmarket.skill_marketplace.service;

import com.skillmarket.skill_marketplace.dto.AuthResponse;
import com.skillmarket.skill_marketplace.dto.LoginRequest;
import com.skillmarket.skill_marketplace.dto.RegisterRequest;
import com.skillmarket.skill_marketplace.dto.UpdateProfileRequest;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    // REGISTER
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        String refreshToken = jwtService.generateRefreshToken();
        String otp = generateOtp();

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .isVerified(false)
                .refreshToken(refreshToken)
                .refreshTokenExpiry(LocalDateTime.now().plusDays(7))
                .otp(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), user.getName(), otp);

        return new AuthResponse(null, null, user.getName(), user.getEmail(), user.getRole().name());
    }

    // LOGIN
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("EMAIL_NOT_VERIFIED");
        }

        String refreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, refreshToken, user.getName(), user.getEmail(), user.getRole().name());
    }

    // VERIFY OTP
    public String verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired. Please request a new one.");
        }

        if (!user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP.");
        }

        user.setIsVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "Email verified successfully! You can now login.";
    }

    // RESEND OTP
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Email already verified.");
        }

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendOtpEmail(email, user.getName(), otp);
        return "OTP resent successfully!";
    }

    // REFRESH ACCESS TOKEN
    public AuthResponse refreshAccessToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (user.getRefreshTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token expired, please login again");
        }

        String newAccessToken = jwtService.generateToken(user);
        return new AuthResponse(newAccessToken, refreshToken, user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new AuthResponse(null, null, user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getLatitude() != null) user.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) user.setLongitude(request.getLongitude());
        if (request.getAddress() != null) user.setAddress(request.getAddress());

        userRepository.save(user);
        return new AuthResponse(null, null, user.getName(), user.getEmail(), user.getRole().name());
    }

    // FORGOT PASSWORD - send OTP
    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendPasswordResetOtp(email, user.getName(), otp);
        return "Password reset OTP sent to your email.";
    }

    // RESET PASSWORD - verify OTP + set new password
    public String resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "Password reset successfully! You can now login.";
    }

    public String submitVerificationDetails(String email, String aadhaarNumber, String panNumber) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (aadhaarNumber != null) user.setAadhaarNumber(aadhaarNumber);
        if (panNumber != null) user.setPanNumber(panNumber);
        userRepository.save(user);

        return "Verification details submitted successfully. Admin will review shortly.";
    }

    public String saveProviderSetup(String email, String address, Double latitude, Double longitude) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (address != null) user.setAddress(address);
        if (latitude != null) user.setLatitude(latitude);
        if (longitude != null) user.setLongitude(longitude);
        userRepository.save(user);
        return "Provider setup complete!";
    }
}