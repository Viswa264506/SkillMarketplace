package com.skillmarket.skill_marketplace.repository;

import com.skillmarket.skill_marketplace.entity.ServiceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceListing, Long> {

    List<ServiceListing> findByCategory(String category);

    List<ServiceListing> findByProviderEmail(String email);

    List<ServiceListing> findByIsAvailableTrue();

    List<ServiceListing> findByTitleContainingIgnoreCase(String keyword);

    List<ServiceListing> findByProviderIdAndIsAvailableTrue(Long providerId);
}