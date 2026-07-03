package com.skillmarket.skill_marketplace.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    // Called when client creates a booking → notify provider
    public void sendBookingCreatedToProvider(String providerEmail, String providerName,
                                             String clientName, String serviceName) {
        sendEmail(
                providerEmail,
                "New Booking Request - SkillMarket",
                "Hi " + providerName + ",\n\n" +
                        "You have a new booking request!\n\n" +
                        "Client: " + clientName + "\n" +
                        "Service: " + serviceName + "\n\n" +
                        "Please login to SkillMarket to accept or reject the booking.\n\n" +
                        "Thanks,\nSkillMarket Team"
        );
    }

    // Called when provider accepts/rejects → notify client
    public void sendBookingStatusToClient(String clientEmail, String clientName,
                                          String serviceName, String status) {
        sendEmail(
                clientEmail,
                "Booking " + status + " - SkillMarket",
                "Hi " + clientName + ",\n\n" +
                        "Your booking status has been updated!\n\n" +
                        "Service: " + serviceName + "\n" +
                        "Status: " + status + "\n\n" +
                        "Login to SkillMarket to view details.\n\n" +
                        "Thanks,\nSkillMarket Team"
        );
    }

    // Called when booking is completed → notify client
    public void sendBookingCompletedToClient(String clientEmail, String clientName,
                                             String serviceName) {
        sendEmail(
                clientEmail,
                "Service Completed - SkillMarket",
                "Hi " + clientName + ",\n\n" +
                        "Your service has been completed!\n\n" +
                        "Service: " + serviceName + "\n\n" +
                        "We hope you had a great experience!\n" +
                        "Don't forget to leave a review.\n\n" +
                        "Thanks,\nSkillMarket Team"
        );
    }

    public void sendOtpEmail(String to, String name, String otp) {
        sendEmail(
                to,
                "Verify Your Email - SkillMarket",
                "Hi " + name + ",\n\n" +
                        "Welcome to SkillMarket! Please verify your email using the OTP below:\n\n" +
                        "OTP: " + otp + "\n\n" +
                        "This OTP is valid for 10 minutes.\n" +
                        "Do not share this OTP with anyone.\n\n" +
                        "Thanks,\nSkillMarket Team"
        );
    }

    public void sendPasswordResetOtp(String to, String name, String otp) {
        sendEmail(
                to,
                "Password Reset OTP - SkillMarket",
                "Hi " + name + ",\n\n" +
                        "We received a request to reset your password.\n\n" +
                        "OTP: " + otp + "\n\n" +
                        "This OTP is valid for 10 minutes.\n" +
                        "If you didn't request this, ignore this email.\n\n" +
                        "Thanks,\nSkillMarket Team"
        );
    }
}