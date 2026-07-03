package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.ServiceResponse;
import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getRecommendations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get client's booking history
        List<Booking> bookings = bookingRepository.findByClientEmail(email);

        // Extract categories they've booked
        Set<String> bookedCategories = bookings.stream()
                .map(b -> b.getService().getCategory())
                .collect(Collectors.toSet());

        // Extract service IDs they've already booked
        Set<Long> bookedServiceIds = bookings.stream()
                .map(b -> b.getService().getId())
                .collect(Collectors.toSet());

        // Get all available services
        List<ServiceListing> allServices = serviceRepository.findByIsAvailableTrue();

        // Score each service
        List<Map<String, Object>> scored = allServices.stream()
                .filter(s -> !bookedServiceIds.contains(s.getId())) // exclude already booked
                .filter(s -> !s.getProvider().getEmail().equals(email)) // exclude own services
                .map(s -> {
                    int score = 0;

                    // +3 if category matches booking history
                    if (bookedCategories.contains(s.getCategory())) score += 3;

                    // +2 if provider is verified
                    if (Boolean.TRUE.equals(s.getProvider().getIsProviderVerified())) score += 2;

                    // +1 if provider is active
                    if (Boolean.TRUE.equals(s.getProvider().getIsActive())) score += 1;

                    Map<String, Object> entry = new HashMap<>();
                    entry.put("service", s);
                    entry.put("score", score);
                    return entry;
                })
                .sorted((a, b) -> (int) b.get("score") - (int) a.get("score"))
                .limit(6)
                .collect(Collectors.toList());

        // Map to ServiceResponse
        List<ServiceResponse> result = scored.stream().map(entry -> {
            ServiceListing s = (ServiceListing) entry.get("service");
            return new ServiceResponse(
                    s.getId(),
                    s.getTitle(),
                    s.getDescription(),
                    s.getCategory(),
                    s.getPrice(),
                    s.getImageUrl(),
                    s.getIsAvailable(),
                    s.getProvider().getName(),
                    s.getProvider().getEmail(),
                    s.getProvider().getId(),
                    s.getProvider().getLatitude(),    // 👈 add this
                    s.getProvider().getLongitude(),
                    s.getProvider().getAddress()

            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}