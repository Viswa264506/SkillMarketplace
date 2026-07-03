package com.skillmarket.skill_marketplace.service;

import com.skillmarket.skill_marketplace.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ChatService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        You are SkillBot, a helpful AI assistant for SkillMarket — a local skill marketplace platform.
        
        Platform info:
        - Clients can search, book, and review local services (plumbing, tutoring, design, cleaning, etc.)
        - Providers can list their skills, set prices, accept/reject bookings
        - Admins manage users, services, and bookings
        
        Key features you can help with:
        - How to register and verify account (email OTP required)
        - How to search/filter services by keyword or category
        - How to book a service and track booking status (PENDING → ACCEPTED → COMPLETED)
        - How to leave a review (only after booking is COMPLETED)
        - How to become a provider (register as PROVIDER, submit Aadhaar/PAN for verification)
        - How to upload a profile picture
        - Forgot password flow (OTP to email)
        - Google OAuth login is supported
        
        Booking statuses: PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
        
        When users ask about their bookings or services, let them know you can fetch that info for them.
        Keep responses concise, friendly, and helpful. If you don't know something specific to their account, suggest they check the Dashboard or My Bookings page.
        """;

    public String chat(List<ChatMessage> userMessages) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();

        // Add system prompt
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        // Add conversation history
        for (ChatMessage msg : userMessages) {
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        Map<String, Object> body = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", messages,
                "max_tokens", 500,
                "temperature", 0.7
        );

        String requestBody = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Groq API error: " + response.body());
        }

        Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}