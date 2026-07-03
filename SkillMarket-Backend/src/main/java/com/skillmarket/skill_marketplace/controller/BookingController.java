package com.skillmarket.skill_marketplace.controller;

import com.skillmarket.skill_marketplace.dto.BookingRequest;
import com.skillmarket.skill_marketplace.dto.BookingResponse;
import com.skillmarket.skill_marketplace.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> myBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    @GetMapping("/provider-bookings")
    public ResponseEntity<List<BookingResponse>> providerBookings() {
        return ResponseEntity.ok(bookingService.getBookingsForMyServices());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    // Phase F — provider pushes live location
    @PutMapping("/{id}/location")
    public ResponseEntity<BookingResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(
                bookingService.updateProviderLocation(id, body.get("lat"), body.get("lng"))
        );
    }

    // Phase F — client polls provider location
    @GetMapping("/{id}/location")
    public ResponseEntity<BookingResponse> getLocation(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getProviderLocation(id));
    }
}