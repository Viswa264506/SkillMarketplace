package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.entity.BookingStatus;
import com.skillmarket.skill_marketplace.entity.Review;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import com.skillmarket.skill_marketplace.repository.ReviewRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Submit a review
    @PostMapping("/{serviceId}")
    public ResponseEntity<?> submitReview(
            @PathVariable Long serviceId,
            @RequestBody Map<String, Object> body) {

        User client = getCurrentUser();

        // Check if client has a COMPLETED booking for this service
        List<Booking> bookings = bookingRepository.findByClientEmail(client.getEmail());
        boolean hasCompleted = bookings.stream().anyMatch(b ->
                b.getService().getId().equals(serviceId) &&
                        b.getStatus() == BookingStatus.COMPLETED
        );

        if (!hasCompleted) {
            return ResponseEntity.badRequest()
                    .body("You can only review services you have completed.");
        }

        // Check if already reviewed
        if (reviewRepository.existsByClientEmailAndServiceId(client.getEmail(), serviceId)) {
            return ResponseEntity.badRequest()
                    .body("You have already reviewed this service.");
        }

        ServiceListing service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Review review = Review.builder()
                .client(client)
                .service(service)
                .rating(Integer.parseInt(body.get("rating").toString()))
                .comment(body.get("comment") != null ? body.get("comment").toString() : "")
                .build();

        reviewRepository.save(review);
        return ResponseEntity.ok("Review submitted successfully!");
    }

    // Get all reviews for a service
    @GetMapping("/{serviceId}")
    public ResponseEntity<?> getReviews(@PathVariable Long serviceId) {
        List<Review> reviews = reviewRepository.findByServiceId(serviceId);

        List<Map<String, Object>> result = reviews.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("clientName", r.getClient().getName());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("createdAt", r.getCreatedAt().toString());
            return map;
        }).toList();

        double avgRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("reviews", result);
        response.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
        response.put("totalReviews", reviews.size());

        return ResponseEntity.ok(response);
    }
}