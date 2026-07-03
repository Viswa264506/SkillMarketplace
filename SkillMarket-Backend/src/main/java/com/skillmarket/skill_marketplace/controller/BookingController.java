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

    // ==========================
    // CLIENT - Create Booking
    // ==========================
    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @RequestBody BookingRequest request) {

        return ResponseEntity.ok(
                bookingService.createBooking(request)
        );
    }

    // ==========================
    // CLIENT - My Bookings
    // ==========================
    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> myBookings() {

        return ResponseEntity.ok(
                bookingService.getMyBookings()
        );
    }

    // ==========================
    // PROVIDER - Provider Bookings
    // ==========================
    @GetMapping("/provider-bookings")
    public ResponseEntity<List<BookingResponse>> providerBookings() {

        return ResponseEntity.ok(
                bookingService.getBookingsForMyServices()
        );
    }

    // ==========================
    // PROVIDER - Accept / Complete
    // ==========================
    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                bookingService.updateStatus(id, status)
        );
    }

    // ==========================
    // PROVIDER - Reject Booking
    // ==========================
    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        return ResponseEntity.ok(
                bookingService.rejectBooking(
                        id,
                        body.get("reason")
                )
        );
    }

    // ==========================
    // CLIENT - Cancel Booking
    // ==========================
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.cancelBooking(id)
        );
    }

    // ==========================
    // PROVIDER - Update Live Location
    // ==========================
    @PutMapping("/{id}/location")
    public ResponseEntity<BookingResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {

        return ResponseEntity.ok(
                bookingService.updateProviderLocation(
                        id,
                        body.get("lat"),
                        body.get("lng")
                )
        );
    }

    // ==========================
    // CLIENT - Get Provider Location
    // ==========================
    @GetMapping("/{id}/location")
    public ResponseEntity<BookingResponse> getLocation(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.getProviderLocation(id)
        );
    }
}