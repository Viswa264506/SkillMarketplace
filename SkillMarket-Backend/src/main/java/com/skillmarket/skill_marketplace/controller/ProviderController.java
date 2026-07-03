package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.ProviderProfileResponse;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.Review;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ProviderProfileResponse> getProviderProfile(@PathVariable Long id) {

        User provider = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        // Get active services
        List<ServiceListing> services = serviceRepository.findByProviderIdAndIsAvailableTrue(provider.getId());

        // Get all reviews for this provider's services
        List<Review> allReviews = reviewRepository.findByServiceProviderId(provider.getId());

        // Calculate average rating
        double avgRating = allReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        // Build response
        ProviderProfileResponse response = new ProviderProfileResponse();
        response.setId(provider.getId());
        response.setName(provider.getName());
        response.setProfileImageUrl(provider.getProfileImageUrl());
        response.setPhoneNumber(provider.getPhoneNumber());
        response.setMemberSince(provider.getCreatedAt());
        response.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
        response.setTotalReviews((long) allReviews.size());
        response.setIsProviderVerified(Boolean.TRUE.equals(provider.getIsProviderVerified()));

        // Map services
        List<ProviderProfileResponse.ServiceSummary> serviceSummaries = services.stream().map(s -> {
            ProviderProfileResponse.ServiceSummary ss = new ProviderProfileResponse.ServiceSummary();
            ss.setId(s.getId());
            ss.setTitle(s.getTitle());
            ss.setCategory(s.getCategory());
            ss.setPrice(s.getPrice());
            ss.setImageUrl(s.getImageUrl());
            return ss;
        }).toList();

        // Map recent reviews (last 5)
        List<ProviderProfileResponse.ReviewSummary> reviewSummaries = allReviews.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .map(r -> {
                    ProviderProfileResponse.ReviewSummary rs = new ProviderProfileResponse.ReviewSummary();
                    rs.setClientName(r.getClient().getName());
                    rs.setRating(r.getRating());
                    rs.setComment(r.getComment());
                    rs.setCreatedAt(r.getCreatedAt());
                    return rs;
                }).toList();

        response.setServices(serviceSummaries);
        response.setRecentReviews(reviewSummaries);

        return ResponseEntity.ok(response);
    }
}