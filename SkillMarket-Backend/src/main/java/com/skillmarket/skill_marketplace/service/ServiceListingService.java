package com.skillmarket.skill_marketplace.service;

import com.skillmarket.skill_marketplace.dto.ServiceRequest;
import com.skillmarket.skill_marketplace.dto.ServiceResponse;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceListingService {

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    // Get currently logged in user
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Convert entity to response DTO
    private ServiceResponse toResponse(ServiceListing s) {
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
                s.getProvider().getLatitude(),
                s.getProvider().getLongitude(),
                s.getProvider().getAddress()
        );
    }

    // PROVIDER: create a new service
    public ServiceResponse createService(ServiceRequest request) {
        User provider = getCurrentUser();

        ServiceListing service = ServiceListing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isAvailable(true)
                .provider(provider)
                .build();

        return toResponse(serviceRepository.save(service));
    }

    // CLIENT: get all available services
    public List<ServiceResponse> getAllServices() {
        return serviceRepository.findByIsAvailableTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // CLIENT: search by keyword
    public List<ServiceResponse> searchServices(String keyword) {
        return serviceRepository.findByTitleContainingIgnoreCase(keyword)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // CLIENT: filter by category
    public List<ServiceResponse> getByCategory(String category) {
        return serviceRepository.findByCategory(category)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // PROVIDER: get my own services
    public List<ServiceResponse> getMyServices() {
        User provider = getCurrentUser();
        return serviceRepository.findByProviderEmail(provider.getEmail())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // PROVIDER: delete a service
    public void deleteService(Long id) {
        serviceRepository.deleteById(id);
    }
}