package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.entity.BookingStatus;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/client")
    public ResponseEntity<Map<String, Long>> clientStats() {
        String email = getCurrentEmail();
        var bookings = bookingRepository.findByClientEmail(email);

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalBookings", (long) bookings.size());
        stats.put("pending", bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING).count());
        stats.put("accepted", bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.ACCEPTED).count());
        stats.put("completed", bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED).count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/provider")
    public ResponseEntity<Map<String, Long>> providerStats() {
        String email = getCurrentEmail();
        var bookings = bookingRepository.findByServiceProviderEmail(email);
        var services = serviceRepository.findByProviderEmail(email);

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalServices", (long) services.size());
        stats.put("totalBookings", (long) bookings.size());
        stats.put("pending", bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING).count());
        stats.put("completed", bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED).count());

        return ResponseEntity.ok(stats);
    }
}