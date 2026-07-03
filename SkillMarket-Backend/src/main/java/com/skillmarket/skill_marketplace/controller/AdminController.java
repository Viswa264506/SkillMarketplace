package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.skillmarket.skill_marketplace.repository.ReviewRepository;
import com.skillmarket.skill_marketplace.entity.Review;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    // --- USERS ---
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<String> toggleUserActive(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return ResponseEntity.ok(user.getIsActive() ? "User activated" : "User deactivated");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Delete reviews written BY this user (as client)
        List<Review> reviewsByClient = reviewRepository.findAll().stream()
                .filter(r -> r.getClient().getId().equals(id))
                .toList();
        reviewRepository.deleteAll(reviewsByClient);

        // 2. Get this user's services
        List<ServiceListing> userServices = serviceRepository.findAll().stream()
                .filter(s -> s.getProvider().getId().equals(id))
                .toList();

        // 3. Delete reviews ON this user's services
        for (ServiceListing service : userServices) {
            reviewRepository.deleteAll(reviewRepository.findByServiceId(service.getId()));
        }

        // 4. Delete bookings where user is client OR provider
        List<Booking> userBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getClient().getId().equals(id) ||
                        b.getService().getProvider().getId().equals(id))
                .toList();
        bookingRepository.deleteAll(userBookings);

        // 5. Delete user's services
        serviceRepository.deleteAll(userServices);

        // 6. Finally delete the user
        userRepository.deleteById(id);

        return ResponseEntity.ok("User deleted successfully");
    }

    // --- SERVICES ---
    @GetMapping("/services")
    public ResponseEntity<List<ServiceListing>> getAllServices() {
        return ResponseEntity.ok(serviceRepository.findAll());
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<String> deleteService(@PathVariable Long id) {
        serviceRepository.deleteById(id);
        return ResponseEntity.ok("Service deleted");
    }

    // --- BOOKINGS ---
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<String> deleteBooking(@PathVariable Long id) {
        bookingRepository.deleteById(id);
        return ResponseEntity.ok("Booking deleted");
    }

    // --- STATS ---
    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalServices = serviceRepository.count();
        long totalBookings = bookingRepository.count();

        return ResponseEntity.ok(java.util.Map.of(
                "totalUsers", totalUsers,
                "totalServices", totalServices,
                "totalBookings", totalBookings
        ));
    }
    // --- PROVIDER VERIFICATION ---
    @GetMapping("/pending-verifications")
    public ResponseEntity<?> getPendingVerifications() {
        List<User> providers = userRepository.findAll().stream()
                .filter(u -> u.getRole().name().equals("PROVIDER"))
                .filter(u -> (u.getAadhaarNumber() != null || u.getPanNumber() != null))
                .filter(u -> !Boolean.TRUE.equals(u.getIsProviderVerified()))
                .toList();
        return ResponseEntity.ok(providers.stream().map(u -> java.util.Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "aadhaarNumber", u.getAadhaarNumber() != null ? u.getAadhaarNumber() : "",
                "panNumber", u.getPanNumber() != null ? u.getPanNumber() : "",
                "isProviderVerified", u.getIsProviderVerified() != null ? u.getIsProviderVerified() : false
        )).toList());
    }

    @PutMapping("/users/{id}/verify-provider")
    public ResponseEntity<String> verifyProvider(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsProviderVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok("Provider verified successfully");
    }

    @PutMapping("/users/{id}/reject-provider")
    public ResponseEntity<String> rejectProvider(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAadhaarNumber(null);
        user.setPanNumber(null);
        user.setIsProviderVerified(false);
        userRepository.save(user);
        return ResponseEntity.ok("Provider verification rejected");
    }
}