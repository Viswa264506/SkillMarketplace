package com.skillmarket.skill_marketplace.service;

import com.skillmarket.skill_marketplace.dto.BookingRequest;
import com.skillmarket.skill_marketplace.dto.BookingResponse;
import com.skillmarket.skill_marketplace.entity.Booking;
import com.skillmarket.skill_marketplace.entity.BookingStatus;
import com.skillmarket.skill_marketplace.entity.ServiceListing;
import com.skillmarket.skill_marketplace.entity.User;
import com.skillmarket.skill_marketplace.repository.BookingRepository;
import com.skillmarket.skill_marketplace.repository.ServiceRepository;
import com.skillmarket.skill_marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private BookingResponse toResponse(Booking b) {
    return new BookingResponse(
            b.getId(),
            b.getService().getTitle(),
            b.getClient().getName(),
            b.getClient().getEmail(),
            b.getService().getProvider().getName(),
            b.getStatus().name(),
            b.getBookingDate().toString(),
            b.getNotes(),
            b.getRejectionReason(),
            b.getProviderLat(),
            b.getProviderLng(),
            b.getLocationUpdatedAt() != null
                    ? b.getLocationUpdatedAt().toString()
                    : null
    );
}

    // CLIENT: book a service
    public BookingResponse createBooking(BookingRequest request) {
        User client = getCurrentUser();

        ServiceListing service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        LocalDateTime bookingDate = LocalDateTime.parse(
                request.getBookingDate(),
                DateTimeFormatter.ISO_LOCAL_DATE_TIME
        );

        Booking booking = Booking.builder()
                .client(client)
                .service(service)
                .status(BookingStatus.PENDING)
                .bookingDate(bookingDate)
                .notes(request.getNotes())
                .build();

        Booking saved = bookingRepository.save(booking);

        try {
            emailService.sendBookingCreatedToProvider(
                    service.getProvider().getEmail(),
                    service.getProvider().getName(),
                    client.getName(),
                    service.getTitle()
            );
        } catch (Exception e) {
            System.out.println("Email failed: " + e.getMessage());
        }

        return toResponse(saved);
    }

    // CLIENT: get my bookings
    public List<BookingResponse> getMyBookings() {
        User client = getCurrentUser();
        return bookingRepository.findByClientEmail(client.getEmail())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // PROVIDER: get bookings for my services
    public List<BookingResponse> getBookingsForMyServices() {
        User provider = getCurrentUser();
        return bookingRepository.findByServiceProviderEmail(provider.getEmail())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // PROVIDER: accept or reject booking
    public BookingResponse updateStatus(Long bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.valueOf(status));
        Booking saved = bookingRepository.save(booking);

        try {
            if (status.equals("COMPLETED")) {
                emailService.sendBookingCompletedToClient(
                        booking.getClient().getEmail(),
                        booking.getClient().getName(),
                        booking.getService().getTitle()
                );
            } else {
                emailService.sendBookingStatusToClient(
                        booking.getClient().getEmail(),
                        booking.getClient().getName(),
                        booking.getService().getTitle(),
                        status
                );
            }
        } catch (Exception e) {
            System.out.println("Email failed: " + e.getMessage());
        }

        return toResponse(saved);
    }

    // CLIENT: cancel booking
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        return toResponse(bookingRepository.save(booking));
    }

    // PROVIDER: push live location
    public BookingResponse updateProviderLocation(Long bookingId, Double lat, Double lng) {
        User provider = getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only the provider of this booking can update location
        if (!booking.getService().getProvider().getId().equals(provider.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        if (!booking.getStatus().equals(BookingStatus.ACCEPTED)) {
            throw new RuntimeException("Location sharing only allowed for ACCEPTED bookings");
        }

        booking.setProviderLat(lat);
        booking.setProviderLng(lng);
        booking.setLocationUpdatedAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(booking));
    }

    // CLIENT: poll provider location
    public BookingResponse getProviderLocation(Long bookingId) {
        User client = getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only the client of this booking can poll
        if (!booking.getClient().getId().equals(client.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        return toResponse(booking);
    }

    public BookingResponse rejectBooking(Long id, String reason) {

    Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

    booking.setStatus(BookingStatus.REJECTED);
    booking.setRejectionReason(reason);

    Booking saved = bookingRepository.save(booking);

    try {
        emailService.sendBookingStatusToClient(
                booking.getClient().getEmail(),
                booking.getClient().getName(),
                booking.getService().getTitle(),
                "REJECTED"
        );
    } catch (Exception e) {
        System.out.println("Email failed: " + e.getMessage());
    }

    return toResponse(saved);
}
}