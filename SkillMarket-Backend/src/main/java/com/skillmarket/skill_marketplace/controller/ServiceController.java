package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.NearbyProviderResponse;
import com.skillmarket.skill_marketplace.dto.ServiceRequest;
import com.skillmarket.skill_marketplace.dto.ServiceResponse;
import com.skillmarket.skill_marketplace.entity.Review;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.ReviewRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import com.skillmarket.skill_marketplace.service.ServiceListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceController {

    private final ServiceListingService serviceListingService;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceRepository serviceRepository;

    @PostMapping
    public ResponseEntity<ServiceResponse> create(@RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceListingService.createService(request));
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getAll() {
        return ResponseEntity.ok(serviceListingService.getAllServices());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ServiceResponse>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(serviceListingService.searchServices(keyword));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ServiceResponse>> byCategory(@PathVariable String category) {
        return ResponseEntity.ok(serviceListingService.getByCategory(category));
    }

    @GetMapping("/my-services")
    public ResponseEntity<List<ServiceResponse>> myServices() {
        return ResponseEntity.ok(serviceListingService.getMyServices());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        serviceListingService.deleteService(id);
        return ResponseEntity.ok("Service deleted successfully");
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyProviderResponse>> getNearbyProviders(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radius) {

        List<User> providers = userRepository.findNearbyProviders(lat, lng, radius);

        List<NearbyProviderResponse> result = providers.stream().map(provider -> {
            NearbyProviderResponse dto = new NearbyProviderResponse();
            dto.setId(provider.getId());
            dto.setName(provider.getName());
            dto.setProfileImageUrl(provider.getProfileImageUrl());
            dto.setLatitude(provider.getLatitude());
            dto.setLongitude(provider.getLongitude());

            double distance = 6371 * Math.acos(
                    Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(provider.getLatitude())) *
                            Math.cos(Math.toRadians(provider.getLongitude()) - Math.toRadians(lng)) +
                            Math.sin(Math.toRadians(lat)) * Math.sin(Math.toRadians(provider.getLatitude()))
            );
            dto.setDistanceKm(Math.round(distance * 10.0) / 10.0);

            List<Review> reviews = reviewRepository.findByServiceProviderId(provider.getId());
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            dto.setAverageRating(Math.round(avg * 10.0) / 10.0);

            int total = serviceRepository.findByProviderIdAndIsAvailableTrue(provider.getId()).size();
            dto.setTotalServices(total);

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}