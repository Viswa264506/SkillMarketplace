package com.skillmarket.skill_marketplace.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProviderProfileResponse {

    private Long id;
    private String name;
    private String profileImageUrl;
    private String phoneNumber;
    private LocalDateTime memberSince;
    private Double averageRating;
    private Long totalReviews;
    private List<ServiceSummary> services;
    private List<ReviewSummary> recentReviews;
    private Boolean isProviderVerified;

    @Data
    public static class ServiceSummary {
        private Long id;
        private String title;
        private String category;
        private Double price;
        private String imageUrl;
    }

    @Data
    public static class ReviewSummary {
        private String clientName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}