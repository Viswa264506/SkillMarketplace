package com.skillmarket.skill_marketplace.repository;

import com.skillmarket.skill_marketplace.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByServiceId(Long serviceId);
    boolean existsByClientEmailAndServiceId(String email, Long serviceId);
    List<Review> findByServiceProviderId(Long providerId);
}