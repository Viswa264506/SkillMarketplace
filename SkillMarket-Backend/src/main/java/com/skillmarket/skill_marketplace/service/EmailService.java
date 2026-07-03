package com.skillmarket.skill_marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    private void sendEmail(String to, String subject, String body) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        headers.set("accept", "application/json");

        Map<String, Object> payload = new HashMap<>();

        Map<String, String> sender = new HashMap<>();
        sender.put("name", "SkillMarket");
        sender.put("email", senderEmail);
        payload.put("sender", sender);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);
        payload.put("to", new Object[]{recipient});

        payload.put("subject", subject);
        payload.put("textContent", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send email via Brevo: " + e.getMessage());
        }
    }

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